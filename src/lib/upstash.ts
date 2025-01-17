import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import ragChat from "@/lib/rag.server";
import { Redis } from "@upstash/redis";

export const updateUpstash = async (index, namespace, docs) => {
  let counter = 0;
  for (let i = 0; i < docs.length; i++) {
    const text = docs[i]["pageContent"];
    counter = counter + 1;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    const chunks = await textSplitter.createDocuments([text]);
    const embeddingsArrays =
      await new HuggingFaceInferenceEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );
    const batchSize = 100;
    let batch = [];
    let pageContent = "";
    for (let idx = 0; idx < chunks.length; idx++) {
      const vector = {
        id: `${counter}_${idx}`,
        values: embeddingsArrays[idx],
      };

      pageContent += chunks[idx].pageContent + " ";

      batch = [...batch, vector];
      if (batch.length === batchSize || idx === chunks.length - 1) {
        const response = await index.upsert(
          {
            id: batch[0].id,
            vector: batch[0].values,
            metadata: { content: pageContent },
          },
          { namespace: namespace }
        );
        console.log(`Batch: ${counter} response: ${JSON.stringify(response)}`);
        batch = [];
        pageContent = "";
      }
    }
  }
};

export const queryUpstashAndLLM = async (
  index,
  namespace,
  sessionId,
  question
) => {
  const embeddingsArrays =
    await new HuggingFaceInferenceEmbeddings().embedDocuments([question]);
  const queryResponse = await index.query(
    {
      topK: 10,
      vector: embeddingsArrays[0],
      includeVectors: false,
      includeMetadata: true,
    },
    { namespace: namespace }
  );
  console.log(queryResponse[0].metadata);
  if (queryResponse.length >= 1) {
    //let promiseList = [];
    for (let idx = 0; idx < queryResponse.length; idx++) {
      try {
        const context = queryResponse[0].metadata.content;
        await ragChat.context.add({
          type: "text",
          data: context,
          options: { namespace: namespace },
        });
      } catch (err) {
        console.log(`There was an error ${err}`);
      }
    }
  }

  const response = await ragChat.chat(question, {
    streaming: true,
    namespace,
    sessionId,
    similarityThreshold: 0.7,
    historyLength: 5,
    topK: 5,
  });
  return response;
};

export const deleteUpstashRedis = async (index, namespace, sessionId) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  const history = await redis.keys(`${sessionId}*`);
  for (const key of history) {
    await redis.del(key);
  }
  const context = await redis.keys(`${namespace}*`);
  for (const key of context) {
    await redis.del(key);
  }
};
