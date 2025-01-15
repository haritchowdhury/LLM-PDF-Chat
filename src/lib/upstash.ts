import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

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
  console.log(queryResponse[0].metadata.content);
  /*if (queryResponse.matches.length) {
  }*/

  return queryResponse;
};
