// File: app/api/chat/route.ts

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

export const maxDuration = 30;

import type { Message } from "ai";
import { Index } from "@upstash/vector";
import { aiUseChatAdapter } from "@upstash/rag-chat/nextjs";
import getUserSession from "@/lib/user.server";
import { queryUpstashAndLLM } from "@/lib/upstash";

export async function POST(request: Request) {
  const user = await getUserSession();
  const messages = (await request.json()) as { messages: Message[] };
  const namespaceList = await new Index().listNamespaces();

  if (!user) return new Response(null, { status: 403 });
  const question: string | undefined = (messages["messages"] as Message[]).at(
    -1
  )?.content;

  if (!question) return new Response("No question in the request.");
  const [sessionId, namespace] = user;

  if (!namespaceList.includes(namespace)) {
    return new Response(null, { status: 404 });
  }

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });

  const response = await queryUpstashAndLLM(
    index,
    namespace,
    sessionId,
    question
  );

  return aiUseChatAdapter(response);
}
