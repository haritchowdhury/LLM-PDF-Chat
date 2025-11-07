**_🔴 CRITICAL - Operations Currently Blocking Users (Must Move to Background)_**

1. PDF Upload Processing (src/a
   pp/api/upsert/route.ts:37-156)

Current Wait Time: Up to 45  
 seconds (with timeout)

Blocking Operations:

- PDF loading and parsing (line 60)
- Text splitting into 2000-char chunks (src/lib/upstash.ts:44-49)
- OpenAI embedding generation (src/lib/upstash.ts:58-60) - Most expensive operation
- Batch vector upserts to (500 vectors/batch) (src/lib/upstash.ts:85-89)
- LLM topic extraction - Multiple calls for large documents (src/lib/upstashts:109-116)

Why it's slow: For a 50-page PDF, you're generating embeddings for hundreds of
chunks and making multiple LLM calls. User waits the entire time.

Recommendation: Return upload ID immediately, process vectorization in background job, add status polling endpoint.

---

2. Web Scraper Processing
   (src/app/api/scraper/route.ts:5  
   5-175)

Current Wait Time: Up to 45 seconds (with timeout)

Blocking Operations:

- Web scraping with Cheerio (line 103-106)
- Text chunking into 7000-char segments (line 109)
- OpenAI embedding generation for all chunks (src/lib/upstash.ts:283-285)
- Vector upserts in batches (src/lib/upstash.ts:310-313)
- LLM topic generation (src/lib/upstash.ts:333-342)

Why it's slow: Same as PDF - embeddings + LLM calls. Plus web scraping can be
unpredictable.

Recommendation: Background job with status updates.

**_CHANGES IN FRONTEND_**

Current Flow (Blocking)

User clicks upload → Frontend waits 45s → API returns →
Redirect to chat
⏳  
 User stares at spinner

New Flow (Background Jobs)

User clicks upload → API
returns immediately → Redirect  
 to chat → Poll for status →  
 Enable chat when ready or user looks at the spinner like before (uploadId

- status) Show "Processing..." Every 2-3s | or do not change anything visualy.

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
   src/app/chat/[id]/page.tsx renders src\components\Chat\Chat.tsx)

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

Possible Suspects: src\components\Chat\Chat.tsx PDFs are uploaded from this compoent as well.

---

Summary of Changes

| Component | File

| Database Schema | schema.prisma
| Add status and errorMessage fields
| Upload API | src/app/api/upsert/route.ts:73-92
| Return 202 immediately, queue job |
| Scraper API | src/app/api/scraper/route.ts:162-189
| Return 202 immediately, queue job |
| Status Endpoint | src/app/api/upload/[id]/status/route.ts (NEW)
| Create status polling endpoint |
| Background Jobs | TBD

| Upload Form | src/components/UploadForm.tsx:73-92, 162-189
| Expect immediate response, redirect right away  
| Link Dialog | src/components/Chat/UpsertLink.tsx:42-68  
| Same as above
| Process Context | src/components/ProcessContext.tsx:68-97  
| Same as above
| Status Hook | src/hooks/useUploadStatus.ts (NEW) | Create polling hook
| Chat Page | Likely src/app/chat/[id]/page.tsx
| Add status check, show processing UI |

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

To Implement this

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

---

Background JObs: I want to use upstash qstash for background job server
