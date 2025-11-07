# QStash Background Job Processing - Technical Design

## Overview

This document outlines the technical architecture for implementing background job processing using Upstash QStash for PDF upload and web scraping operations.

## QStash Architecture

### How QStash Works

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│     Client      │─────>│   Upload API     │─────>│    Database     │
│   (Browser)     │      │  /api/upsert     │      │  (Save Upload)  │
│                 │      │  /api/scraper    │      │ status:         │
└─────────────────┘      └──────┬───────────┘      │ "processing"    │
         │                      │                   └─────────────────┘
         │                      │ Publish Message
         │                      │ (type: "pdf" or "url")
         │                      ▼
         │               ┌──────────────┐
         │               │    QStash    │
         │               │ Message Queue│
         │               └──────┬───────┘
         │                      │
         │                      │ HTTP POST (with retries)
         │                      ▼
         │               ┌──────────────────────┐
         │               │  Worker Endpoint     │
         │               │ /api/worker/         │
         │               │ process-upload       │
         │               └──────┬───────────────┘
         │                      │
         │                      │ Route by type:
         │                      ├─> PDF: Load, chunk, embed, vectorize
         │                      └─> URL: Scrape, chunk, embed, vectorize
         │                      │
         │                      ▼
         │               ┌─────────────────┐
         │               │   Update DB     │
         │               │ status: completed│
         │               │    or failed    │
         │               └─────────────────┘
         │
         │ Poll every 3s
         └─────────────> /api/upload/[id]/status
```

### Key Features We'll Use

1. **HTTP-based messaging**: QStash sends HTTP POST requests to your worker endpoints
2. **Automatic retries**: Built-in exponential backoff (up to 3 retries by default)
3. **Delay support**: Can delay job execution
4. **Callbacks**: Success/failure webhooks for monitoring
5. **Request signing**: Verifies requests come from QStash

## Database Schema Changes

### Updated Prisma Schema

```prisma
model Upload {
  id            String   @id @default(cuid())
  userId        String
  fileName      String
  url           String?

  // New fields for async processing
  status        String   @default("processing")  // "processing" | "completed" | "failed"
  errorMessage  String?  // Store error details if failed
  progress      Int?     @default(0)  // Optional: 0-100 for progress tracking
  queuedAt      DateTime @default(now())
  startedAt     DateTime?  // When QStash worker started processing
  completedAt   DateTime?  // When processing finished

  // Existing fields
  user          User     @relation(fields: [userId], references: [id])
  messages      Message[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
  @@index([status])  // For efficient status queries
}
```

## API Endpoint Structure

### 1. PDF Upload Endpoint (Modified)

**Path**: `src/app/api/upsert/route.ts`

**Responsibility**:

- Validate user authentication
- Upload PDF to storage (S3/Vercel Blob)
- Create database record with `status: "processing"`
- Publish PDF processing job to QStash
- Return immediately with 202 Accepted

```typescript
export async function POST(request: Request) {
  // 1. Validate user authentication
  // 2. Parse and validate PDF file
  // 3. Upload file to storage
  // 4. Create Upload record in DB with status="processing"
  // 5. Publish PDF job to QStash
  // 6. Return 202 with uploadId
}
```

### 2. Web Scraper Endpoint (Modified)

**Path**: `src/app/api/scraper/route.ts`

**Responsibility**:

- Validate user authentication
- Validate URL
- Create database record with `status: "processing"`
- Publish scraper job to QStash
- Return immediately with 202 Accepted

```typescript
export async function POST(request: Request) {
  // 1. Validate user authentication
  // 2. Parse and validate URL
  // 3. Create Upload record in DB with status="processing"
  // 4. Publish scraper job to QStash
  // 5. Return 202 with uploadId
}
```

### 3. Worker Endpoint (NEW)

**Path**: `src/app/api/worker/process-upload/route.ts`

**Responsibility**:

- Verify QStash signature
- Receive job payload (PDF or URL scraping)
- Route to appropriate processor based on job type
- Process PDF/URL (embeddings, vectorization, topic extraction)
- Update database status

```typescript
export async function POST(request: Request) {
  // 1. Verify QStash signature
  // 2. Extract job payload (contains type: "pdf" | "url")
  // 3. Update status to "processing", set startedAt
  // 4. Route to PDF processor OR URL scraper processor
  // 5. Execute heavy processing:
  //    - For PDF: Load PDF, chunk text, generate embeddings, upsert vectors, extract topics
  //    - For URL: Scrape web content, chunk text, generate embeddings, upsert vectors, extract topics
  // 6. Update status to "completed" or "failed"
  // 7. Return 200 OK
}
```

### 4. Status Polling Endpoint (NEW)

**Path**: `src/app/api/upload/[id]/status/route.ts`

**Responsibility**:

- Check upload/scraping status
- Return current state

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const upload = await db.upload.findUnique({
    where: { id: params.id },
    select: {
      status: true,
      errorMessage: true,
      progress: true,
      completedAt: true,
    },
  });

  return NextResponse.json(upload);
}
```

### 5. Callback Endpoint (Optional - NEW)

**Path**: `src/app/api/worker/callback/route.ts`

**Responsibility**:

- Receive QStash callbacks for job success/failure
- Log metrics, send notifications

## Implementation Details

### Step 1: Install QStash SDK

```bash
npm install @upstash/qstash
```

### Step 2: Environment Variables

```env
# .env.local
QSTASH_URL=https://qstash.upstash.io/v2/publish
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_current_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Your app URL (for worker endpoints)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# or for development:
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: QStash Client Setup

**Path**: `src/lib/qstash.ts` (NEW)

```typescript
import { Client } from "@upstash/qstash";

export const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export interface UploadJobPayload {
  uploadId: string;
  userId: string;
  type: "pdf" | "url";

  // For PDF uploads (type: "pdf")
  fileName?: string;
  fileUrl?: string; // S3/storage URL where PDF is stored

  // For URL scraping (type: "url")
  url?: string; // The web URL to scrape
}

export async function publishUploadJob(payload: UploadJobPayload) {
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-upload`;

  const result = await qstashClient.publishJSON({
    url: workerUrl,
    body: payload,
    retries: 3, // Retry up to 3 times on failure
    callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/callback`,
    failureCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/callback`,
  });

  return result.messageId;
}
```

### Step 4: Signature Verification Utility

**Path**: `src/lib/qstash-verify.ts` (NEW)

```typescript
import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

export async function verifyQStashSignature(
  request: Request,
  body: string
): Promise<boolean> {
  const signature = request.headers.get("Upstash-Signature");

  if (!signature) {
    return false;
  }

  try {
    await receiver.verify({
      signature,
      body,
    });
    return true;
  } catch (error) {
    console.error("QStash signature verification failed:", error);
    return false;
  }
}
```

### Step 5: Modified Upload API

**Path**: `src/app/api/upsert/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { publishUploadJob } from "@/lib/qstash";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload file to storage (S3, Vercel Blob, etc.)
    // const fileUrl = await uploadToStorage(file);

    // 2. Create Upload record in database
    const upload = await db.upload.create({
      data: {
        userId,
        fileName: file.name,
        url: fileUrl, // Storage URL
        status: "processing",
        queuedAt: new Date(),
      },
    });

    // 3. Publish job to QStash
    await publishUploadJob({
      uploadId: upload.id,
      userId,
      fileName: file.name,
      fileUrl,
      type: "pdf",
    });

    // 4. Return immediately
    return NextResponse.json(
      {
        uploadId: upload.id,
        status: "processing",
        message: "Upload started. Processing in background.",
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
```

### Step 5B: Modified Scraper API

**Path**: `src/app/api/scraper/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { publishUploadJob } from "@/lib/qstash";

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 1. Create Upload record in database
    const upload = await db.upload.create({
      data: {
        userId,
        fileName: `Scraped: ${url}`,
        url: url, // The URL being scraped
        status: "processing",
        queuedAt: new Date(),
      },
    });

    // 2. Publish scraper job to QStash
    await publishUploadJob({
      uploadId: upload.id,
      userId,
      type: "url",
      url,
    });

    // 3. Return immediately
    return NextResponse.json(
      {
        uploadId: upload.id,
        status: "processing",
        message: "URL scraping started. Processing in background.",
      },
      { status: 202 } // 202 Accepted
    );
  } catch (error) {
    console.error("Scraper error:", error);
    return NextResponse.json(
      { error: "Failed to start scraping" },
      { status: 500 }
    );
  }
}
```

### Step 6: Worker Endpoint Implementation

**Path**: `src/app/api/worker/process-upload/route.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyQStashSignature } from "@/lib/qstash-verify";
import { updateUpstash } from "@/lib/upstash"; // Your existing vectorization logic
import { UploadJobPayload } from "@/lib/qstash";

export async function POST(request: Request) {
  try {
    // 1. Read the raw body for signature verification
    const body = await request.text();

    // 2. Verify QStash signature
    const isValid = await verifyQStashSignature(request, body);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Parse payload
    const payload: UploadJobPayload = JSON.parse(body);
    const { uploadId, fileUrl, type, url } = payload;

    // 4. Update status to processing with startedAt timestamp
    await db.upload.update({
      where: { id: uploadId },
      data: {
        status: "processing",
        startedAt: new Date(),
      },
    });

    try {
      // 5. Execute the heavy processing based on job type
      if (type === "pdf") {
        // PDF processing (from src/lib/upstash.ts:44-127)
        // - Load PDF from storage
        // - Split into 2000-char chunks
        // - Generate OpenAI embeddings
        // - Batch upsert to vector DB (500 vectors/batch)
        // - Extract topics via LLM
        await processPdfUpload(uploadId, fileUrl!);
      } else if (type === "url") {
        // URL scraping (from src/lib/upstash.ts:283-342)
        // - Scrape web content with Cheerio
        // - Split into 7000-char chunks
        // - Generate OpenAI embeddings
        // - Batch upsert to vector DB
        // - Extract topics via LLM
        await processUrlScraping(uploadId, url!);
      }

      // 6. Mark as completed
      await db.upload.update({
        where: { id: uploadId },
        data: {
          status: "completed",
          completedAt: new Date(),
          progress: 100,
        },
      });

      return NextResponse.json({ success: true });
    } catch (processingError) {
      // 7. Mark as failed with error message
      await db.upload.update({
        where: { id: uploadId },
        data: {
          status: "failed",
          errorMessage:
            processingError instanceof Error
              ? processingError.message
              : "Unknown error occurred",
          completedAt: new Date(),
        },
      });

      // Still return 200 so QStash doesn't retry
      // (the error is stored in the database)
      return NextResponse.json({
        success: false,
        error:
          processingError instanceof Error
            ? processingError.message
            : "Processing failed",
      });
    }
  } catch (error) {
    console.error("Worker error:", error);
    // Return 500 so QStash will retry
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Extract your existing PDF processing logic into this function
async function processPdfUpload(uploadId: string, fileUrl: string) {
  // Your existing logic from updateUpstash:
  // 1. Load PDF from fileUrl
  // 2. Split into chunks
  // 3. Generate embeddings
  // 4. Upsert to vector database
  // 5. Generate topics
  // You can optionally update progress:
  // await db.upload.update({
  //   where: { id: uploadId },
  //   data: { progress: 50 }
  // });
}

async function processUrlScraping(uploadId: string, url: string) {
  // Your existing scraping logic
}

// Increase timeout for Vercel serverless functions
export const maxDuration = 300; // 5 minutes
```

### Step 7: Status Polling Endpoint

**Path**: `src/app/api/upload/[id]/status/route.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const upload = await db.upload.findUnique({
      where: {
        id: params.id,
        userId, // Ensure user can only check their own uploads
      },
      select: {
        status: true,
        errorMessage: true,
        progress: true,
        completedAt: true,
        queuedAt: true,
        startedAt: true,
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    return NextResponse.json(upload);
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
```

### Step 8: Callback Endpoint (Optional)

**Path**: `src/app/api/worker/callback/route.ts` (NEW)

```typescript
import { NextResponse } from "next/server";
import { verifyQStashSignature } from "@/lib/qstash-verify";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const isValid = await verifyQStashSignature(request, body);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const callback = JSON.parse(body);

    // Log callback for monitoring
    console.log("QStash callback:", {
      messageId: callback.messageId,
      status: callback.status, // "success" or "failed"
      error: callback.error,
    });

    // Optional: Send notifications, log to monitoring service, etc.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}
```

## Frontend Changes

### 1. Status Polling Hook

**Path**: `src/hooks/useUploadStatus.ts` (NEW)

```typescript
import { useEffect, useState } from "react";

interface UploadStatus {
  status: "processing" | "completed" | "failed";
  errorMessage?: string | null;
  progress?: number | null;
  completedAt?: string | null;
}

export function useUploadStatus(uploadId: string | null) {
  const [data, setData] = useState<UploadStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uploadId) return;

    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/upload/${uploadId}/status`);
        if (!response.ok) throw new Error("Failed to fetch status");

        const status: UploadStatus = await response.json();
        setData(status);
        setLoading(false);

        // Stop polling if completed or failed
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
        }
      } catch (error) {
        console.error("Status polling error:", error);
        setLoading(false);
      }
    };

    // Initial check
    pollStatus();

    // Poll every 3 seconds
    interval = setInterval(pollStatus, 3000);

    return () => clearInterval(interval);
  }, [uploadId]);

  return { data, loading };
}
```

### 2. Update UploadForm Component

**Path**: `src/components/UploadForm.tsx`

```typescript
// In the submit handler (around line 73-92):

const response = await fetch("/api/upsert", {
  method: "POST",
  body: formData,
});

const data = await response.json();

if (response.status === 202) {
  // Background job started
  toast({
    title: "Upload Started",
    description: "Your file is being processed in the background...",
  });

  // Redirect to chat page (will show processing indicator)
  router.push(`/chat/${data.uploadId}`);
} else if (response.ok) {
  // Fallback for immediate processing (if needed)
  toast({ description: "Upload completed!" });
  router.push(`/chat/${data.uploadId}`);
} else {
  toast({
    title: "Error",
    description: data.error || "Upload failed",
    variant: "destructive",
  });
}
```

### 3. Update UpsertLink Component (URL Scraping in Chat)

**Path**: `src/components/Chat/UpsertLink.tsx`

This component handles URL scraping from within the chat interface.

```typescript
// Around lines 42-68 - Update the submit handler

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch("/api/scraper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (response.status === 202) {
      // Background job started
      toast({
        title: "Scraping Started",
        description: "The URL is being processed in the background...",
      });

      // Close dialog and refresh to show processing status
      setIsOpen(false);
      router.refresh(); // Or update local state to show processing indicator
    } else if (!response.ok) {
      toast({
        title: "Error",
        description: data.error || "Failed to scrape URL",
        variant: "destructive",
      });
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Something went wrong",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
```

### 4. Update ProcessContext Component

**Path**: `src/components/ProcessContext.tsx`

This component also handles uploads (around lines 68-97).

```typescript
// Update the upload handler similar to UploadForm.tsx

const response = await fetch("/api/upsert", {
  method: "POST",
  body: formData,
});

const data = await response.json();

if (response.status === 202) {
  toast({
    description: "Upload started. Processing in background...",
  });
  router.push(`/chat/${data.uploadId}`);
} else if (response.ok) {
  toast({ description: "Upload completed!" });
  router.push(`/chat/${data.uploadId}`);
} else {
  toast({
    description: data.error || "Upload failed",
    variant: "destructive",
  });
}
```

### 5. Update Chat Page

**Path**: `src/app/chat/[id]/page.tsx` or `src/components/Chat/Chat.tsx`

```typescript
import { useUploadStatus } from '@/hooks/useUploadStatus';

export default function ChatPage({ params }: { params: { id: string } }) {
  const { data: uploadStatus, loading } = useUploadStatus(params.id);

  if (loading) {
    return <LoadingSpinner message="Checking upload status..." />;
  }

  if (uploadStatus?.status === 'processing') {
    return (
      <ProcessingIndicator
        progress={uploadStatus.progress}
        message="Processing your document... This may take a few minutes."
      />
    );
  }

  if (uploadStatus?.status === 'failed') {
    return (
      <ErrorMessage
        title="Processing Failed"
        message={uploadStatus.errorMessage || "Something went wrong"}
      />
    );
  }

  // Only render chat when status === 'completed'
  return <ChatInterface uploadId={params.id} />;
}
```

## Error Handling Strategy

### 1. Retry Logic

QStash provides automatic retries with exponential backoff:

- Retry 1: After 15 seconds
- Retry 2: After 1 minute
- Retry 3: After 5 minutes

### 2. Failure Scenarios

| Scenario                                 | Status                    | Action                       |
| ---------------------------------------- | ------------------------- | ---------------------------- |
| Worker endpoint down                     | 500                       | QStash retries up to 3 times |
| Processing error (embeddings API failed) | 200 with `status: failed` | Store error in DB, no retry  |
| Timeout (> 5 min)                        | Update status to failed   | User notified                |
| Invalid PDF file                         | 200 with `status: failed` | Store error, user notified   |
| Invalid/unreachable URL                  | 200 with `status: failed` | Store error, user notified   |
| Web scraping blocked (403/robot.txt)     | 200 with `status: failed` | Store error, user notified   |
| Rate limit on OpenAI API                 | 500                       | QStash retries with backoff  |

### 3. Monitoring

```typescript
// Add to worker endpoint
import { captureException } from "@sentry/nextjs"; // or your monitoring tool

try {
  // processing logic
} catch (error) {
  captureException(error, {
    tags: {
      worker: "process-upload",
      uploadId,
    },
  });

  // Update DB with failure
}
```

## Development vs Production

### Local Development with QStash

For local development, you need to expose your localhost to the internet so QStash can call your worker endpoint:

**Option 1: ngrok**

```bash
ngrok http 3000
# Use the ngrok URL as NEXT_PUBLIC_APP_URL
```

**Option 2: Upstash Dev Tunnel** (Coming soon)

**Option 3: Mock QStash locally**

```typescript
// src/lib/qstash.ts
export async function publishUploadJob(payload: UploadJobPayload) {
  if (process.env.NODE_ENV === "development") {
    // Call worker endpoint directly for local dev
    await fetch(`http://localhost:3000/api/worker/process-upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return "local-dev";
  }

  // Production: Use QStash
  const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-upload`;
  // ... rest of QStash logic
}
```

## Performance Considerations

### 1. Database Connection Pooling

Workers will create database connections. Ensure your database can handle concurrent connections:

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 2. Concurrent Job Processing

QStash will call your worker endpoint for each job. Ensure your:

- Database can handle concurrent writes
- Vector database (Upstash Vector) can handle concurrent upserts
- OpenAI API rate limits are respected

### 3. Timeout Configuration

```typescript
// Worker endpoint
export const maxDuration = 300; // 5 minutes (Vercel Pro)
// or
export const config = {
  maxDuration: 300,
};
```

## Cost Estimation

### QStash Pricing (as of 2024)

- Free tier: 500 messages/day
- Pro: $10/month for 5,000 messages
- Pay-as-you-go: $1 per 1,000 messages

### Example:

- 50 PDF uploads + 50 URL scrapes/day = 100 messages/day (well within free tier)
- 500 PDF uploads + 500 URL scrapes/day = 1,000 messages/day ($6/month)
- Each job (PDF or URL) = 1 QStash message

## Security Considerations

1. **Always verify QStash signatures** in worker endpoints
2. **Validate uploadId** and ensure user ownership
3. **Sanitize file inputs** before processing
4. **Rate limit** upload endpoints to prevent abuse
5. **Set maximum file sizes** to prevent resource exhaustion

## Migration Path

### Phase 1: Database Migration

```bash
npx prisma migrate dev --name add_upload_status
```

### Phase 2: Deploy Worker Endpoints

- Deploy status and worker endpoints
- Test with QStash locally

### Phase 3: Update Upload API

- Switch upload API to use QStash
- Keep old synchronous code as fallback

### Phase 4: Update Frontend

- Deploy frontend changes with polling
- Monitor error rates

### Phase 5: Cleanup

- Remove synchronous processing code
- Remove old timeout logic

## Complete File Changes Summary

### Backend Files

#### New Files (7)

1. **`src/lib/qstash.ts`** - QStash client and job publisher
2. **`src/lib/qstash-verify.ts`** - Signature verification utility
3. **`src/app/api/worker/process-upload/route.ts`** - Worker endpoint for both PDF and URL processing
4. **`src/app/api/worker/callback/route.ts`** - Optional QStash callback handler
5. **`src/app/api/upload/[id]/status/route.ts`** - Status polling endpoint

#### Modified Files (2)

6. **`src/app/api/upsert/route.ts`** - Change to return 202 immediately and publish PDF job
7. **`src/app/api/scraper/route.ts`** - Change to return 202 immediately and publish scraper job

#### Database

8. **`prisma/schema.prisma`** - Add status, errorMessage, progress, queuedAt, startedAt, completedAt fields

### Frontend Files

#### New Files (1)

9. **`src/hooks/useUploadStatus.ts`** - Status polling React hook

#### Modified Files (3)

10. **`src/components/UploadForm.tsx`** - Handle 202 response, redirect immediately
11. **`src/components/Chat/UpsertLink.tsx`** - Handle 202 response for URL scraping
12. **`src/components/ProcessContext.tsx`** - Handle 202 response
13. **`src/app/chat/[id]/page.tsx` or `src/components/Chat/Chat.tsx`** - Add status checking and show processing UI

### Configuration Files

14. **`.env.local`** - Add QStash environment variables:

    - `QSTASH_URL`
    - `QSTASH_TOKEN`
    - `QSTASH_CURRENT_SIGNING_KEY`
    - `QSTASH_NEXT_SIGNING_KEY`
    - `NEXT_PUBLIC_APP_URL`

15. **`package.json`** - Add `@upstash/qstash` dependency

### Total: 15 files (8 new, 7 modified)

## Operations Moved to Background

### 1. PDF Upload Processing

**From**: `src/app/api/upsert/route.ts:37-156`
**Blocking time**: Up to 45 seconds
**Operations moved to worker**:

- PDF loading and parsing
- Text splitting (2000-char chunks) - `src/lib/upstash.ts:44-49`
- OpenAI embedding generation - `src/lib/upstash.ts:58-60`
- Batch vector upserts (500 vectors/batch) - `src/lib/upstash.ts:85-89`
- LLM topic extraction - `src/lib/upstash.ts:109-116`

### 2. Web Scraper Processing

**From**: `src/app/api/scraper/route.ts:55-175`
**Blocking time**: Up to 45 seconds
**Operations moved to worker**:

- Web scraping with Cheerio - Line 103-106
- Text chunking (7000-char segments) - Line 109
- OpenAI embedding generation - `src/lib/upstash.ts:283-285`
- Vector upserts in batches - `src/lib/upstash.ts:310-313`
- LLM topic generation - `src/lib/upstash.ts:333-342`

## Testing Strategy

### 1. Unit Tests

```typescript
// Test QStash client
describe("publishUploadJob", () => {
  it("should publish job to QStash", async () => {
    const payload = {
      /* ... */
    };
    const messageId = await publishUploadJob(payload);
    expect(messageId).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
// Test worker endpoint
describe("POST /api/worker/process-upload", () => {
  it("should reject invalid signatures", async () => {
    const response = await fetch("/api/worker/process-upload", {
      method: "POST",
      body: JSON.stringify({ uploadId: "test" }),
    });
    expect(response.status).toBe(401);
  });
});
```

### 3. E2E Tests

- Upload file → Check 202 response → Poll status → Verify completion

## Next Steps

### Phase 1: Setup (30 minutes)

1. Set up Upstash QStash account at https://console.upstash.com
2. Get QStash credentials (token and signing keys)
3. Add environment variables to `.env.local`
4. Install QStash SDK: `npm install @upstash/qstash`

### Phase 2: Database (15 minutes)

5. Update `prisma/schema.prisma` with new fields
6. Run migration: `npx prisma migrate dev --name add_upload_status`
7. Generate Prisma client: `npx prisma generate`

### Phase 3: Backend Core (1-2 hours)

8. Create `src/lib/qstash.ts` - QStash client and job publisher
9. Create `src/lib/qstash-verify.ts` - Signature verification
10. Create `src/app/api/upload/[id]/status/route.ts` - Status endpoint

### Phase 4: Worker Implementation (2-3 hours)

11. Create `src/app/api/worker/process-upload/route.ts`
12. Extract PDF processing logic from `src/lib/upstash.ts` into `processPdfUpload` function
13. Extract URL scraping logic from `src/lib/upstash.ts` into `processUrlScraping` function
14. Add error handling and progress tracking

### Phase 5: Update APIs (30 minutes)

15. Modify `src/app/api/upsert/route.ts` to publish PDF jobs
16. Modify `src/app/api/scraper/route.ts` to publish scraper jobs
17. Add file upload to storage (if not already done)

### Phase 6: Frontend (1-2 hours)

18. Create `src/hooks/useUploadStatus.ts` - Status polling hook
19. Update `src/components/UploadForm.tsx` - Handle 202 response
20. Update `src/components/Chat/UpsertLink.tsx` - Handle 202 for scraping
21. Update `src/components/ProcessContext.tsx` - Handle 202 response
22. Update chat page to show processing/completed/failed states

### Phase 7: Testing (1-2 hours)

23. Test PDF upload locally (use ngrok to expose localhost)
24. Test URL scraping locally
25. Verify status polling works
26. Test error scenarios (invalid file, invalid URL)
27. Check database status updates

### Phase 8: Deployment

28. Deploy to production (Vercel/your platform)
29. Update `NEXT_PUBLIC_APP_URL` to production URL
30. Test end-to-end in production
31. Monitor QStash dashboard for job success/failure rates

### Phase 9: Optional Enhancements

32. Create `src/app/api/worker/callback/route.ts` for monitoring
33. Add progress indicators for long-running jobs
34. Implement notification system for completed jobs
35. Add analytics/logging for job performance

**Estimated Total Time**: 6-10 hours for complete implementation

## Resources

- [QStash Documentation](https://upstash.com/docs/qstash)
- [QStash SDK](https://github.com/upstash/qstash-js)
- [Next.js API Routes with long execution times](https://vercel.com/docs/functions/serverless-functions/runtimes#max-duration)

🎉 QStash Background Job  
 Implementation Complete!

I've successfully
implemented the complete  
 background job processing  
 system using Upstash  
 QStash. Here's what was  
 built:

📦 Summary of Changes

Backend (8 new files, 2  
 modified)

New Infrastructure:

1. ✅
   src/lib/blob-storage.ts -  
    Redis-based temporary  
   PDF storage (1 hour TTL)
2. ✅ src/lib/qstash.ts -  
    QStash client with dev  
   mode support
3. ✅
   src/lib/qstash-verify.ts

- Signature verification  
  utility

4. ✅ src/app/api/worker/  
   process-upload/route.ts -  
    Worker endpoint for both  
    PDF & URL processing
5. ✅ src/app/api/upload/  
   status/[id]/route.ts -  
   Status polling endpoint

Modified APIs: 6. ✅ src/app/api/upsert/  
 route.ts - Now returns  
 202 immediately, queues  
 PDF job 7. ✅ src/app/api/scraper  
 /route.ts - Now returns  
 202 immediately, queues  
 scraper job

Database: 8. ✅ schema.prisma -  
 Added ProcessingStatus  
 enum + 6 new fields to  
 Upload model

Frontend (1 new file, 4  
 modified)

New Components: 9. ✅ src/hooks/useUpload  
 Status.ts - Polling hook  
 with helper functions  
 10. ✅ src/components/Cha  
 t/ChatWrapper.tsx -
Handles processing/comple  
 ted/failed states

Modified Components: 11. ✅ src/components/Upl  
 oadForm.tsx - Handles 202  
 responses for both PDF &  
 URL 12. ✅ src/components/Cha  
 t/UpsertLink.tsx -
Handles 202 for URL
scraping in chat 13. ✅ src/components/Pro  
 cessContext.tsx - Handles  
 202 for deferred
processing 14. ✅ src/app/chat/[uplo
 adId]/page.tsx - Uses  
 ChatWrapper to show
states

🚀 Key Features
Implemented

Development Mode

- ✅ Direct worker calls  
  (no QStash needed
  locally)
- ✅ Signature
  verification skipped in  
  dev
- ✅ Set via NODE_ENV ===  
  "development"

Status States

- PENDING → Queued, not  
  yet started
- PROCESSING → Worker is  
  processing
- COMPLETED → Ready for  
  chat
- FAILED → Error occurred  
  (stored in errorMessage)

User Experience

- ⚡ Before: Wait 45
  seconds → Timeout risk
- ⚡ After: Wait 2
  seconds → Chat with
  "Processing..." →
  Auto-enables when ready

📝 How It Works

1. Upload Flow:
   User uploads → PDF saved  
   to Redis blob → Upload  
   created (PENDING)
   → Job published to QStash  
    → Returns 202
   immediately
   → User redirects to chat  
   → Shows "Processing..."
2. Worker Flow:
   QStash → Calls /api/worke  
   r/process-upload →
   Verifies signature
   → Updates status
   (PROCESSING) → Loads PDF  
   from blob
   → Generates embeddings →  
   Upserts vectors →
   Extracts topics
   → Updates status
   (COMPLETED) → Frontend  
   polls and detects
   completion
3. Frontend Polling:
   useUploadStatus hook →  
   Polls
   /api/upload/status/[id]  
   every 3s
   → Stops when COMPLETED or  
    FAILED → ChatWrapper  
   shows appropriate UI

🧪 Testing

You can test it now by:

1. PDF Upload: Upload a  
   PDF from the homepage
2. URL Scraping: Scrape a  
   URL from the homepage or  
   chat
3. Watch the processing  
   states in action!

In development, it will:

- Call worker directly  
  (no QStash HTTP calls)
- Process in the same  
  server instance
- Still show the async  
  flow

In production, it will:

- Use QStash message
  queue
- Verify signatures
- Retry failed jobs
  automatically (up to 3  
  times)

📊 Database Schema Added

processingStatus
ProcessingStatus
@default(PENDING)
errorMessage
String?
vectorCount
Int?
blobStorageKey
String?
processingStartedAt
DateTime?
processingCompletedAt  
 DateTime?

Everything is ready to  
 go! The system will now  
 handle long-running PDF  
 and URL processing
without blocking users.  
 🎊
