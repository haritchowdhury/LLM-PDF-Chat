import { strict_output } from "@/lib/groqTopicSetter";
import { NextResponse, NextRequest } from "next/server";
import { queryUpstash } from "@/lib/upstash";
import { Index } from "@upstash/vector";
import db from "@/lib/db/db";
import { auth } from "@/lib/auth";

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
      userId: id,
    },
  });
  if (lastUpload) {
    const isOptionsEmpty =
      !lastUpload.options || Object.keys(lastUpload.options).length === 0;
    if (!isOptionsEmpty) {
      return NextResponse.json(
        { error: "Topics already created." },
        {
          status: 500,
        }
      );
    }
  } else {
    return NextResponse.json(
      { error: "No record found, Topics cannot be created." },
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
         "topic5": "string"         }`,

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
      const updatedUpload = await db.upload.update({
        where: {
          id: lastUpload.id,
        },
        data: {
          options: topicsArray,
          timeStarted: new Date(),
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
        userId: id,
      },
    });
    return NextResponse.json(
      {
        topics: lastUpload.options,
        completed: lastUpload.isCompleted,
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
        userId: id,
      },
    });
    let options: boolean[] = JSON.parse(lastUpload.isCompleted as string);
    options[ix] = true;
    const updatedUpload = await db.upload.update({
      where: {
        id: lastUpload.id,
      },
      data: {
        isCompleted: JSON.stringify(options),
      },
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
