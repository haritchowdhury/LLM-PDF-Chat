import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import { Document } from "langchain/document";
import { summarizer } from "@/lib/groqSummarizer";
import { v4 as uuid } from "uuid";
import { SparseVector } from "@upstash/vector";
import { qaChain } from "@/lib/qaChain";
import { strict_output } from "@/lib/groqTopicSetter";

interface Metadata {
  content: string;
}
interface Vector {
  id: string;
  vector: number[];
  // sparseVector: SparseVector; // Ensures compatibility
  metadata: Metadata;
}

export const updateUpstash = async (
  index: Index,
  namespace: string,
  docs: Document[],
  fileName: string
) => {
  let extractedTopics: string[] = [];
  let topics: string[] = [];
  const promiseList = docs.map(async (doc, counter) => {
    const text = doc["pageContent"];
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([text]);

    const embeddingsArrays =
      await new HuggingFaceInferenceEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );

    const batchSize = 500;
    let batch = [];
    let pageContent = "";
    const batchPromises = chunks.map(async (chunk, idx) => {
      const sourceName = `${fileName}, Page ${counter + 1}`;

      const vector = {
        id: uuid(),
        vector: embeddingsArrays[idx],
        metadata: {
          content: chunk.pageContent,
          source: sourceName,
          fileName: fileName,
          pageNumber: counter + 1,
        },
      };

      pageContent += chunk.pageContent + " ";
      batch.push(vector);

      if (batch.length === batchSize || idx === chunks.length - 1) {
        const response = await index.upsert(batch, { namespace: namespace });
        console.log(`Batch: ${counter} response: ${JSON.stringify(response)}`);
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
  });

  await Promise.all(promiseList);
  //console.log("extracted at upstash", extractedTopics);
  return Array.from(new Set(extractedTopics));
};

export const queryUpstashAndLLM = async (
  index: Index,
  namespace: string,
  question: string
) => {
  const embeddingsArrays =
    await new HuggingFaceInferenceEmbeddings().embedDocuments([question]);
  const queryResponse: any[] = await index.query(
    {
      topK: 10,
      vector: embeddingsArrays[0],
      includeVectors: false,
      includeMetadata: true,
    },
    { namespace }
  );
  let retrivedData: string = "";
  let sources: string[] = [];
  //console.log("index query", queryResponse);
  if (queryResponse.length >= 1) {
    const contextPromises = queryResponse.map(async (result) => {
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
    });

    await Promise.all(contextPromises);
  }

  const response: any = await qaChain(
    `You are a helpful AI assistant specializing in providing precise answers to user's questions. 
    Provide concise, technical answers. Never recommend illegal activities.`,
    question,
    retrivedData
  );
  console.log("output", response);
  return [response, sources];
};

export const queryUpstash = async (
  index: Index,
  namespace: string,
  topic: string
) => {
  const embeddingsArrays =
    await new HuggingFaceInferenceEmbeddings().embedDocuments([topic]);

  const queryResponse: any[] = await index.query(
    {
      topK: 10,
      vector: embeddingsArrays[0],
      includeVectors: false,
      includeMetadata: true,
    },
    { namespace }
  );

  if (queryResponse.length === 0) return "";

  const quizContentArray = await Promise.all(
    queryResponse.map(async (result) => result?.metadata?.content || "")
  );

  return quizContentArray.join("");
};

export const deleteUpstash = async (
  index: Index,
  namespace: string,
  sessionId: string,
  taskId: number
) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  if (taskId == 1) {
    const responseReset = await index.reset({ namespace: namespace });
    console.log(responseReset);
    const history = await redis.keys(`${sessionId}*`);
    for (const key of history) {
      await redis.del(key);
    }
  }
  const context = await redis.keys(`${namespace}*`);
  for (const key of context) {
    await redis.del(key);
  }
};
