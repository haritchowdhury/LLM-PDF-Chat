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
import db from "@/lib/db/db";

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
const MAX_REQUESTS_PER_DAY = 0;
const EXPIRATION_TIME = 24 * 60 * 60 * 7;
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = String(session.user.id);
  const user = await getUserSession();
  const namespaceList = await new Index().listNamespaces();
  const { upload, sessionId, namespace, messages } =
    (await request.json()) as ChatRequest;
  const question: string | undefined = messages.at(-1)?.content;
  const requestCount =
    (await redis.get<number>(`chat_rate_limit:${userId}`)) || 0;

  if (!user) return new Response(null, { status: 403 });
  if (requestCount >= 100) {
    return NextResponse.json(
      `You have exceeded the nuber of questions you can ask in a week. Weekly limit ${200}`,
      { status: 429 }
    );
  }
  const betaTester = await db.betatesters.findFirst({
    where: {
      email: session?.user.email,
    },
  });
  if (!betaTester) {
    if (requestCount >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        `You have exceeded the nuber of questions you can ask in a week. Weekly limit ${MAX_REQUESTS_PER_DAY}`,
        { status: 429 }
      );
    }
  }
  if (!question)
    return new Response("No question in the request.", { status: 401 });
  if (!namespaceList.includes(namespace)) {
    return NextResponse.json("This Namespace has not been created.", {
      status: 404,
    });
  }
  //console.log("payload at chat", upload, sessionId, namespace);

  let response: any;
  try {
    await redis.set(`chat_rate_limit:${userId}`, requestCount + 1, {
      ex: EXPIRATION_TIME,
    });
    response = await queryUpstashAndLLM(index, namespace, sessionId, question);
  } catch {
    return NextResponse.json(
      "Unable to get response from model, contact the developer team.",
      {
        status: 401,
      }
    );
  }

  return aiUseChatAdapter(response);
}
