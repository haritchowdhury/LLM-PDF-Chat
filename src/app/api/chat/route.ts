export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

import { Index } from "@upstash/vector";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

import getUserSession from "@/lib/user.server";
import { queryUpstashAndLLM } from "@/lib/upstash";
import { saveMessage } from "@/lib/redisChat";
import { auth } from "@/lib/auth";
import db from "@/lib/db/db";

// Define message type for consistency
type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp?: number;
};

// Define request interface
interface ChatRequest {
  user_prompt: string; // New API uses user_prompt instead of messages array
  uploadId?: string; // Document upload ID
  sessionId?: string; // Session identifier
  namespace?: string; // Vector namespace
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

// Initialize Vector index
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL as string,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN as string,
});

// Rate limit constants
const MAX_REQUESTS_PER_DAY = 20;
const MAX_REQUESTS_FOR_BETA = 100;
const EXPIRATION_TIME = 24 * 60 * 60 * 7; // 7 days in seconds

/**
 * Chat API endpoint handler
 * Processes user questions, checks rate limits, queries vector store, and returns AI responses
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session and authenticate
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { content: "Authentication required" },
        { status: 403 }
      );
    }

    const userId = String(session.user.id);
    const userEmail = session.user.email;

    // Get user session details from custom function
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json(
        { content: "User session not found" },
        { status: 403 }
      );
    }

    // Parse request data
    const { user_prompt, sessionId, namespace, uploadId }: ChatRequest =
      await request.json();

    // Use provided sessionId or fallback to user session
    const effectiveSessionId = sessionId || user[0];

    // Use provided namespace or fallback to user namespace
    const effectiveNamespace = namespace || user[1];

    // Validate namespace exists
    const namespaceList = await index.listNamespaces();
    console.log("namespace list", namespaceList);
    console.log("namespace", namespace);
    console.log("uploadId", uploadId);

    console.log(namespaceList);
    const document = await db.upload.findFirst({ where: { id: uploadId } });

    if (!document) {
      return NextResponse.json(
        { content: "No Document found." },
        { status: 405 }
      );
    }
    console.log(document.private, document.userId, session?.user.id);
    if (
      document.private &&
      document.userId.trim() !== session?.user.id.trim()
    ) {
      return NextResponse.json(
        {
          content:
            "This namespace has not been created. Please upload a document first.",
        },
        { status: 404 }
      );
    }

    if (!document.private && !namespaceList.includes(document.userId)) {
      return NextResponse.json(
        {
          content:
            "This namespace has not been created. Please upload a document first.",
        },
        { status: 404 }
      );
    }

    // Validate question exists
    if (!user_prompt) {
      return NextResponse.json(
        { content: "No question provided in request." },
        { status: 400 }
      );
    }

    // Check rate limits
    const requestCount =
      (await redis.get<number>(`chat_rate_limit:${userId}`)) || 0;

    // Check if user is a beta tester
    const betaTester = await db.betatesters.findFirst({
      where: {
        email: userEmail,
      },
    });

    // Apply rate limiting based on user type
    if (!betaTester && requestCount >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        {
          content: `You have exceeded the number of questions you can ask in a week. Weekly limit: ${MAX_REQUESTS_PER_DAY}`,
        },
        { status: 429 }
      );
    }

    if (betaTester && requestCount >= MAX_REQUESTS_FOR_BETA) {
      return NextResponse.json(
        {
          content: `You have exceeded the number of questions you can ask in a week. Weekly limit: ${MAX_REQUESTS_FOR_BETA}`,
        },
        { status: 429 }
      );
    }

    // Save user question to chat history
    await saveMessage(effectiveSessionId, {
      role: "user",
      content: user_prompt,
      sources: [],
    });

    // Query the vector store and LLM
    const response = await queryUpstashAndLLM(
      index,
      effectiveNamespace,
      //effectiveSessionId,
      user_prompt,
      userId,
      document.private,
      document.userId
    );

    // Extract response content and sources
    const result = response[0]; // LLM's answer
    let sources = response[1] || []; // Source data

    // Format response content
    let responseContent = "";
    if (typeof result === "object" && result?.content) {
      responseContent = result.content;
    } else if (typeof result === "string") {
      responseContent = result;
    } else {
      responseContent = "Unable to process response from AI model.";
    }

    // Ensure sources is an array
    if (!sources || !Array.isArray(sources) || !sources.length) {
      sources = ["No Sources"];
    }

    // Save AI response to chat history
    await saveMessage(effectiveSessionId, {
      role: "assistant",
      content: responseContent,
      sources: sources,
    });

    // Increment rate limit counter
    await redis.set(`chat_rate_limit:${userId}`, requestCount + 1, {
      ex: EXPIRATION_TIME,
    });
    // Return formatted response
    return NextResponse.json(
      { content: responseContent, sources: sources },
      { status: 200 }
    );
  } catch (error) {
    // Log the error
    console.error("Error processing chat request:", error);

    // Return error response
    return NextResponse.json(
      {
        content:
          "Unable to get response from model. Please try again or contact the developer team.",
      },
      { status: 500 }
    );
  }
}
