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

/**
 * Retrieve chat history from Redis
 * @param userId - The user's ID
 * @param limit - Maximum number of messages to retrieve (default: 10)
 * @returns Array of messages in chronological order (oldest first)
 */
export async function getChatHistory(
  userId: string,
  limit: number = 10
): Promise<Message[]> {
  try {
    const chatHistoryKey = `chat:history:${userId}`;

    // Get messages from Redis (LRANGE gets items from list)
    // Since we use LPUSH, newest messages are at index 0
    // We get the last 'limit' messages and reverse to get chronological order
    const messages = await redis.lrange(chatHistoryKey, 0, limit - 1);

    if (!messages || messages.length === 0) {
      return [];
    }

    // Upstash Redis client returns objects directly (already parsed)
    // Filter valid messages and reverse to get chronological order (oldest first)
    const parsedMessages = messages
      .map((msg) => {
        try {
          // If msg is already an object, use it directly
          if (typeof msg === "object" && msg !== null) {
            return msg as Message;
          }
          // If msg is a string, parse it
          if (typeof msg === "string") {
            return JSON.parse(msg) as Message;
          }
          return null;
        } catch (e) {
          console.error("Failed to parse message:", e);
          return null;
        }
      })
      .filter((msg): msg is Message => msg !== null)
      .reverse(); // Reverse to get oldest first

    return parsedMessages;
  } catch (error) {
    console.error("Failed to retrieve chat history from Redis:", error);
    return [];
  }
}

/**
 * Delete a user's chat history from Redis
 * @param userId - The user's ID
 */
export async function deleteChatHistory(userId: string): Promise<boolean> {
  try {
    const chatHistoryKey = `chat:history:${userId}`;
    await redis.del(chatHistoryKey);
    return true;
  } catch (error) {
    console.error("Failed to delete chat history from Redis:", error);
    return false;
  }
}
