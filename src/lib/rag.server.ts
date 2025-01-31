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
    `You are an expert assistant who has access to upstash Vector Store. 
  You can go through large chunks of text and pinpoint the exact information 
  the user is asking for. Give them a breif analysis of the content you find relevant. 
  Pay close attention to detail and don't provide dubious information that may not be 
  present in Vector Store and provided context.  Keep the 
  conversation relevant to ${chatHistory}.
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
