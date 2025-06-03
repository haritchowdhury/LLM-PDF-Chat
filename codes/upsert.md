export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Index } from "@upstash/vector";
import { updateUpstash, deleteUpstash } from "@/lib/upstash";
import db from "@/lib/db/db";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";

const redis = new Redis({
url: process.env.UPSTASH_REDIS_REST_URL,
token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const index = new Index({
url: process.env.UPSTASH_VECTOR_REST_URL,
token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

function filterStringsOnly(topics) {
return topics.filter((item) => typeof item === "string");
}

const MAX_REQUESTS_PER_WEEK = 2;
const EXPIRATION_TIME = 24 _ 60 _ 60 \* 7;

/\*

- Endpoint to create a chat room
  \*/
  export async function POST(request: NextRequest) {
  const data = await request.formData();
  let namespace = data.get("namespace") as string;
  let personal = data.get("private") as string;

const file = data.get("file") as File;
const baseName = file.name.replace(/\.[^/.]+$/, "");

const session = await auth();
const userId = String(session.user.id);

const requestCount =
(await redis.get<number>(`upsert_rate_limit:${userId}`)) || 0;

const userExists = await db.user.findUnique({
where: { id: userId },
});
if (!userExists) {
throw new Error("User not found");
}

if (!file) return new Response(null, { status: 400 });
const arrayBuffer = await file.arrayBuffer();
const fileSource = new Blob([arrayBuffer], { type: file.type });
const loader = new PDFLoader(fileSource, {
splitPages: true,
});
const docs = await loader.load();

const betaTester = await db.betatesters.findFirst({
where: {
email: session?.user.email,
},
});
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

let uploadId: string = namespace;

try {
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
          name: baseName,
          userId: userId,
          private: personal === "true" ? true : false,
          isDeleted: false,
        },
      });

      uploadId = Upload.id;
      namespace = uploadId;
    } /*else {
      const Upload = await db.upload.findFirst({
        where: { id: namespace, name: "ERASED" },
      });
      if (Upload) {
        const updatedUpload = await db.upload.update({
          where: {
            id: Upload.id,
          },
          data: {
            name: baseName,
          },
        });
      }
    } */

} catch (err) {
throw new Error("Upload Could not be created");
}
try {
let topics = await updateUpstash(index, namespace, docs, baseName);
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
        id: foundUpload.id,
      },
      data: {
        options: JSON.stringify(filteredTopics),
      },
    });

} catch (err) {
console.log("error: ", err);
throw new Error("Upstash Could be Updated");
}

try {
await redis.set(`upsert_rate_limit:${userId}`, requestCount + 1, {
ex: EXPIRATION_TIME,
});
return NextResponse.json({ message: uploadId }, { status: 200 });
} catch (err) {
throw new Error("Could not commit to redis");
}
}

/\*

- Endpoint to delete a chat room including Redis Cache
  \*/
  export async function DELETE(request: Request) {
  const { upload, type } = await request.json();
  const session = await auth();
  if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
  const sessionId = upload + "\_" + session.user.id;

      const Upload = await db.upload.findFirst({
        where: { id: upload },
      });

      if (session.user.id !== Upload.userId) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
      }

      await deleteUpstash(index, upload, sessionId);

      if (type === "delete") {
        await db.upload.update({
          where: {
            id: upload,
          },
          data: {
            isDeleted: true,
          },
        });
      } /* else {
        await db.upload.update({
          where: {
            id: upload,
          },
          data: {
            name: "ERASED",
          },
        });
      }*/
      return NextResponse.json({ userId: session.user.id });

  } catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
  }
  }
