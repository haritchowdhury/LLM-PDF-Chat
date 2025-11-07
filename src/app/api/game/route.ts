export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import db from "@/lib/db/db";
import { z } from "zod";
import axios from "axios";
import { headers } from "next/headers";
import getUserSession from "@/lib/user.server";
import { Redis } from "@upstash/redis";
import { publishGameJob } from "@/lib/qstash";
import { ProcessingStatus } from "@prisma/client";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const MAX_REQUESTS_PER_DAY = 10;
const EXPIRATION_TIME = 24 * 60 * 60 * 7;

export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = String(session.user.id);
  const requestCount =
    (await redis.get<number>(`game_rate_limit:${userId}`)) || 0;
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to create a game." },
      {
        status: 401,
      }
    );
  }
  const betaTester = await db.betatesters.findFirst({
    where: {
      email: session?.user.email,
    },
  });
  /* if (!betaTester) {
    if (requestCount >= MAX_REQUESTS_PER_DAY) {
      return NextResponse.json(
        {
          error: `You have exceeded number of quizzes you can take in a Week. Weekly limit ${MAX_REQUESTS_PER_DAY}`,
        },
        { status: 429 }
      );
    }
  } */
  //const user = await getUserSession();
  const body = await request.json();
  const { topic, amount, id } = quizCreationSchema.parse(body);
  const namespace = id;
  const type = "mcq" as const;
  const headersList = await headers();
  const host = await headersList.get("host");
  // Create game with PENDING status
  const game = await db.game.create({
    data: {
      gameType: type,
      timeStarted: new Date(),
      userId: session.user.id,
      uploadId: id,
      topic: topic,
      processingStatus: ProcessingStatus.PENDING,
    },
  });

  // Update topic count
  await db.topic_count.upsert({
    where: {
      topic,
    },
    create: {
      topic,
      count: 1,
    },
    update: {
      count: {
        increment: 1,
      },
    },
  });

  // Publish game job to QStash for background question generation
  await publishGameJob({
    type: "game",
    gameId: game.id,
    uploadId: id,
    topic,
    amount,
    userId,
  });

  // Update rate limit
  await redis.set(`game_rate_limit:${userId}`, requestCount + 1, {
    ex: EXPIRATION_TIME,
  });

  // Return 202 Accepted - questions are being generated in background
  return NextResponse.json(
    {
      gameId: game.id,
      status: "pending",
      message: "Game created. Questions are being generated in background.",
    },
    { status: 202 }
  );
}
