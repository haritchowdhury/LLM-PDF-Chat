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
  const game = await db.game.create({
    data: {
      gameType: type,
      timeStarted: new Date(),
      userId: session.user.id,
      uploadId: id,
      topic: topic,
    },
  });
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

  const { data } = await axios.post(`http://${host as string}/api/questions`, {
    amount,
    topic,
    type,
    namespace,
    userId,
  });
  let parsedData: any;
  try {
    parsedData = data.questions;
    if (!Array.isArray(parsedData)) {
      console.error("parsedData is not an array:", parsedData);
      return NextResponse.json(
        { error: "Invalid response format from questions API." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
  console.log("from questions api:", data);

  if (type === "mcq") {
    type mcqQuestion = {
      question: string;
      answer: string;
      option1: string;
      option2: string;
      option3: string;
      option4: string;
    };
    console.log("parsed data", parsedData);
    const manyData = parsedData.map((question: mcqQuestion) => {
      const options = [
        question.option1,
        question.option2,
        question.option3,
        question.option4,
      ].sort(() => Math.random() - 0.5);
      return {
        question: question.question,
        answer: question.answer,
        options: JSON.stringify(options),
        gameId: game.id,
        questionType: "mcq" as const,
      };
    });
    await db.question.createMany({
      data: manyData,
    });
  }

  await redis.set(`game_rate_limit:${userId}`, requestCount + 1, {
    ex: EXPIRATION_TIME,
  });
  return NextResponse.json({ gameId: game.id }, { status: 200 });
}
