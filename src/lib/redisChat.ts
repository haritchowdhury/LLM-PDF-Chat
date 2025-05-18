import { Redis } from "@upstash/redis";

// Message type definition
export type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  sources: string[];
};

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Save a message to the user's chat history in Redis: Not required in current scope
 * @param userId - The user's ID
 * @param message - The message to save
 */
export async function saveMessage(
  userId: string,
  message: Message
): Promise<boolean> {
  try {
    const chatHistoryKey = `chat:history:${userId}`;

    // Add timestamp if not provided
    const messageWithTimestamp = {
      ...message,
      timestamp: message.timestamp || Date.now(),
      sources: message.sources,
    };

    // Serialize message to JSON
    const serialized = JSON.stringify(messageWithTimestamp);

    // Add to the beginning of the list (LPUSH inserts at the beginning)
    await redis.lpush(chatHistoryKey, serialized);

    // Optional: Set expiration for the key to automatically clean up old histories
    // Remove or adjust this if you want to keep chat histories indefinitely
    await redis.expire(chatHistoryKey, 60 * 60 * 24 * 30); // 30 days

    return true;
  } catch (error) {
    console.error("Failed to save message to Redis:", error);
    return false;
  }
}
