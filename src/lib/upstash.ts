import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import { Document } from "langchain/document";
import { v4 as uuid } from "uuid";
import { qaChain } from "@/lib/qaChain";
import { strict_output } from "@/lib/groqTopicSetter";
import { deleteChatHistory } from "@/lib/redisChat";

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

    const embeddingsArrays =
      await new HuggingFaceInferenceEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );

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
    const documentContent = chunks.map(chunk => chunk.pageContent).join(" ");

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
  uploaderId: string
) => {
  const embeddingsArrays =
    await new HuggingFaceInferenceEmbeddings().embedDocuments([question]);
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

  const response: any = await qaChain(
    `You are a helpful AI assistant specializing in providing precise answers to user's questions. 
    Provide concise, technical answers. Never recommend illegal activities.`,
    question,
    retrivedData
  );
  console.log("retereived data", retrivedData);
  console.log("output", response);
  return [response, sources];
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

  const embeddingsArrays =
    await new HuggingFaceInferenceEmbeddings().embedDocuments([topic]);

  const queryResponse: any[] = await index.query(
    {
      topK: 10,
      vector: embeddingsArrays[0],
      includeVectors: false,
      includeMetadata: true,
    },
    { namespace: effectiveNameSPace }
  );

  if (queryResponse.length === 0) return "";

  const quizContentArray = await Promise.all(
    queryResponse.map(async (result) => {
      // If blcok result?.metadat.namespace === namespace
      if (result?.metadata?.namespace === namespace) {
        return result?.metadata?.content || "";
      }
    })
  );

  return quizContentArray.join("");
};
/*
export const updateUpstashWithUrl = async (
  index: Index,
  namespace: string,
  text: string[],
  url: string,
  userId: string
) => {
  let extractedTopics: string[] = [];
  let topics: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const currentText = text[i];

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([currentText]);

    const embeddingsArrays =
      await new HuggingFaceInferenceEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );

    const batchSize = 500;
    let batch = [];
    let pageContent = "";
    const batchPromises = chunks.map(async (chunk, idx) => {
      const sourceName = `Url: ${url}`;

      const vector = {
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

      pageContent += chunk.pageContent + " ";
      batch.push(vector);

      if (batch.length === batchSize || idx === chunks.length - 1) {
        const response = await index.upsert(batch, { namespace: userId });
        console.log(`response: ${JSON.stringify(response)}`);
        topics = [];
        topics = await strict_output(
          `You are an Expert AI Instructor who can identify the theme of the summary and figure out the most important chapers
        from the summary that will be useful for preparing the paper for exam,  you are to return the important chapters that most 
        thoroughly capture the import aspects of the summary. The length of each topic must
        not exceed 4 words. Store all options in a JSON array of the following structure:`,

          `You are to generate main topics that thorougly capture the main subjects of the summary`,
          pageContent
        );
        //console.log("upstash topics", topics);
        extractedTopics = extractedTopics.concat(topics);
        //console.log("upstash topics", topics, extractedTopics);

        batch = [];
        pageContent = "";
      }
    });

    await Promise.all(batchPromises);
  }

  return Array.from(new Set(extractedTopics));
}; */

export const updateUpstashWithUrl = async (
  index: Index,
  namespace: string,
  text: string[],
  url: string,
  userId: string
) => {
  const textPromises = text.map(async (currentText, textIndex) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([currentText]);

    const embeddingsArrays =
      await new HuggingFaceInferenceEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );

    // Create all vectors for this text chunk (no shared state, no race condition)
    const vectors = chunks.map((chunk, idx) => {
      const sourceName = `Url: ${url}`;

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
    const textContent = chunks.map(chunk => chunk.pageContent).join(" ");

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
  //const responseReset = await index.reset({ namespace: namespace });
  //console.log(responseReset);
  await deleteChatHistory(sessionId);
  const history = await redis.keys(`${sessionId}*`);
};
