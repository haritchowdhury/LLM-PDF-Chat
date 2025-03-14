export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import getUserSession from "@/lib/user.server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Index } from "@upstash/vector";
import { updateUpstash, deleteUpstash } from "@/lib/upstash";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getUserSession();
  const data = await request.formData();
  const file = data.get("file") as File;
  const sessionId = data.get("sessionId") as string;
  const namespace = data.get("namespace") as string;

  console.log(sessionId, namespace);
  if (!file) return new Response(null, { status: 400 });
  if (!user) return new Response(null, { status: 403 });

  //const [sessionId, namespace] = user;
  const arrayBuffer = await file.arrayBuffer();
  const fileSource = new Blob([arrayBuffer], { type: file.type });
  const loader = new PDFLoader(fileSource, {
    splitPages: false,
  });

  const id: string = sessionId.split("_")[0];
  const docs = await loader.load();
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  try {
    deleteUpstash(index, namespace, sessionId, 1);
  } catch (err) {
    throw new Error("Upstash Could not be Cleaned");
    console.log("error: ", err);
  }
  try {
    await updateUpstash(index, namespace, docs);
  } catch (err) {
    throw new Error("Upstash Could be Updated");
    console.log("error: ", err);
  }
  const userExists = await db.user.findUnique({
    where: { id },
  });
  if (!userExists) {
    throw new Error("User not found");
  }
  try {
    const Upload = await db.upload.create({
      data: {
        id: uuid(),
        timeStarted: new Date(),
        userId: id as string,
        isCompleted: JSON.stringify([false, false, false, false, false]),
      },
    });
    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    throw new Error("Upload Could not be created");
  }
}
