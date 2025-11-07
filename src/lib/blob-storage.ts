/**
 * Blob Storage Utility
 *
 * Handles temporary file storage for background job processing.
 * Uses Upstash Redis for temporary storage of PDF files until they are processed.
 * Files are stored as base64 strings with a TTL of 1 hour.
 */

import { Redis } from "@upstash/redis";

// Initialize Redis client for blob storage
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const BLOB_PREFIX = "blob:";
const BLOB_TTL = 3600; // 1 hour in seconds

/**
 * Upload a PDF file to temporary storage
 * @param file - The File object from FormData
 * @param uploadId - The upload ID to use as the storage key
 * @returns The storage key
 */
export async function uploadPdfToBlob(
  file: File,
  uploadId: string
): Promise<string> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64 for Redis storage
    const base64Data = buffer.toString("base64");

    // Store in Redis with TTL
    const key = `${BLOB_PREFIX}${uploadId}`;
    await redis.setex(key, BLOB_TTL, base64Data);

    console.log(`[Blob Storage] Uploaded PDF for upload ${uploadId}, size: ${buffer.length} bytes`);

    return key;
  } catch (error) {
    console.error("[Blob Storage] Error uploading PDF:", error);
    throw new Error("Failed to upload PDF to temporary storage");
  }
}

/**
 * Retrieve a PDF file from temporary storage
 * @param uploadId - The upload ID
 * @returns The PDF file as a Buffer
 */
export async function getPdfFromBlob(uploadId: string): Promise<Buffer> {
  try {
    const key = `${BLOB_PREFIX}${uploadId}`;
    const base64Data = await redis.get<string>(key);

    if (!base64Data) {
      throw new Error(`PDF not found in temporary storage for upload ${uploadId}`);
    }

    // Convert base64 back to Buffer
    const buffer = Buffer.from(base64Data, "base64");

    console.log(`[Blob Storage] Retrieved PDF for upload ${uploadId}, size: ${buffer.length} bytes`);

    return buffer;
  } catch (error) {
    console.error("[Blob Storage] Error retrieving PDF:", error);
    throw error;
  }
}

/**
 * Delete a PDF file from temporary storage
 * @param uploadId - The upload ID
 */
export async function deleteBlobFile(uploadId: string): Promise<void> {
  try {
    const key = `${BLOB_PREFIX}${uploadId}`;
    await redis.del(key);

    console.log(`[Blob Storage] Deleted PDF for upload ${uploadId}`);
  } catch (error) {
    console.error("[Blob Storage] Error deleting PDF:", error);
    // Don't throw - cleanup failure shouldn't break the flow
  }
}

/**
 * Check if a PDF exists in temporary storage
 * @param uploadId - The upload ID
 * @returns True if the PDF exists
 */
export async function blobFileExists(uploadId: string): Promise<boolean> {
  try {
    const key = `${BLOB_PREFIX}${uploadId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error) {
    console.error("[Blob Storage] Error checking PDF existence:", error);
    return false;
  }
}
