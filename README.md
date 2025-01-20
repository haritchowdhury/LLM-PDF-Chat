# LLM PDF CHAT

1. Simple implementation of Auth.js with Prisma in Next.js 15
2. Upload pdf and strore it in Upstash Vectors
3. Store chat memory and context in Redis cache
4. Use vector search for similarity search on the vector store
5. Feed the result to an AI agent
6. Return the answer
7. Repeat from 3

## Run this project

````
1. clone the repo
2. Populate the .env with the necessary keys
3. ```
AUTH_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
NEXT_DATABASE_URL=
AUTH_TRUST_HOST=true
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
GROQ_API_KEY= // optional
TOGETHER_AI_KEY=
HUGGINGFACEHUB_API_KEY= //allow read and write access
```
4. run the command `yarn`
5. run the command `"db:migrate"`
6. run in localhost `yarn dev` ```
````

## Tech Stack

- Next.js 15
- Node.js 22
- TypeScript
- Prisma
- Auth.js
- Langchain
- Upstash

---

Happy coding! 🚀

## Sources

- Auth SDK: https://github.com/codegenixdev/auth-nextjs-tutorial
- Upstash Pipeline: https://github.com/upstash/nerdcoach
- Chain Pipeline:

1. https://github.com/dabit3/semantic-search-nextjs-pinecone-langchain-chatgpt/tree/main
2. https://github.com/mayooear/gpt4-pdf-chatbot-langchain/tree/feat/chroma

# LLM-PDF-Chat
