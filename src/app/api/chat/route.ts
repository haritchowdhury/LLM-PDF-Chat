export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

import type { Message } from "ai";
import { Index } from "@upstash/vector";
import { aiUseChatAdapter } from "@upstash/rag-chat/nextjs";
import getUserSession from "@/lib/user.server";
import { queryUpstashAndLLM } from "@/lib/upstash";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  upload: string;
  sessionId: string;
  namespace: string;
  messages: Message[];
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const MAX_REQUESTS_PER_DAY = 20;
const EXPIRATION_TIME = 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = String(session.user.id);

  const requestCount =
    (await redis.get<number>(`chat_rate_limit:${userId}`)) || 0;

  /* if (requestCount >= MAX_REQUESTS_PER_DAY) {
    return NextResponse.json(
      {
        error: `You have exceeded the nuber of questions you can ask in a day. Daily limit ${MAX_REQUESTS_PER_DAY}`,
      },
      { status: 429 }
    );
  } */
  const { upload, sessionId, namespace, messages } =
    (await request.json()) as ChatRequest;

  const user = await getUserSession();
  const namespaceList = await new Index().listNamespaces();

  if (!user) return new Response(null, { status: 403 });
  const question: string | undefined = messages.at(-1)?.content;
  if (!question) return new Response("No question in the request.");

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  //console.log("before namespace", namespaceList);
  if (!namespaceList.includes(namespace)) {
    return new Response(null, { status: 404 });
  }
  console.log("payload at chat", upload, sessionId, namespace);

  let response: any;

  try {
    await redis.set(`chat_rate_limit:${userId}`, requestCount + 1, {
      ex: EXPIRATION_TIME,
    });
    response = await queryUpstashAndLLM(index, namespace, sessionId, question);
  } catch {
    throw new Error("Chat could not be compiled");
  }

  return aiUseChatAdapter(response);
}
