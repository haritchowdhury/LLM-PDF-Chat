## aiversety

aiversety.xyz

## Description

```
A host of AI agents working together to maximize content retention from the documents of your choice
by allowing you to chat with them, pointing out the imporatnt topics from the docuemnts, and enabling you
to take dynamic quizzes from the topics of your choice from the documents.

Educational content creators can compile their resources and content in a document and share it with
other users by using the public upload functionality and share the chat room link across various social media websites. Creators earn money everytime other users unlock the quiz component from any of their published documents. Creators can withdraw the collected amount any time they want from their profile section.
```

---

## Modules

```
1. Chat module: allows users to chat with a document
2. Quiz Module: allows users to take AI generated quizzes from any topic from the given document
3. Topic Module: allows users to find the imporatant topics from the docuemnt
4. Contract Integrations: charges users to unlock the quiz, and processes refunds, lets users monetise their publications and withdraw funds.
```

---

## Functionalities

```
1. Lets users upload a document and chat with it
2. Only answers from the uploaded documents and not the LLM's own knowledgebase
3. Takes care of catastrophc forgetting by restricting the agent's context
4. Makes use of strict optput parsing using JSON to create other functionalities
5. JSON output parser extracts output from LLM in a formatted way which can be used by the frontend components.
6. These structures outputs are used to create quizzes and important topics from the document
7. The project is integrated with two smart contracts deployed on EDU testnet
8. The first (Milestones) charges users to unlock the Quiz component
9. As the users take the AI generated quizzes from the dynamically created topics they get to claim milestones
10. By claiming these milestones they can claim refunds to their wallets
11. If they do not claim these milestones within a given timeframe they can't get the refunds
12. The second contract (Creators-Economy) is used for articles that are shared with the community
13. Users can upload their documents privately or publicly
14. When the documents are publicly uploaded they show up on the home page
15. When users unlock the quiz component for these public documents 50% of the money is paid directly to the creators who oploaded the documents
16. The users can claim the remaining 50% by compleating the quizzes from the dynamically created topics
17. Users need to complete the topics within a given timeframe of unlocking the quiz to get their refunds
```

---

## Contracts

```
1. Milestones Contract - For private uploads : 0x5e831A94139712C7C480d9B9fD3290f3c234875c
2. Creator-Economy Contract - For public uploads: 0x8C8D84fB7CE0B68b8f5525CcB10fe4a2387B9C06
```

---

## Run this project

```
1. git clone git@github.com:iminparallel/LLM-PDF-Chat.git - to clone the repo
2. Populate the .env with the necessary keys: detailed guide on how to obtain them is in the next section
3. Example .env file:
AUTH_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
NEXT_DATABASE_URL=""
AUTH_TRUST_HOST=true
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
UPSTASH_VECTOR_REST_URL=""
UPSTASH_VECTOR_REST_TOKEN=""
GROQ_API_KEY=""
TOGETHER_AI_KEY=""
HUGGINGFACEHUB_API_KEY=""
4. Run the following commands
i. yarn - to install dependencies
ii. db:migrate - to migrate the database
iii. yarn dev - to run in localhost
```

---

## Guide to populate .env file

```
1. AUTH_SECRET - Random alphanumeric string
2. AUTH_GITHUB_ID
3. AUTH_GITHUB_SECRET
   First, you'll need to register your application from here https://github.com/settings/applications/new. Every registered OAuth app is assigned a unique Client ID and Client Secret. The client secret is used to get an access token for the signed-in user. You must include the client secret in your native application, however web applications should not leak this value.

   You can fill out every other piece of information however you like, except the Authorization callback URL. This is the most important piece to securely setting up your application. It's the callback URL that GitHub returns the user to after successful authentication. Ownership of that URL is what ensures that users sign into your app, instead of leaking tokens to an attacker.

   Since we're running a regular Sinatra server, the location of the local instance is set to http://127.0.0.1:3000. Let's fill in the callback URL as http://127.0.0.1:3000/callback.

4. NEXT_DATABASE_URL
   Go to https://console.neon.tech/app/projects, create a new project, click the connect option and copy the connection string
5. UPSTASH_REDIS_REST_URL
6. UPSTASH_REDIS_REST_TOKEN
7. UPSTASH_VECTOR_REST_URL
8. UPSTASH_VECTOR_REST_TOKEN
   Go to https://console.upstash.com/,
   i. create a Redis database and copy the redis rest token and url
   ii. create a Vector database and copy the vector rest token and url, select 768 bge-base-en-v1.5 as the vector embedding standard
9. GROQ_API_KEY
   Go to https://console.groq.com/keys to generate the groq api key
10. TOGETHER_AI_KEY
    Go to https://api.together.xyz/settings/api-keys to generate together api key
11. HUGGINGFACEHUB_API_KEY
    Get it from https://huggingface.co/settings/tokens
    Create a Hugging Face Account: If you don't already have one, visit the Hugging Face website and sign up for an account. Log In: Once you have an account, log in to Hugging Face.
    Navigate to Your Profile Settings: Click on your profile icon in the upper right corner and select "Settings". Go to Access Tokens: In your settings, find the "Access Tokens" section. Generate a New API Token: Click on the "New Token" or similar button to generate a new API token.
    Allow read and write access to repositories and inference.
```

---

## Tech Stack

- Next.js 15
- Node.js 22
- TypeScript
- React
- Prisma
- Auth.js
- Langchain
- Upstash/rag-chat
- Upstash Redis
- Upstash Vectorstore
- Neon ProstgreSQL
- Huggingface Inference
- Solidity
- Wagmi
- Ethers
- Hardhat
- Shadcn

# aiversety
