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
      `Analyze the document structure and identify the 5 most important high-level categories or sections that organize the document's content.

      For example, if analyzing a resume, extract categories like "Education," "Work Experience," "Skills," "Projects," or "Certifications" rather than specific skills or job titles.

        Each category must be expressed concisely in 1-4 words and should represent a distinct organizational section from the document.

        Return your response in the following JSON format:
        {
          "topic1": "string",
          "topic2": "string", 
          "topic3": "string",
          "topic4": "string",
          "topic5": "string"
        }`,

      `First, extract the key points and main ideas from the document.
      Then, group these key points into 5 distinct topics that best represent the document's core content.`,
      topicData
    );
    console.log(topics);
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
  const { topic, upload } = body;
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
        isDeleted: false,
      },
    });
    console.log("upload ", lastUpload.id, upload);

    let options: string[] = JSON.parse(lastUpload.isCompleted as string) || [];
    console.log(options, "topics put");
    if (!options.includes(topic)) {
      options.push(topic);
    }
    console.log(options, "topics put", lastUpload.id);
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
