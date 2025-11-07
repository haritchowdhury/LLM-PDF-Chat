● Performance Analysis:
Background Jobs & Bottlenecks

Based on my analysis of your  
 routes and APIs, here are the  
 critical findings:

---

🔴 CRITICAL - Operations
Currently Blocking Users (Must  
 Move to Background)

1. PDF Upload Processing (src/a
   pp/api/upsert/route.ts:37-156)

Current Wait Time: Up to 45  
 seconds (with timeout)

Blocking Operations:

- PDF loading and parsing (line 60)
- Text splitting into 2000-char chunks (src/lib/upstash.ts:44-49)
- OpenAI embedding generation (src/lib/upstash.ts:58-60) - Most expensive operation
- Batch vector upserts to (500 vectors/batch) (src/lib/upstash.ts:85-89)
- LLM topic extraction - Multiple calls for large documents (src/lib/upstash.ts:109-116)

Why it's slow: For a 50-page  
 PDF, you're generating
embeddings for hundreds of
chunks and making multiple LLM  
 calls. User waits the entire  
 time.

Recommendation: Return upload  
 ID immediately, process
vectorization in background  
 job, add status polling
endpoint.

---

2. Web Scraper Processing
   (src/app/api/scraper/route.ts:5  
   5-175)

Current Wait Time: Up to 45  
 seconds (with timeout)

Blocking Operations:

- Web scraping with Cheerio  
  (line 103-106)
- Text chunking into 7000-char  
  segments (line 109)
- OpenAI embedding generation  
  for all chunks
  (src/lib/upstash.ts:283-285)
- Vector upserts in batches  
  (src/lib/upstash.ts:310-313)
- LLM topic generation
  (src/lib/upstash.ts:333-342)

Why it's slow: Same as PDF -  
 embeddings + LLM calls. Plus  
 web scraping can be
unpredictable.

Recommendation: Background job  
 with status updates.

---

3. Quiz/Game Question
   Generation (src/app/api/game/ro  
   ute.ts:80-86)

Current Wait Time: 10-40
seconds depending on question  
 count

Blocking Operations:

- Game creation endpoint
  synchronously calls
  /api/questions
- /api/questions performs
  vector query + LLM generation  
  for each question
- User waits for ALL questions  
  before seeing game ID

Why it's slow: Nested
synchronous API call with LLM  
 generation blocking the
response.

Recommendation:

- Create game record
  immediately
- Return game ID right away
- Generate questions in
  background
- Add polling endpoint to check  
  if questions are ready

---

🟡 MEDIUM PRIORITY - Operations  
 That Scale Poorly

4. Vector Deletion
   (src/lib/upstash.ts:352-431)

Current Approach: Synchronous  
 deletion with pagination

Blocking Operations:

- Fetches vectors in batches of  
  1000 (line 381-389)
- Filters by namespace metadata  
  (lines 393-401)
- Deletes matching vectors
  (line 405)
- Loops until all deleted

Why it's slow: For large
uploads (thousands of vectors),  
 this loops many times.

Recommendation: Mark upload as  
 isDeleted immediately (already  
 doing this!), clean up vectors  
 in background job.

---

5. Chat History Retrieval (src/  
   app/api/chat/history/route.ts)

Current Status: Acceptable, but  
 could optimize

Consideration: As chat history  
 grows, Redis retrieval could  
 slow down. Already limiting to  
 10 messages, which is good.

---

🟢 ACCEPTABLE - Operations with  
 OK Performance

6. Chat API (src/app/api/chat/r  
   oute.ts:52-218)

Current Approach: Synchronous  
 LLM response

Why it's acceptable: Chat UX  
 expects some latency. Users  
 understand AI needs time to  
 think.

Potential Improvement: Use
streaming responses
(Server-Sent Events) to show  
 real-time generation instead of  
 waiting for complete response.

---

📊 Scalability Concerns Under  
 Load

Operations that will degrade  
 with increased users:

1. OpenAI API Embedding Calls  
   (src/lib/upstash.ts:52-60,
   277-285)


    - Each PDF page = dozens of

embedding calls - OpenAI has rate limits - With 100 concurrent
uploads, you'll hit rate limits  
 fast - Solution: Queue system with  
 retry logic 2. Groq LLM Calls (topic
extraction, question
generation) - Multiple LLM calls per
document - Can timeout under load - Solution: Background queue  
 with exponential backoff 3. Database Writes - Multiple db.upload.update()  
 calls - Question creation with
createMany() - Current Status: Acceptable,  
 but monitor query performance  
 4. Redis Rate Limiting - Already implemented
correctly - Currently commented out for  
 testing (lines 144-160 in
chat/route.ts) - Action Required: Re-enable  
 before production

---

🎯 Recommended Implementation  
 Priority

Phase 1 - Critical (Do First):

1. Move PDF upload
   vectorization to background job
2. Move web scraper processing  
   to background job
3. Add upload status tracking  
   (processing/completed/failed)
4. Add status polling endpoints

Phase 2 - Important: 5. Move question generation to  
 background for game creation  
 6. Add game question status  
 polling 7. Implement proper queue
system (BullMQ, Inngest, or  
 similar)

Phase 3 - Optimization: 8. Add streaming responses for  
 chat 9. Optimize vector deletion  
 (already soft-deleting, just  
 make cleanup async) 10. Add monitoring/alerting for  
 queue health

---

💡 Specific File References for  
 Background Job Candidates

| File
| Lines | Operation
|
Priority |
|------------------------------  
 |---------|--------------------  
 ----------------------|--------  
 -----|
| src/app/api/upsert/route.ts  
 | 105-108 | updateUpstash()  
 vectorization | 🔴  
 Critical |
| src/app/api/scraper/route.ts  
 | 103-114 | Web scraping +
vectorization | 🔴  
 Critical |
| src/app/api/game/route.ts  
 | 80-86 | Synchronous
/api/questions call |  
 🔴 Critical |
| src/lib/upstash.ts
| 31-125 | updateUpstash() -  
 entire function | 🔴  
 Critical |
| src/lib/upstash.ts
| 257-350 |
updateUpstashWithUrl() - entire  
 function | 🔴 Critical |
| src/lib/upstash.ts
| 352-431 | deleteUpstash() -  
 vector cleanup | 🟡  
 Medium |

---

● Summary

Your biggest performance
bottlenecks are:

1. PDF/URL uploads - Users wait  
    up to 45 seconds while
   embeddings generate
2. Quiz creation - Blocks while  
   generating questions via LLM
3. OpenAI embedding calls -
   Will become rate-limited under  
   load

Immediate actions to take:

- Implement background job
  system (I recommend Inngest for  
   Next.js or BullMQ for more  
  control)
- Move document processing off  
  the request path
- Add status polling so users  
  can see progress
- Re-enable your rate limiting  
  (currently commented out)

Would you like me to help
implement a background job
system for any of these
operations?

Yes, You'll Need Frontend
Changes - Here's the Complete  
 Picture

Current Flow (Blocking)

User clicks upload → Frontend  
 waits 45s → API returns →
Redirect to chat
⏳  
 User stares at spinner

New Flow (Background Jobs)

User clicks upload → API
returns immediately → Redirect  
 to chat → Poll for status →  
 Enable chat when ready
(uploadId

- status) Show
  "Processing..." Every 2-3s

---

Required Changes

BACKEND Changes

1. Add Status Field to Database

// Add to Upload model in
schema.prisma
model Upload {
// ... existing fields
status String
@default("processing") //
"processing" | "completed" |  
 "failed"
errorMessage String? // Store  
 error if failed
}

2. Modify API Responses

src/app/api/upsert/route.ts:37-  
 156 - Change to return
immediately:
// BEFORE: Wait for
vectorization (lines 105-127)  
 let topics = await
withTimeout(updateUpstash(...),  
 45000);

// AFTER: Return immediately,  
 process in background
return NextResponse.json({
uploadId,
status: 'processing'
}, { status: 202 }); // 202 =  
 Accepted

// Queue background job here

src/app/api/scraper/route.ts:55  
 -175 - Same change

3. Create Status Endpoint (NEW)

// src/app/api/upload/[id]/stat  
 us/route.ts
export async function
GET(request, { params }) {
const upload = await
db.upload.findUnique({
where: { id: params.id },  
 select: { status: true,  
 errorMessage: true }
});
return
NextResponse.json(upload);
}

---

FRONTEND Changes

1. Update UploadForm.tsx
   (src/components/UploadForm.tsx)

Lines 73-92 - Handle immediate  
 response:
// CURRENT CODE:
const response = await
fetch("/api/upsert", {
method: "POST",
body: formData,
});
const data = await
response.json();
toast({ description: "PDF
uploaded successfully!" });  
 router.push(`/chat/${data.messa    
  ge}`);

// NEW CODE:
const response = await
fetch("/api/upsert", {
method: "POST",
body: formData,
});
const data = await
response.json();

// API now returns 202 Accepted  
 immediately
if (response.status === 202) {  
 toast({
description: "Upload
started! Processing in
background..."
});
// Redirect immediately, chat  
 page will poll for status
router.push(`/chat/${data.upl    
  oadId}`);
}

Lines 162-189 - Same change for  
 URL scraping:
// Change data.message to
data.uploadId
router.push(`/chat/${data.uploa    
  dId}`);

2. Update UpsertLink.tsx
   (src/components/Chat/UpsertLink  
   .tsx:42-68)

Same changes as above - expect  
 uploadId instead of message,  
 handle 202 status.

3. Update ProcessContext.tsx  
   (src/components/ProcessContext.  
   tsx:68-97)

Same changes.

4. Create Status Polling Hook  
   (NEW FILE)

// src/hooks/useUploadStatus.ts  
 import { useEffect, useState }  
 from 'react';

export function
useUploadStatus(uploadId:
string) {
const [status, setStatus] =  
 useState<'processing' |
'completed' |
'failed'>('processing');
const [error, setError] =  
 useState<string | null>(null);

    useEffect(() => {
      if (!uploadId) return;

      const pollStatus = async ()

=> {
const response = await  
 fetch(`/api/upload/${uploadId}/    
  status`);
const data = await
response.json();

        setStatus(data.status);
        if (data.status ===

'failed') {

setError(data.errorMessage);  
 }
};

      // Poll every 3 seconds
      const interval =

setInterval(pollStatus, 3000);

      // Initial check
      pollStatus();

      return () =>

clearInterval(interval);
}, [uploadId]);

    return { status, error };

}

5. Update Chat Page (Likely  
   src/app/chat/[id]/page.tsx)

Add status check before
allowing chat:
const { status, error } =
useUploadStatus(uploadId);

if (status === 'processing') {  
 return <ProcessingIndicator      
  />;
}

if (status === 'failed') {
return <ErrorMessage
  error={error} />;
}

// Only render chat when status  
 === 'completed'
return <ChatInterface />;

---

Summary of Changes

| Component | File

      | Change
                        |

|-----------------|------------

---

| ----    | -------------------------- |
| ------- | -------------------------- |
| Backend |

      |
                        |

| Database Schema |
schema.prisma
| Add status and  
 errorMessage fields
|
| Upload API | src/app/api  
 /upsert/route.ts:73-92
| Return 202 immediately,  
 queue job |
| Scraper API | src/app/api  
 /scraper/route.ts:162-189
| Return 202 immediately,  
 queue job |
| Status Endpoint | src/app/api  
 /upload/[id]/status/route.ts  
 (NEW) | Create status polling  
 endpoint |
| Background Jobs | TBD

      | Implement queue

(BullMQ/Inngest)
|
| Frontend |

      |
                        |

| Upload Form | src/compone  
 nts/UploadForm.tsx:73-92,
162-189 | Expect immediate  
 response, redirect right away |  
 | Link Dialog | src/compone  
 nts/Chat/UpsertLink.tsx:42-68  
 | Same as above
|
| Process Context | src/compone  
 nts/ProcessContext.tsx:68-97  
 | Same as above
|
| Status Hook |
src/hooks/useUploadStatus.ts  
 (NEW) | Create
polling hook
|
| Chat Page | Likely
src/app/chat/[id]/page.tsx
| Add status check,  
 show processing UI |

---

User Experience Impact

Before (Current):

- User uploads PDF → waits 45  
  seconds → sees chat
- If timeout: complete failure

After (With Background Jobs):

- User uploads PDF → waits 1-2  
  seconds → sees chat with
  "Processing..." banner
- Can navigate away, come back  
  later
- Progress indication:
  "Processing your document...  
  This may take a few minutes"

---

Want me to implement this for  
 you? I can:

1. Create the database
   migration
2. Implement the status
   endpoint
3. Update all frontend
   components
4. Set up a basic background  
   job queue (I recommend Inngest  
   for Next.js)

Just let me know!
