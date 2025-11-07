export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;
// api/scraper/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { scrapeWebpage } from "@/lib/cheerio";
import { updateUpstashWithUrl } from "@/lib/upstash";
import { Index } from "@upstash/vector";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { uploadValidator } from "@/lib/validation/upload-validation";
import { publishUrlScraperJob } from "@/lib/qstash";
import { ProcessingStatus } from "@prisma/client";

// Function to chunk text into segments of specified length
function chunkText(text, chunkSize = 2000) {
  const chunks = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

const urlSchema = z.object({
  url: z.string().url(),
  namespace: z.string(),
  sharable: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

type Schema = z.infer<typeof urlSchema>;

function filterStringsOnly(topics: any) {
  return topics.filter((item: any) => typeof item === "string");
}

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
    ),
  ]);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const session = await auth();
  const userId = String(session.user.id);
  let uploadId: string;
  let isNewUpload = false;

  try {
    let { url, namespace, sharable, name, description } = urlSchema.parse(body);

    // Use the validation service
    const validationResult = await uploadValidator.validateAll({
      userId,
      userEmail: session?.user.email,
      // Uncomment these to enable validation:
      // skipRateLimit: false,
      // skipSpaceLimit: false,
      // skipPageLimit: true, // Page limit doesn't apply to URL scraping
      // Comment these out to disable validation:
      skipRateLimit: true,
      skipSpaceLimit: true,
      skipPageLimit: true,
    });

    if (!validationResult.isValid) {
      return validationResult.error;
    }

    uploadId = namespace;

    // Create or update Upload record
    if (namespace === "undefined") {
      // Create new upload
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          name: name || url,
          description: description || "",
          userId: userId,
          private: sharable === "false" ? true : false,
          isDeleted: false,
          processingStatus: ProcessingStatus.PENDING,
        },
      });

      uploadId = Upload.id;
      namespace = uploadId;
      isNewUpload = true;
    } else {
      // Adding to existing upload - keep the upload accessible
      // Don't change processingStatus - let it stay COMPLETED
      uploadId = namespace;
    }

    // Publish background job to QStash
    await publishUrlScraperJob({
      type: "url",
      uploadId,
      userId,
      url,
    });

    // Increment request count
    await uploadValidator.incrementRequestCount(userId);

    // Return 202 Accepted with uploadId
    return NextResponse.json(
      {
        uploadId,
        status: "processing",
        message: "URL scraping started. Processing in background.",
      },
      { status: 202 }
    );

  } catch (error) {
    console.error("Scraper error:", error);

    // Clean up on error - only delete if we created a new upload
    if (uploadId && isNewUpload) {
      try {
        await db.upload.delete({ where: { id: uploadId } });
      } catch (deleteErr) {
        console.error("Failed to clean up failed upload:", deleteErr);
      }
    }

    // Check if it's a Zod validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Failed to start URL scraping",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  }
}
