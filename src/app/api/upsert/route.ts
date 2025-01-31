// File: app/api/upsert/route.ts

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

//import ragChat from "@/lib/rag.server";
import { NextRequest } from "next/server";
import getUserSession from "@/lib/user.server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Index } from "@upstash/vector";
import { updateUpstash, deleteUpstashRedis } from "@/lib/upstash";

export async function POST(request: NextRequest) {
  const user = await getUserSession();
  const data = await request.formData();
  const file = data.get("file") as File;

  if (!file) return new Response(null, { status: 400 });
  if (!user) return new Response(null, { status: 403 });

  const [sessionId, namespace] = user;
  const arrayBuffer = await file.arrayBuffer();
  const fileSource = new Blob([arrayBuffer], { type: file.type });
  const loader = new PDFLoader(fileSource, {
    splitPages: false,
  });

  const docs = await loader.load();
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  try {
    deleteUpstashRedis(index, namespace, sessionId, 1);
  } catch (err) {
    console.log("error: ", err);
  }
  try {
    await updateUpstash(index, namespace, docs);
  } catch (err) {
    console.log("error: ", err);
  }

  return new Response(null, { status: 200 });
}
