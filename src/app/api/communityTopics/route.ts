import { strict_output } from "@/lib/groqTopicSetter";
import { NextResponse, NextRequest } from "next/server";
import { queryUpstash } from "@/lib/upstash";
import { Index } from "@upstash/vector";
import db from "@/lib/db/db";
import { auth } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { upload } = body;
  console.log(upload);
  const namespace = upload;
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  const session = await auth();
  const id: string = session?.user.id;
  const userExists = await db.user.findUnique({
    where: { id },
  });

  if (!userExists) {
    throw new Error("User not found");
  }
  const lastUpload = await db.upload.findFirst({
    where: {
      id: upload,
      private: false,
      //userId: id,
    },
  });

  if (!lastUpload) {
    return NextResponse.json(
      { error: "No article record found, Topics cannot be created." },
      {
        status: 500,
      }
    );
  }

  const communityQuiz = await db.communityquiz.findFirst({
    where: { uploadId: lastUpload.id, userId: id },
  });
  if (communityQuiz) {
    return NextResponse.json(
      { error: "Quiz already created." },
      {
        status: 500,
      }
    );
  }

  try {
    const topicData: string = await queryUpstash(
      index,
      namespace,
      "What are the Key Topics of this document?"
    );
    const topics: any = await strict_output(
      `You are an Expert AI Instructor who can identify the theme of the summary and figure out the most important chapers
        from the summary that will be useful for preparing the paper for exam,  you are to return the top 5 important chapters that most 
        thoroughly capture the import aspects of the summary. The length of each topic must
        not exceed 4 words. Store all options in a JSON array of the following structure:
        {
         "topic1": "string",
         "topic2": "string",
         "topic3": "string",
         "topic4": "string",
         "topic5": "string" }`,

      `You are to generate 5 main topics that thorougly capture the main subjects of the summary`,
      topicData
    );
    try {
      const topicsArray = [
        topics.topic1,
        topics.topic2,
        topics.topic3,
        topics.topic4,
        topics.topic5,
      ];
      const communityQuiz = await db.communityquiz.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          userId: session?.user.id,
          uploadId: lastUpload.id,
          options: topicsArray,
          isCompleted: JSON.stringify([false, false, false, false, false]),
        },
      });
    } catch (err) {
      console.log(err);
      return NextResponse.json(
        { error: "Failed to create topics." },
        {
          status: 500,
        }
      );
    }
    return NextResponse.json(
      {
        topics: topics,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(" error", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}
export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = request.nextUrl;
  const upload = searchParams.get("upload");
  if (!session?.user.id) {
    throw new Error("User not found");
  }
  try {
    const id: string = session?.user.id;
    const userExists = await db.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new Error("User not found");
    }

    const lastUpload = await db.upload.findFirst({
      where: {
        id: upload,
        private: false,
      },
    });

    const communityQuiz = await db.communityquiz.findFirst({
      where: {
        uploadId: lastUpload.id,
        userId: id,
      },
    });
    console.log("topics found");
    return NextResponse.json(
      {
        topics: communityQuiz.options,
        completed: communityQuiz.isCompleted,
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.log("no topics");
    return NextResponse.json(
      {
        topics: [],
        completed: [],
      },
      {
        status: 200,
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  const body = await request.json();
  const { ix, upload } = body;
  if (!session?.user.id) {
    throw new Error("User not found");
  }
  try {
    const id: string = session?.user.id;
    const userExists = await db.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new Error("User not found");
    }

    const lastUpload = await db.upload.findFirst({
      where: {
        id: upload,
        private: false,
      },
    });
    const lastCommunityQuiz = await db.communityquiz.findFirst({
      where: {
        uploadId: lastUpload.id,
        userId: id,
      },
    });
    let options: boolean[] = JSON.parse(
      lastCommunityQuiz.isCompleted as string
    );
    options[ix] = true;
    const updatedCommunityQuiz = await db.communityquiz.update({
      where: { id: lastCommunityQuiz.id },
      data: { isCompleted: JSON.stringify(options) },
    });
    return NextResponse.json(
      {
        topics: "milestone updated succesfully!",
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}
