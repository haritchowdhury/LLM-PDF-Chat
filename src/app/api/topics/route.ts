import { strict_output } from "@/lib/groqTopicSetter";
import getUserSession from "@/lib/user.server";
//import { getTopicsSchema } from "@/schemas/topics";
import { NextResponse, NextRequest } from "next/server";
import { queryUpstash } from "@/lib/upstash";
import { Index } from "@upstash/vector";
//import { auth } from "@/lib/auth";
import db from "@/lib/db/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getUserSession();
  const [_, namespace] = user;
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  const id: string = namespace.split("_")[0];
  const userExists = await db.user.findUnique({
    where: { id },
  });

  if (!userExists) {
    throw new Error("User not found");
  }
  const lastUpload = await db.upload.findFirst({
    where: {
      userId: id,
    },
    orderBy: {
      timeStarted: "desc",
    },
  });

  if (lastUpload) {
    const isOptionsEmpty =
      !lastUpload.options || Object.keys(lastUpload.options).length === 0;
    //console.log("Is options field empty:", isOptionsEmpty);
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

    /* --------- */
    //console.log(lastUpload.id, topics, typeof topics);
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
        },
      });
      //console.log(updatedUpload);
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
        topcs: topics,
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
  const user = await getUserSession();
  if (!user) {
    throw new Error("User not found");
  }
  try {
    const [sessionId, namespace] = user;

    const id: string = namespace.split("_")[0];
    const userExists = await db.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new Error("User not found");
    }

    const lastUpload = await db.upload.findFirst({
      where: {
        userId: id,
      },
      orderBy: {
        timeStarted: "desc",
      },
    });
    console.log("topics found");
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
  const user = await getUserSession();
  const body = await request.json();
  const { ix } = body;
  if (!user) {
    throw new Error("User not found");
  }
  try {
    const [sessionId, namespace] = user;

    const id: string = namespace.split("_")[0];
    const userExists = await db.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new Error("User not found");
    }

    const lastUpload = await db.upload.findFirst({
      where: {
        userId: id,
      },
      orderBy: {
        timeStarted: "desc",
      },
    });
    let options: boolean[] = JSON.parse(lastUpload.isCompleted as string);
    //console.log(body, ix);
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
