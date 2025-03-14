export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

import ragChat from "@/lib/rag.server";
import { NextResponse, NextRequest } from "next/server";
import getUserSession from "@/lib/user.server";

export async function GET(request: NextRequest) {
  const userSession = await getUserSession();
  if (!userSession) return new Response(null, { status: 403 });

  const { searchParams } = request.nextUrl;
  const upload = searchParams.get("upload");
  const sessionId = searchParams.get("sessionId");
  const namespace = searchParams.get("namespace");

  console.log("upload at history", sessionId, upload);

  const messages = await ragChat.history.getMessages({
    amount: 100,
    sessionId: sessionId,
  });
  return NextResponse.json({ messages });
}
