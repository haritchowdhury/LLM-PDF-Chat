import { RAGChat, custom } from "@upstash/rag-chat";

export default new RAGChat({
  model: custom("meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", {
    apiKey: process.env.TOGETHER_AI_KEY,
    baseUrl: "https://api.together.xyz/v1",
  }),
  prompt: ({ context, question, chatHistory }) =>
    `Answer questions from available context , do not answer if it in not in ${context}
  ------
  Chat history:
  ${chatHistory}
  ------
  Context:
  ${context}
  ------
  Question: ${question}
  Answer:`,
});
