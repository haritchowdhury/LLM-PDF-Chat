export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
//import getUserSession from "@/lib/user.server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Index } from "@upstash/vector";
import { updateUpstash, deleteUpstash } from "@/lib/upstash";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const MAX_REQUESTS_PER_DAY = 2;
const EXPIRATION_TIME = 24 * 60 * 60 * 7;

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file = data.get("file") as File;
  //let upload = data.get("upload") as string;
  //let sessionId = data.get("sessionId") as string;
  let namespace = data.get("namespace") as string;
  let personal = data.get("private") as string;
  const session = await auth();
  const userId = String(session.user.id);
  const requestCount =
    (await redis.get<number>(`upsert_rate_limit:${userId}`)) || 0;

  const userExists = await db.user.findUnique({
    where: { id: userId },
  });
  if (!userExists) {
    throw new Error("User not found");
  }

  if (!file) return new Response(null, { status: 400 });
  const arrayBuffer = await file.arrayBuffer();
  const fileSource = new Blob([arrayBuffer], { type: file.type });
  const loader = new PDFLoader(fileSource, {
    splitPages: true,
  });
  const docs = await loader.load();
  console.log(docs.length);
  const betaTester = await db.betatesters.findFirst({
    where: {
      email: session?.user.email,
    },
  });
  if (!betaTester) {
    if (docs.length >= 11) {
      return NextResponse.json(
        {
          error: `Upload Exceeds maximum beta testing page count. Beta testing page count: 10.`,
        },
        { status: 429 }
      );
    }
    if (requestCount >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        {
          error: `You have exceeded the nuber of documents you can upload in a Week. Weekly limit ${MAX_REQUESTS_PER_DAY}`,
        },
        { status: 429 }
      );
    }
  }

  if (requestCount >= 10) {
    return NextResponse.json(
      {
        error: `You have exceeded the nuber of documents you can upload in a Week. Weekly limit ${10}`,
      },
      { status: 429 }
    );
  }

  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  let uploadId: string = namespace;

  try {
    if (namespace === "undefined") {
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          name: docs[0].pageContent.slice(0, 50),
          userId: userId,
          isCompleted: JSON.stringify([false, false, false, false, false]),
          private: personal === "true" ? true : false,
          isDeleted: false,
        },
      });
      uploadId = Upload.id;
      //upload = uploadId;
      namespace = uploadId;
      //sessionId = (uploadId + "_" + session?.user.id) as string;
    } else {
      const Upload = await db.upload.findFirst({
        where: { id: namespace, name: "ERASED" },
      });
      if (Upload) {
        const updatedUpload = await db.upload.update({
          where: {
            id: Upload.id,
          },
          data: {
            name: docs[0].pageContent.slice(0, 50),
          },
        });
      }
    }
  } catch (err) {
    throw new Error("Upload Could not be created");
  }
  try {
    await updateUpstash(index, namespace, docs);
  } catch (err) {
    console.log("error: ", err);
    throw new Error("Upstash Could be Updated");
  }
  try {
    await redis.set(`upsert_rate_limit:${userId}`, requestCount + 1, {
      ex: EXPIRATION_TIME,
    });
    return NextResponse.json({ message: uploadId }, { status: 200 });
  } catch (err) {
    throw new Error("Could not commit to redis");
  }
}

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
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
    await deleteUpstash(index, upload, sessionId, 1);
    if (type === "delete") {
      const updatedUpload = await db.upload.update({
        where: {
          id: upload,
        },
        data: {
          isDeleted: true,
        },
      });
    } else {
      const updatedUpload = await db.upload.update({
        where: {
          id: upload,
        },
        data: {
          name: "ERASED",
        },
      });
    }
    return NextResponse.json({ userId: session.user.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
