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
 * Endpoint to create a chat room
 */
export async function POST(request: NextRequest) {
  const data = await request.formData();
  let namespace = data.get("namespace") as string;
  let personal = data.get("private") as string;
  let customName = data.get("name") as string;

  let receivedNamespace = namespace;
  let uploadId: string;

  const file = data.get("file") as File;
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  const session = await auth();
  const userId = String(session.user.id);

  if (!file) return new Response(null, { status: 400 });

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
    if (namespace === "undefined") {
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          name: customName || baseName,
          userId: userId,
          private: personal === "true" ? true : false,
          isDeleted: false,
        },
      });

      uploadId = Upload.id;
      namespace = uploadId;
    }
  } catch (err) {
    throw new Error("Upload Could not be created");
  }

  try {
    let topics = await withTimeout(
      updateUpstash(index, namespace, docs, baseName, userId),
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
        id: foundUpload.id,
      },
      data: {
        options: JSON.stringify(filteredTopics),
      },
    });
  } catch (err) {
    if (err.message === "TIMEOUT") {
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
    console.log("error: ", err);
    throw new Error("Upstash Could be Updated");
  }

  try {
    // Increment request count
    await uploadValidator.incrementRequestCount(userId);
    return NextResponse.json({ message: uploadId }, { status: 200 });
  } catch (err) {
    throw new Error("Could not commit to redis");
  }
}

/*
 * Endpoint to delete a chat room including Redis Cache
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

    if (session.user.id !== Upload.userId) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    await deleteUpstash(index, upload, sessionId);

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
    return NextResponse.json({ userId: session.user.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
