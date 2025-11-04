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
  let receivedNamespace: string;
  let uploadId: string;

  try {
    let { url, namespace, sharable, name } = urlSchema.parse(body);

    receivedNamespace = namespace;

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
    if (namespace === "undefined") {
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          name: name || url,
          userId: userId,
          private: sharable === "false" ? true : false,
          isDeleted: false,
        },
      });

      uploadId = Upload.id;
      namespace = uploadId;
    }

    const scrappedText = await withTimeout(
      scrapeWebpage(url),
      45000 // 45 seconds timeout
    );

    // const scrappedText = await scrapeWebpage(url);
    const textChunks = chunkText(scrappedText, 7000);

    let topics = await withTimeout(
      updateUpstashWithUrl(index, namespace, textChunks, url, userId),
      45000
    );
    const foundUpload = await db.upload.findFirst({
      where: {
        id: uploadId,
      },
    });
    const existingTopics: string[] = JSON.parse(foundUpload.options as string);

    topics = topics.concat(existingTopics);
    const filteredTopics = filterStringsOnly(topics);

    await db.upload.update({
      where: {
        id: uploadId,
      },
      data: {
        options: JSON.stringify(filteredTopics),
      },
    });

    // Increment request count
    await uploadValidator.incrementRequestCount(userId);
    return NextResponse.json({ message: uploadId }, { status: 200 });
  } catch (error) {
    console.log(error);
    // Check if it's a Zod validation error
    if (error.message === "TIMEOUT") {
      if ((receivedNamespace = "undefined")) {
        await db.upload.delete({
          where: {
            id: uploadId,
          },
        });
      }
      return NextResponse.json(
        {
          error:
            "Request timed out. The webpage is taking too long to process. Please try again or use a different URL.",
          code: "TIMEOUT_ERROR",
        },
        { status: 408 } // 408 Request Timeout
      );
    }
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
          error: "Failed to scrape url, please try another one!",
          details: error.errors,
        },
        { status: 400 }
      );
    }
  }
}
