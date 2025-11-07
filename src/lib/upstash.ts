import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import { Document } from "langchain/document";
import { v4 as uuid } from "uuid";
import { qaChain } from "@/lib/qaChain";
import { strict_output } from "@/lib/groqTopicSetter";
import {
  deleteChatHistory,
  getChatHistory,
  saveMessage,
  Message,
} from "@/lib/redisChat";

interface Metadata {
  content: string;
}
interface Vector {
  id: string;
  vector: number[];
  // sparseVector: SparseVector; // Ensures compatibility
  metadata: Metadata;
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const updateUpstash = async (
  index: Index,
  namespace: string,
  docs: Document[],
  fileName: string,
  userId: string
) => {
  // Process all documents and collect content for topic generation
  const promiseList = docs.map(async (doc, counter) => {
    const text = doc["pageContent"];

    console.log("page content text length:", text.length);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.createDocuments([text]);
    console.log(`Created ${chunks.length} chunks, starting embeddings...`);

    const embedder = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
      dimensions: 768, // Match Upstash index dimension
    });

    const embeddingsArrays = await embedder.embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );
    console.log("Embeddings generated successfully");

    // Create all vectors for this document (no shared state, no race condition)
    const vectors = chunks.map((chunk, idx) => {
      const sourceName = `${fileName}, Page ${counter + 1}`;

      return {
        id: uuid(),
        vector: embeddingsArrays[idx],
        metadata: {
          content: chunk.pageContent,
          source: sourceName,
          fileName: fileName,
          pageNumber: counter + 1,
          namespace: namespace,
        },
      };
    });

    // Collect all content from this document for topic generation
    const documentContent = chunks.map((chunk) => chunk.pageContent).join(" ");

    // Batch upsert sequentially to avoid race conditions
    const batchSize = 500;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      const response = await index.upsert(batch, { namespace: userId });
      console.log(`Batch: ${counter} response: ${JSON.stringify(response)}`);
    }

    // Return content for topic generation
    return documentContent;
  });

  // Wait for all documents to be processed
  const allDocumentContents = await Promise.all(promiseList);
  const allContent = allDocumentContents.join("\n\n");

  console.log("All upserting complete. Generating topics...");

  // Generate topics once with all content (reduces 50+ LLM calls to 1-3)
  const maxChunkSize = 15000;
  const contentChunks = [];
  for (let i = 0; i < allContent.length; i += maxChunkSize) {
    contentChunks.push(allContent.slice(i, i + maxChunkSize));
  }

  const topicPromises = contentChunks.map(async (contentChunk) => {
    const topics = await strict_output(
      `You are an Expert AI Instructor who can identify the theme of the summary and figure out the most important chapers
      from the summary that will be useful for preparing the paper for exam,  you are to return the important chapters that most
      thoroughly capture the import aspects of the summary. The length of each topic must
      not exceed 4 words. Store all options in a JSON array of the following structure:`,
      `You are to generate main topics that thorougly capture the main subjects of the summary`,
      contentChunk
    );
    return topics;
  });

  const topicsArrays = await Promise.all(topicPromises);
  const extractedTopics = topicsArrays.flat();

  console.log("Topic generation complete");
  return Array.from(new Set(extractedTopics));
};

export const queryUpstashAndLLM = async (
  index: Index,
  namespace: string,
  question: string,
  userId: string,
  isPersonal: boolean,
  uploaderId: string,
  sessionId?: string
) => {
  // Retrieve chat history for conversational memory
  const chatHistoryKey = sessionId || namespace; // Use sessionId if provided, otherwise namespace
  const chatHistory = await getChatHistory(chatHistoryKey, 10); // Get last 10 messages

  const embedder = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
    dimensions: 768, // Match Upstash index dimension
  });
  const embeddingsArrays = await embedder.embedDocuments([question]);
  const effectiveNameSPace = isPersonal ? userId : uploaderId;
  const queryResponse: any[] = await index.query(
    {
      topK: 100,
      vector: embeddingsArrays[0],
      includeVectors: false,
      includeMetadata: true,
    },
    { namespace: effectiveNameSPace }
  );
  let retrivedData: string = "";
  let sources: string[] = [];
  //console.log("index query", queryResponse);
  if (queryResponse.length >= 1) {
    const contextPromises = queryResponse.map(async (result) => {
      // If block result?.metadata.namespace = namespace
      if (result?.metadata?.namespace === namespace) {
        try {
          const context = result?.metadata?.content;
          retrivedData += `<Source> ${result?.metadata?.source} </Source>`;
          retrivedData += context;
          if (!sources.includes(result?.metadata?.source)) {
            sources.push(result?.metadata?.source);
          }
        } catch (err) {
          console.error(`There was an error: ${err}`);
          return Promise.resolve();
        }
      }
    });

    await Promise.all(contextPromises);
  }

  // Pass chat history and sources to qaChain for conversational context and citation tracking
  const result: any = await qaChain(
    `You are a helpful AI assistant specializing in providing precise answers to user's questions.
    Provide concise, technical answers. Never recommend illegal activities.`,
    question,
    retrivedData,
    chatHistory, // Include conversation history
    sources // Include sources for citation tracking
  );

  // Extract response and cited sources from qaChain result
  const response = result.response || result;
  const citedSources = result.citedSources;

  // Save user message and assistant response to chat history
  const userMessage: Message = {
    role: "user",
    content: question,
    sources: [],
  };

  const assistantMessage: Message = {
    role: "assistant",
    content: response.content || response.text || String(response),
    sources: citedSources, // Use only cited sources
  };

  await saveMessage(chatHistoryKey, userMessage);
  await saveMessage(chatHistoryKey, assistantMessage);

  console.log("retereived data", retrivedData);
  console.log("output", response);
  console.log("cited sources", citedSources);
  return [response, citedSources]; // Return only cited sources
};

export const queryUpstash = async (
  index: Index,
  namespace: string,
  topic: string,
  userId: string,
  isPersonal: boolean,
  uploaderId: string
) => {
  const effectiveNameSPace = isPersonal ? userId : uploaderId;

  console.log("[queryUpstash] Query parameters:", {
    namespace,
    topic,
    userId,
    isPersonal,
    uploaderId,
    effectiveNameSPace,
  });

  const embedder = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small",
    dimensions: 768, // Match Upstash index dimension
  });
  const embeddingsArrays = await embedder.embedDocuments([topic]);

  const queryResponse: any[] = await index.query(
    {
      topK: 10,
      vector: embeddingsArrays[0],
      includeVectors: false,
      includeMetadata: true,
    },
    { namespace: effectiveNameSPace }
  );

  console.log(`[queryUpstash] Query returned ${queryResponse.length} results`);

  if (queryResponse.length === 0) {
    console.log("[queryUpstash] No results from vector query - namespace may not exist or has no vectors");
    return "";
  }

  // Log the namespaces we got back
  const returnedNamespaces = queryResponse.map(r => r?.metadata?.namespace).filter(Boolean);
  console.log(`[queryUpstash] Found ${returnedNamespaces.length} results with metadata.namespace:`,
    [...new Set(returnedNamespaces)]);
  console.log(`[queryUpstash] Filtering for namespace: "${namespace}"`);

  const quizContentArray = await Promise.all(
    queryResponse.map(async (result) => {
      // If blcok result?.metadat.namespace === namespace
      if (result?.metadata?.namespace === namespace) {
        return result?.metadata?.content || "";
      }
    })
  );

  const matchedResults = quizContentArray.filter(c => c && c.length > 0);
  console.log(`[queryUpstash] Matched ${matchedResults.length} results for namespace "${namespace}"`);

  const finalContent = quizContentArray.join("");
  console.log(`[queryUpstash] Returning ${finalContent.length} characters of content`);

  return finalContent;
};

export const updateUpstashWithUrl = async (
  index: Index,
  namespace: string,
  text: string[],
  url: string,
  userId: string
) => {
  const textPromises = text.map(async (currentText, textIndex) => {
    console.log(
      `Processing text chunk ${textIndex}, length: ${currentText.length}`
    );
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });
    console.log("Creating document chunks from URL text...");
    const chunks = await textSplitter.createDocuments([currentText]);
    console.log(`Created ${chunks.length} chunks from URL text`);

    console.log("Generating embeddings for URL content...");
    const embedder = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
      dimensions: 768, // Match Upstash index dimension
    });

    const embeddingsArrays = await embedder.embedDocuments(
      chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
    );
    console.log("URL embeddings generated successfully");

    // Create all vectors for this text chunk (no shared state, no race condition)
    const vectors = chunks.map((chunk, idx) => {
      const sourceName = `Url: ${url}: chunk ${idx}`;

      return {
        id: uuid(),
        vector: embeddingsArrays[idx],
        metadata: {
          content: chunk.pageContent,
          source: sourceName,
          fileName: url,
          pageNumber: 0,
          namespace: namespace,
        },
      };
    });

    // Collect all content from this text chunk for topic generation
    const textContent = chunks.map((chunk) => chunk.pageContent).join(" ");

    // Batch upsert sequentially to avoid race conditions
    const batchSize = 500;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      const response = await index.upsert(batch, { namespace: userId });
      console.log(`response: ${JSON.stringify(response)}`);
    }

    // Return content for topic generation
    return textContent;
  });

  // Wait for all text chunks to be processed
  const allTextContents = await Promise.all(textPromises);
  const allContent = allTextContents.join("\n\n");

  console.log("All upserting complete. Generating topics...");

  // Generate topics once with all content (reduces 50+ LLM calls to 1-3)
  const maxChunkSize = 15000;
  const contentChunks = [];
  for (let i = 0; i < allContent.length; i += maxChunkSize) {
    contentChunks.push(allContent.slice(i, i + maxChunkSize));
  }

  const topicPromises = contentChunks.map(async (contentChunk) => {
    const topics = await strict_output(
      `You are an Expert AI Instructor who can identify the theme of the summary and figure out the most important chapers
      from the summary that will be useful for preparing the paper for exam,  you are to return the important chapters that most
      thoroughly capture the import aspects of the summary. The length of each topic must
      not exceed 4 words. Store all options in a JSON array of the following structure:`,
      `You are to generate main topics that thorougly capture the main subjects of the summary`,
      contentChunk
    );
    return topics;
  });

  const topicsArrays = await Promise.all(topicPromises);
  const extractedTopics = topicsArrays.flat();

  console.log("Topic generation complete");
  return Array.from(new Set(extractedTopics));
};

export const deleteUpstash = async (
  index: Index,
  namespace: string,
  sessionId: string
) => {
  // Extract userId from sessionId (format: upload_userId)
  const userId = sessionId.split("_")[1];

  // Delete chat history from Redis
  await deleteChatHistory(sessionId);
  await redis.del(`${sessionId}*`);

  console.log(
    "Deleting vectors for namespace:",
    namespace,
    "in userId:",
    userId
  );

  // Delete all vector embeddings where metadata.namespace === namespace
  // Using range to fetch all vectors, filter by metadata, and delete by IDs
  try {
    let cursor: string | number = "";
    let totalDeleted = 0;
    const limit = 1000; // Max batch size

    // Keep fetching and deleting until no more vectors remain
    do {
      // Fetch a batch of vectors
      const rangeResult: any = await index.range(
        {
          cursor,
          limit,
          includeMetadata: true,
          includeVectors: false,
        },
        { namespace: userId }
      );

      console.log("Fetched vectors:", rangeResult.vectors?.length || 0);

      // Filter vectors that match our namespace
      const vectorIdsToDelete: string[] = [];
      if (rangeResult.vectors) {
        rangeResult.vectors.forEach((vector: any) => {
          if (vector?.metadata?.namespace === namespace) {
            vectorIdsToDelete.push(vector.id);
          }
        });
      }

      // Delete the matching vectors
      if (vectorIdsToDelete.length > 0) {
        await index.delete(vectorIdsToDelete, { namespace: userId });
        totalDeleted += vectorIdsToDelete.length;
        console.log(
          `Deleted ${vectorIdsToDelete.length} vectors (Total: ${totalDeleted})`
        );
      }

      // Update cursor for next iteration
      cursor = rangeResult.nextCursor || "";

      // If cursor is empty or no more vectors, we're done
      if (
        !cursor ||
        cursor === "" ||
        !rangeResult.vectors ||
        rangeResult.vectors.length === 0
      ) {
        break;
      }
    } while (true);

    console.log(`Total vectors deleted: ${totalDeleted}`);
  } catch (error) {
    console.error("Error deleting vectors from Upstash:", error);
    throw error;
  }
};
