import { strict_output } from "@/lib/groqTopicSetter";
import { NextResponse, NextRequest } from "next/server";
import { queryUpstash } from "@/lib/upstash";
import { Index } from "@upstash/vector";
import db from "@/lib/db/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateTopicSchema = z.object({
  topic: z.string().min(1).max(100),
  upload: z.string().uuid(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

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
  const validation = updateTopicSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validation.error.errors },
      { status: 400 }
    );
  }
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

    const updatedUpload = await db.$transaction(async (tx) => {
      const lastUpload = await tx.upload.findFirst({
        where: { id: upload, userId: id, isDeleted: false },
      });

      if (!lastUpload) throw new Error("Upload not found");

      let options: string[] =
        JSON.parse(lastUpload.isCompleted as string) || [];
      if (!options.includes(topic)) {
        options.push(topic);
      }

      return await tx.upload.update({
        where: { id: lastUpload.id },
        data: { isCompleted: JSON.stringify(options) },
      });
    });
    /*const lastUpload = await db.upload.findFirst({
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
    }); */
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
