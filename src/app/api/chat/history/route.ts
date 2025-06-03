export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import getUserSession from "@/lib/user.server";

// Message type definition
type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp?: number;
};

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL as string,
  token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
});

/**
 * API endpoint to get chat history
 * Supports both legacy ragChat and direct Redis approaches
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const userSession = await getUserSession();
    if (!userSession) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 403 }
      );
    }

    // Extract query parameters
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get("sessionId");

    // Determine which session ID to use
    const effectiveSessionId = sessionId || userSession[0];

    // Choose the appropriate method to fetch messages based on available parameters
    let rawMessages: Message[] = [];

    // Redis-based approach (new standard)
    const chatHistoryKey = `chat:history:${effectiveSessionId}`;

    // Get raw messages from Redis
    rawMessages = await redis.lrange(chatHistoryKey, 0, -1);

    console.log(rawMessages);
    // Return both raw and parsed messages for maximum compatibility
    return NextResponse.json({
      rawMessages: rawMessages,
      source: "redis",
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to retrieve chat history" },
      { status: 500 }
    );
  }
}
