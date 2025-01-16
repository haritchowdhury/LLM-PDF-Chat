import { RAGChat, custom } from "@upstash/rag-chat";
import { Redis } from "@upstash/redis";

export default new RAGChat({
  model: custom("meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", {
    apiKey: process.env.TOGETHER_AI_KEY,
    baseUrl: "https://api.together.xyz/v1",
  }),
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  }),
  promptFn: ({ context, question, chatHistory }) =>
    `You are an AI document analyser with access to an Upstash Vector Store. 
  Be supportive and provide summarised information from ${chatHistory} and ${context}.
  If the answer isn't available, politely inform the user.
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
