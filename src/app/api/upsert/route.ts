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
const EXPIRATION_TIME = 24 * 60 * 60;

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = String(session.user.id);
  const requestCount =
    (await redis.get<number>(`upsert_rate_limit:${userId}`)) || 0;
  /* if (requestCount >= MAX_REQUESTS_PER_DAY) {
    return NextResponse.json(
      {
        error: `You have exceeded the nuber of documents you can upload in a day. Daily limit ${MAX_REQUESTS_PER_DAY}`,
      },
      { status: 429 }
    );
  } */
  //const user = await getUserSession();
  const data = await request.formData();
  const file = data.get("file") as File;
  const upload = data.get("upload") as string;
  const sessionId = data.get("sessionId") as string;
  const namespace = data.get("namespace") as string;
  //console.log(sessionId, namespace);
  if (!file) return new Response(null, { status: 400 });
  //if (!user) return new Response(null, { status: 403 });
  const arrayBuffer = await file.arrayBuffer();
  const fileSource = new Blob([arrayBuffer], { type: file.type });
  const loader = new PDFLoader(fileSource, {
    splitPages: true,
  });
  //const userId: string = sessionId.split("_")[0];
  const docs = await loader.load();
  //console.log(docs[0].pageContent);
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  try {
    deleteUpstash(index, namespace, sessionId, 1);
  } catch (err) {
    console.log("error: ", err);
    throw new Error("Upstash Could not be Cleaned");
  }
  try {
    await updateUpstash(index, namespace, docs);
  } catch (err) {
    console.log("error: ", err);
    throw new Error("Upstash Could be Updated");
  }
  const userExists = await db.user.findUnique({
    where: { id: userId },
  });
  if (!userExists) {
    throw new Error("User not found");
  }
  let uploadId: string = upload;
  try {
    if (upload === "undefined") {
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          userId: userId as string,
          isCompleted: JSON.stringify([false, false, false, false, false]),
        },
      });
      uploadId = Upload.id;
    }

    await redis.set(`upsert_rate_limit:${userId}`, requestCount + 1, {
      ex: EXPIRATION_TIME,
    });
    return NextResponse.json({ message: uploadId }, { status: 200 });
  } catch (err) {
    throw new Error("Upload Could not be created");
  }
}
