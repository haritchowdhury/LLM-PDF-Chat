import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { scrapeWebpage } from "@/lib/cheerio";
import { updateUpstashWithUrl } from "@/lib/upstash";
import { Index } from "@upstash/vector";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";

const redis = new Redis({
url: process.env.UPSTASH_REDIS_REST_URL,
token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const MAX_REQUESTS_PER_WEEK = 2;
const EXPIRATION_TIME = 24 _ 60 _ 60 \* 7;

// Function to chunk text into segments of specified length
function chunkText(text, chunkSize = 7000) {
const chunks = [];

for (let i = 0; i < text.length; i += chunkSize) {
chunks.push(text.slice(i, i + chunkSize));
}

return chunks;
}
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
const betaTester = await db.betatesters.findFirst({
where: {
email: session?.user.email,
},
});
const requestCount =
(await redis.get<number>(`upsert_rate_limit:${userId}`)) || 0;
/\*
if (!betaTester) {
if (requestCount >= MAX_REQUESTS_PER_WEEK) {
return NextResponse.json(
{
error: `You have exceeded the nuber of documents you can upload in a Week. Weekly limit ${MAX_REQUESTS_PER_WEEK}`,
},
{ status: 429 }
);
}
} else {
if (requestCount >= 31) {
return NextResponse.json(
{
error: `You have exceeded the nuber of documents you can upload in a Week. Weekly limit ${30}`,
},
{ status: 429 }
);
}
}

if (docs.length >= 31) {
return NextResponse.json(
{
error: `You can only upload 30 pages at a time!`,
},
{ status: 419 }
);
} \*/

try {
let { url, namespace, sharable } = urlSchema.parse(body);
//console.log("received at api:", url, namespace, sharable);
let uploadId: string = namespace;
if (namespace === "undefined") {
const Uploads = await db.upload.findMany({
where: { userId: session?.user.id, private: true, isDeleted: false },
orderBy: { timeStarted: "desc" },
});

      const Shares = await db.upload.findMany({
        where: { userId: userId, private: false, isDeleted: false },
        orderBy: { timeStarted: "desc" },
      });

      /*  if (
        (!betaTester && (Uploads.length >= 1 || Shares.length >= 1)) ||
        (betaTester && (Uploads.length >= 3 || Shares.length >= 3))
      ) {
        return NextResponse.json(
          {
            error: `You have exceeded the number of spaces you can create`,
          },
          { status: 429 }
        );
      } */

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
    const textChunks = chunkText(scrappedText, 7000);

    //console.log("scrapped text", scrappedText);
    let topics = await updateUpstashWithUrl(index, namespace, textChunks, url);
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
    await redis.set(`upsert_rate_limit:${userId}`, requestCount + 1, {
      ex: EXPIRATION_TIME,
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
