import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { scrapeWebpage } from "@/lib/cheerio";
import { updateUpstashWithUrl } from "@/lib/upstash";
import { Index } from "@upstash/vector";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";

const urlSchema = z.object({
  url: z.string().url(),
  namespace: z.string(),
  sharable: z.string(),
});

type Schema = z.infer<typeof urlSchema>;

function filterStringsOnly(topics: any) {
  return topics.filter((item: any) => typeof item === "string");
}

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const session = await auth();
  const userId = String(session.user.id);

  try {
    let { url, namespace, sharable } = urlSchema.parse(body);
    //console.log("received at api:", url, namespace, sharable);
    let uploadId: string = namespace;
    if (namespace === "undefined") {
      const Upload = await db.upload.create({
        data: {
          id: uuid(),
          timeStarted: new Date(),
          name: url,
          userId: userId,
          private: sharable === "false" ? true : false,
          isDeleted: false,
        },
      });

      uploadId = Upload.id;
      namespace = uploadId;
    }
    const scrappedText = await scrapeWebpage(url);
    //console.log("scrapped text", scrappedText);
    let topics = await updateUpstashWithUrl(
      index,
      namespace,
      scrappedText,
      url
    );
    const foundUpload = await db.upload.findFirst({
      where: {
        id: uploadId,
      },
    });
    const existingTopics: string[] = JSON.parse(foundUpload.options as string);
    //console.log("topics at upsert", topics, existingTopics);

    topics = topics.concat(existingTopics);
    const filteredTopics = filterStringsOnly(topics);

    await db.upload.update({
      where: {
        id: uploadId,
      },
      data: {
        options: JSON.stringify(filteredTopics),
      },
    });
    return NextResponse.json({ message: uploadId }, { status: 200 });
  } catch (error) {
    console.log(error);
    // Check if it's a Zod validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          error: "Failed to scrape url, please try another one!",
          details: error.errors,
        },
        { status: 400 }
      );
    }
  }
}
