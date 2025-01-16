import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import ragChat from "@/lib/rag.server";

export const updateUpstash = async (index, namespace, docs) => {
  let counter = 0;
  for (let i = 0; i < docs.length; i++) {
    const text = docs[i]["pageContent"];
    counter = counter + 1;

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([text]);
    const embeddingsArrays =
      await new HuggingFaceInferenceEmbeddings().embedDocuments(
        chunks.map((chunk) => chunk.pageContent.replace(/\n/g, " "))
      );
    const batchSize = 100;
    let batch: any = [];
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

export const queryUpstashAndLLM = async (index, namespace, question) => {
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
  //console.log(queryResponse[0].metadata.content);
  let context = "";
  if (queryResponse.length >= 1) {
    //let promiseList = [];
    for (let idx = 0; idx < queryResponse.length; idx++) {
      try {
        context += queryResponse[0].metadata.content;
      } catch (err) {
        console.log(`There was an error ${err}`);
      }
    }
  }
  console.log(context);
  await ragChat.context.add({
    type: "text",
    data: context,
    options: { namespace: namespace },
  });
  return "Ok:200";
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
