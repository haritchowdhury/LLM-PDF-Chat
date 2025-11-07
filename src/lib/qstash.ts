/**
 * QStash Client for Background Job Processing
 *
 * Handles publishing jobs to QStash for PDF processing and URL scraping.
 * In development mode, directly calls the worker endpoint to bypass QStash.
 */

import { Client } from "@upstash/qstash";

// Initialize QStash client
export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

/**
 * Job payload for PDF upload processing
 */
export interface PdfUploadJobPayload {
  type: "pdf";
  uploadId: string;
  userId: string;
  fileName: string;
}

/**
 * Job payload for URL scraping
 */
export interface UrlScraperJobPayload {
  type: "url";
  uploadId: string;
  userId: string;
  url: string;
}

/**
 * Union type for all job payloads
 */
export type UploadJobPayload = PdfUploadJobPayload | UrlScraperJobPayload;

/**
 * Publish a PDF processing job to QStash
 * In development mode, calls the worker endpoint directly
 *
 * @param payload - The PDF upload job payload
 * @returns The QStash message ID (or "dev-mode" in development)
 */
export async function publishPdfJob(
  payload: PdfUploadJobPayload
): Promise<string> {
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-upload`;

  // Development mode: Call worker directly
  if (process.env.NODE_ENV === "development") {
    console.log(`[QStash] DEV MODE: Calling worker directly for upload ${payload.uploadId}`);

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-mode": "true", // Signal to worker that this is dev mode
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Worker call failed: ${error}`);
      }

      console.log(`[QStash] DEV MODE: Worker called successfully for upload ${payload.uploadId}`);
      return "dev-mode";
    } catch (error) {
      console.error("[QStash] DEV MODE: Error calling worker:", error);
      throw error;
    }
  }

  // Production mode: Use QStash
  try {
    console.log(`[QStash] Publishing PDF job for upload ${payload.uploadId}`);

    const result = await qstashClient.publishJSON({
      url: workerUrl,
      body: payload,
      retries: 3, // Retry up to 3 times on failure
    });

    console.log(`[QStash] PDF job published with message ID: ${result.messageId}`);
    return result.messageId;
  } catch (error) {
    console.error("[QStash] Error publishing PDF job:", error);
    throw new Error("Failed to publish PDF processing job");
  }
}

/**
 * Publish a URL scraping job to QStash
 * In development mode, calls the worker endpoint directly
 *
 * @param payload - The URL scraper job payload
 * @returns The QStash message ID (or "dev-mode" in development)
 */
export async function publishUrlScraperJob(
  payload: UrlScraperJobPayload
): Promise<string> {
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-upload`;

  // Development mode: Call worker directly
  if (process.env.NODE_ENV === "development") {
    console.log(`[QStash] DEV MODE: Calling worker directly for upload ${payload.uploadId} (URL scraping)`);

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-mode": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Worker call failed: ${error}`);
      }

      console.log(`[QStash] DEV MODE: Worker called successfully for upload ${payload.uploadId}`);
      return "dev-mode";
    } catch (error) {
      console.error("[QStash] DEV MODE: Error calling worker:", error);
      throw error;
    }
  }

  // Production mode: Use QStash
  try {
    console.log(`[QStash] Publishing URL scraper job for upload ${payload.uploadId}`);

    const result = await qstashClient.publishJSON({
      url: workerUrl,
      body: payload,
      retries: 3,
    });

    console.log(`[QStash] URL scraper job published with message ID: ${result.messageId}`);
    return result.messageId;
  } catch (error) {
    console.error("[QStash] Error publishing URL scraper job:", error);
    throw new Error("Failed to publish URL scraping job");
  }
}

/**
 * Generic publish function that routes to the appropriate publisher
 *
 * @param payload - The job payload
 * @returns The QStash message ID
 */
export async function publishUploadJob(
  payload: UploadJobPayload
): Promise<string> {
  if (payload.type === "pdf") {
    return publishPdfJob(payload);
  } else if (payload.type === "url") {
    return publishUrlScraperJob(payload);
  } else {
    throw new Error(`Unknown job type: ${(payload as any).type}`);
  }
}
