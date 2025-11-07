/**
 * QStash Worker Endpoint
 *
 * Handles background processing of PDF uploads and URL scraping.
 * Called by QStash (or directly in development mode) to process uploads asynchronously.
 */

import { NextResponse } from "next/server";
import { Index } from "@upstash/vector";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { verifyOrReturnError } from "@/lib/qstash-verify";
import { getPdfFromBlob, deleteBlobFile } from "@/lib/blob-storage";
import { updateUpstash, updateUpstashWithUrl } from "@/lib/upstash";
import { UploadJobPayload } from "@/lib/qstash";
import { scrapeWebpage } from "@/lib/cheerio";
import db from "@/lib/db/db";
import { ProcessingStatus } from "@prisma/client";

// Initialize Upstash Vector index
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Increase timeout for long-running processing
export const maxDuration = 60; // 1 minutes

/**
 * POST handler - Process upload jobs
 */
export async function POST(request: Request) {
  let uploadId: string | undefined;

  try {
    // 1. Read the raw body for signature verification
    const body = await request.text();

    // 2. Verify QStash signature (skipped in dev mode)
    const errorResponse = await verifyOrReturnError(request, body);
    if (errorResponse) {
      return errorResponse;
    }

    // 3. Parse the job payload
    const payload: UploadJobPayload = JSON.parse(body);
    uploadId = payload.uploadId;
    const { type, userId } = payload;

    console.log(`[Worker] Processing ${type} job for upload ${uploadId}`);

    // 4. Update status to PROCESSING
    await db.upload.update({
      where: { id: uploadId },
      data: {
        processingStatus: ProcessingStatus.PROCESSING,
        processingStartedAt: new Date(),
      },
    });

    // 5. Route to appropriate processor
    let topics: string[];
    let vectorCount = 0;

    if (type === "pdf") {
      // Process PDF upload
      const result = await processPdfUpload(payload, index);
      topics = result.topics;
      vectorCount = result.vectorCount;
    } else if (type === "url") {
      // Process URL scraping
      const result = await processUrlScraping(payload, index);
      topics = result.topics;
      vectorCount = result.vectorCount;
    } else {
      throw new Error(`Unknown job type: ${type}`);
    }

    // 6. Merge with existing topics and update status to COMPLETED
    const foundUpload = await db.upload.findUnique({
      where: { id: uploadId },
      select: { options: true },
    });

    let existingTopics: string[] = [];
    if (foundUpload?.options) {
      try {
        existingTopics = JSON.parse(foundUpload.options as string);
      } catch (e) {
        console.warn("[Worker] Failed to parse existing topics:", e);
      }
    }

    // Merge and deduplicate topics
    const allTopics = [...new Set([...topics, ...existingTopics])];
    const filteredTopics = allTopics.filter((item) => typeof item === "string");

    await db.upload.update({
      where: { id: uploadId },
      data: {
        processingStatus: ProcessingStatus.COMPLETED,
        processingCompletedAt: new Date(),
        vectorCount,
        options: JSON.stringify(filteredTopics), // Store topics as JSON string
      },
    });

    console.log(
      `[Worker] Successfully processed upload ${uploadId}, ${vectorCount} vectors, ${filteredTopics.length} topics`
    );

    return NextResponse.json({
      success: true,
      uploadId,
      vectorCount,
      topicsCount: filteredTopics.length,
    });
  } catch (error) {
    console.error("[Worker] Error processing upload:", error);

    // Update status to FAILED if we have an uploadId
    if (uploadId) {
      try {
        await db.upload.update({
          where: { id: uploadId },
          data: {
            processingStatus: ProcessingStatus.FAILED,
            processingCompletedAt: new Date(),
            errorMessage:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
        });
      } catch (dbError) {
        console.error("[Worker] Failed to update error status:", dbError);
      }
    }

    // Return 500 so QStash will retry (only in production)
    // In dev mode, we want to see the error immediately
    const isDevMode = request.headers.get("x-dev-mode") === "true";
    if (isDevMode) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Processing failed",
        },
        { status: 500 }
      );
    }

    // In production, return 500 for QStash to retry
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

/**
 * Process a PDF upload job
 */
async function processPdfUpload(
  payload: UploadJobPayload & { type: "pdf" },
  index: Index
): Promise<{ topics: string[]; vectorCount: number }> {
  const { uploadId, userId, fileName } = payload;

  console.log(`[Worker] Processing PDF: ${fileName}`);

  // 1. Retrieve PDF from blob storage
  const pdfBuffer = await getPdfFromBlob(uploadId);

  // 2. Convert Buffer to Blob (via Uint8Array for TypeScript compatibility)
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
    type: "application/pdf",
  });

  // 3. Load PDF with LangChain
  const loader = new PDFLoader(pdfBlob, { splitPages: true });
  const docs = await loader.load();

  console.log(`[Worker] Loaded PDF with ${docs.length} pages`);

  // 4. Process with existing updateUpstash function
  const topics = await updateUpstash(index, uploadId, docs, fileName, userId);

  // 5. Calculate vector count (estimate based on pages and average chunks)
  // Each page is split into ~2000 char chunks with 200 overlap
  // Average PDF page has ~500-1000 words = ~3000-6000 chars
  // So roughly 2-3 chunks per page on average
  const vectorCount = docs.length * 2; // Rough estimate

  // 6. Clean up blob storage
  await deleteBlobFile(uploadId);

  console.log(
    `[Worker] PDF processing complete, generated ${topics.length} topics`
  );

  return { topics, vectorCount };
}

/**
 * Process a URL scraping job
 */
async function processUrlScraping(
  payload: UploadJobPayload & { type: "url" },
  index: Index
): Promise<{ topics: string[]; vectorCount: number }> {
  const { uploadId, userId, url } = payload;

  console.log(`[Worker] Scraping URL: ${url}`);

  // 1. Scrape the webpage
  const scrapedText = await scrapeWebpage(url);

  // 2. Split into 7000-char chunks (same as original scraper API)
  const chunkSize = 7000;
  const textChunks: string[] = [];

  for (let i = 0; i < scrapedText.length; i += chunkSize) {
    textChunks.push(scrapedText.slice(i, i + chunkSize));
  }

  console.log(
    `[Worker] Split scraped content into ${textChunks.length} chunks`
  );

  // 3. Process with existing updateUpstashWithUrl function
  const topics = await updateUpstashWithUrl(
    index,
    uploadId,
    textChunks,
    url,
    userId
  );

  // 4. Calculate vector count (estimate based on chunks)
  // Each 7000-char chunk is split into ~2000 char chunks with 200 overlap
  // So roughly 4-5 vectors per 7000-char chunk
  const vectorCount = textChunks.length * 4;

  console.log(
    `[Worker] URL scraping complete, generated ${topics.length} topics`
  );

  return { topics, vectorCount };
}
