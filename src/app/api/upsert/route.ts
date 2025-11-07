// api/upsert/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Index } from "@upstash/vector";
import { updateUpstash, deleteUpstash } from "@/lib/upstash";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { uploadValidator } from "@/lib/validation/upload-validation";
import { uploadPdfToBlob } from "@/lib/blob-storage";
import { publishPdfJob, publishDeleteJob } from "@/lib/qstash";
import { ProcessingStatus } from "@prisma/client";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

function filterStringsOnly(topics) {
  return topics.filter((item) => typeof item === "string");
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), timeoutMs)
    ),
  ]);
}

/*
 * Endpoint to create a chat room with background processing
 */
export async function POST(request: NextRequest) {
  const data = await request.formData();
  let namespace = data.get("namespace") as string;
  let personal = data.get("private") as string;
  let customName = data.get("name") as string;
  let description = data.get("description") as string;

  let uploadId: string;
  let isNewUpload = false;

  const file = data.get("file") as File;
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  const session = await auth();
  const userId = String(session.user.id);

  if (!file) return new Response(null, { status: 400 });

  // Quick validation for PDF type and size (lightweight checks only)
  const arrayBuffer = await file.arrayBuffer();
  const fileSource = new Blob([arrayBuffer], { type: file.type });
  const loader = new PDFLoader(fileSource, {
    splitPages: true,
  });
  const docs = await loader.load();

  // Use the validation service
  const validationResult = await uploadValidator.validateAll({
    userId,
    userEmail: session?.user.email,
    docsLength: docs.length,
    // Uncomment these to enable validation:
    // skipRateLimit: false,
    // skipSpaceLimit: false,
    // skipPageLimit: false,
    // Comment these out to disable validation:
    skipRateLimit: true,
    skipSpaceLimit: true,
    skipPageLimit: true,
  });

  if (!validationResult.isValid) {
    return validationResult.error;
  }

  uploadId = namespace;

  try {
    // Create or update Upload record
    if (namespace === "undefined") {
      // Create new upload
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          name: customName || baseName,
          description: description || "",
          userId: userId,
          private: personal === "true" ? true : false,
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

    // Upload PDF to temporary blob storage
    await uploadPdfToBlob(file, uploadId);

    // Publish background job to QStash
    await publishPdfJob({
      type: "pdf",
      uploadId,
      userId,
      fileName: baseName,
    });

    // Increment request count
    await uploadValidator.incrementRequestCount(userId);

    // Return 202 Accepted with uploadId
    return NextResponse.json(
      {
        uploadId,
        status: "processing",
        message: "Upload started. Processing in background.",
      },
      { status: 202 }
    );

  } catch (err) {
    console.error("Upload error:", err);

    // Clean up on error - only delete if we created a new upload
    if (uploadId && isNewUpload) {
      try {
        await db.upload.delete({ where: { id: uploadId } });
      } catch (deleteErr) {
        console.error("Failed to clean up failed upload:", deleteErr);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to start upload processing",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/*
 * Endpoint to delete a chat room including Redis Cache
 * Uses QStash for background processing
 */
export async function DELETE(request: Request) {
  const { upload, type } = await request.json();
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sessionId = upload + "_" + session.user.id;

    const Upload = await db.upload.findFirst({
      where: { id: upload },
    });

    if (!Upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (session.user.id !== Upload.userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // Mark as deleted immediately in database
    if (type === "delete") {
      await db.upload.update({
        where: {
          id: upload,
        },
        data: {
          isDeleted: true,
        },
      });
    }

    // Publish deletion job to QStash for background processing
    await publishDeleteJob({
      type: "delete",
      uploadId: upload,
      userId: session.user.id,
      sessionId,
    });

    // Return 202 Accepted - deletion is processing in background
    return NextResponse.json(
      {
        uploadId: upload,
        status: "deleting",
        message: "Deletion started. Processing in background.",
        userId: session.user.id,
      },
      { status: 202 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
