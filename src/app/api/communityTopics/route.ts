import { NextResponse, NextRequest } from "next/server";
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
  /* if (communityQuiz) {
    return NextResponse.json(
      { error: "Quiz already created." },
      {
        status: 500,
      }
    );
  }*/

  try {
    try {
      if (!communityQuiz) {
        await db.communityquiz.create({
          data: {
            id: uuid(),
            timeStarted: new Date(),
            userId: session?.user.id,
            uploadId: lastUpload.id,
            options: lastUpload?.options,
            isCompleted: JSON.stringify([]),
          },
        });
      } else {
        await db.communityquiz.update({
          where: {
            id: communityQuiz.id,
            userId: session?.user.id,
            uploadId: lastUpload.id,
          },
          data: {
            options: lastUpload?.options,
            isCompleted: communityQuiz.isCompleted,
          },
        });
      }
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
        topics: lastUpload?.options,
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
    let communityQuiz = await db.communityquiz.findFirst({
      where: {
        uploadId: lastUpload.id,
        userId: id,
      },
    });

    await db.communityquiz.update({
      where: {
        id: communityQuiz.id,
        userId: session?.user.id,
        uploadId: lastUpload.id,
      },
      data: {
        options: lastUpload?.options,
        // isCompleted: communityQuiz.isCompleted,
      },
    });

    communityQuiz = await db.communityquiz.findFirst({
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
        topics: JSON.stringify([]),
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
  console.log("upload", upload);
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

    /* const lastUpload = await db.upload.findFirst({
      where: {
        id: upload,
        private: false,
      },
    }); */
    const lastCommunityQuiz = await db.communityquiz.findFirst({
      where: {
        id: upload,
        userId: id,
      },
    });
    let options: string[] =
      JSON.parse(lastCommunityQuiz.isCompleted as string) || [];
    if (!options.includes(topic)) {
      options.push(topic);
    }
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
