export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import getUserSession from "@/lib/user.server";
import ragChat from "@/lib/rag.server"; // Keep legacy support

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
    let messages: Message[] = [];
    let rawMessages: string[] = [];

    // If we have specific sessionId, try the legacy approach first
    if (sessionId) {
      try {
        // Try to get messages using the legacy ragChat approach
        const legacyMessages = await ragChat.history.getMessages({
          amount: 100,
          sessionId: effectiveSessionId,
        });

        if (
          legacyMessages &&
          Array.isArray(legacyMessages) &&
          legacyMessages.length > 0
        ) {
          return NextResponse.json({ messages: legacyMessages });
        }
      } catch (error) {
        console.warn(
          "Legacy chat history retrieval failed, falling back to Redis:",
          error
        );
        // Continue to Redis fallback approach
      }
    }

    // Redis-based approach (new standard)
    const chatHistoryKey = `chat:history:${effectiveSessionId}`;

    // Get raw messages from Redis
    rawMessages = await redis.lrange(chatHistoryKey, 0, -1);

    // Parse the JSON messages
    /* if (rawMessages && Array.isArray(rawMessages) && rawMessages.length > 0) {
      messages = rawMessages
        .map((msg) => {
          try {
            return JSON.parse(msg);
          } catch (e) {
            console.error("Failed to parse message:", msg, e);
            return null;
          }
        })
        .filter(Boolean) as Message[];
    } 

    // If we have legacy messages and no Redis messages, use legacy
    if (!messages.length && sessionId) {
      // Try one more time with legacy system as fallback
      const legacyMessages = await ragChat.history.getMessages({
        amount: 100,
        sessionId: effectiveSessionId,
      });

      if (
        legacyMessages &&
        Array.isArray(legacyMessages) &&
        legacyMessages.length > 0
      ) {
        return NextResponse.json({
          messages: legacyMessages,
          source: "legacy",
        });
      }
    }*/
    console.log(rawMessages);
    // Return both raw and parsed messages for maximum compatibility
    return NextResponse.json({
      //messages,
      rawMessages: messages.length > 0 ? messages : rawMessages,
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
