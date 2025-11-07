# Upload Processing Changes - QStash Background Jobs Implementation

## Overview
Implemented asynchronous background job processing using QStash from Upstash to handle PDF uploads and URL scraping. This eliminates the 45+ second blocking operations that previously froze the UI during uploads.

## Architecture
- **New uploads**: Return 202 Accepted immediately and process in background
- **Adding to existing uploads**: Keep upload COMPLETED and accessible while processing new content
- **Status polling**: Frontend polls every 3 seconds to check processing status
- **Dev mode support**: Directly calls worker endpoint without QStash in development

## Files Created

### Backend Infrastructure
1. **`src/lib/blob-storage.ts`** - Redis-based temporary PDF storage (1-hour TTL)
   - `uploadPdfToBlob()` - Store PDF in Redis
   - `getPdfFromBlob()` - Retrieve PDF buffer
   - `deleteBlobFile()` - Cleanup after processing

2. **`src/lib/qstash.ts`** - QStash client with dev mode support
   - `publishPdfJob()` - Queue PDF processing job
   - `publishUrlScraperJob()` - Queue URL scraping job
   - Dev mode: Calls worker directly with `x-dev-mode: true` header

3. **`src/lib/qstash-verify.ts`** - QStash signature verification
   - `verifyQStashSignature()` - Validate request authenticity
   - `verifyOrReturnError()` - Helper for route handlers
   - Skipped in development mode

4. **`src/app/api/worker/process-upload/route.ts`** - Unified background worker (300s timeout)
   - Handles both PDF and URL processing jobs
   - Updates status: PENDING → PROCESSING → COMPLETED/FAILED
   - Merges new topics with existing ones
   - Cleans up blob storage after processing

5. **`src/app/api/upload/status/[id]/route.ts`** - Status polling endpoint
   - Returns processing status, error messages, vector count
   - Respects private upload permissions

### Frontend Components
6. **`src/hooks/useUploadStatus.ts`** - React hook for status polling
   - Polls every 3 seconds until COMPLETED or FAILED
   - Skips polling when `uploadId === "undefined"`
   - Exports helpers: `isProcessing()`, `isCompleted()`, `isFailed()`

7. **`src/components/Chat/ChatWrapper.tsx`** - Status-aware chat wrapper
   - Shows processing indicator while upload is being processed
   - Displays error messages if processing fails
   - Renders chat when COMPLETED

## Files Modified

### Backend APIs
8. **`src/app/api/upsert/route.ts`** - PDF upload endpoint
   - **New uploads**: Create with PENDING status, queue job, return 202
   - **Adding to existing**: Keep COMPLETED status, just queue job
   - Upload to blob storage instead of processing inline
   - Fixed error cleanup to use `isNewUpload` flag

9. **`src/app/api/scraper/route.ts`** - URL scraping endpoint
   - Same async pattern as PDF uploads
   - **New uploads**: Create with PENDING status
   - **Adding to existing**: Keep COMPLETED status
   - Queue background job, return 202

10. **`src/lib/cheerio.ts`** - Web scraper
    - Added browser-like headers to bypass 403 errors
    - 30-second timeout with 5 redirects
    - Better error messages (403, 404, DNS, timeout)

### Frontend Updates
11. **`src/components/Chat/Chat.tsx`** - PDF upload from chat
    - Handle 202 responses
    - Navigate to new upload page if new
    - Refresh current page if adding to existing

12. **`src/components/Chat/UpsertLink.tsx`** - URL scraping from chat
    - Same 202 handling as PDF uploads
    - Navigate if new, refresh if adding to existing

13. **`src/components/UploadForm.tsx`** - Main upload form
    - Already had 202 handling, confirmed working

14. **`src/components/ProcessContext.tsx`** - Deferred processing
    - Already had 202 handling, confirmed working

15. **`src/app/chat/[uploadId]/page.tsx`** - Chat page
    - Fixed null check order (check before accessing properties)
    - Now uses ChatWrapper to handle processing states

### Database Schema
16. **`src/lib/db/schema.prisma`** - Database changes (migration already run)
    ```prisma
    enum ProcessingStatus {
      PENDING
      PROCESSING
      COMPLETED
      FAILED
    }

    model Upload {
      processingStatus       ProcessingStatus @default(PENDING)
      errorMessage           String?
      vectorCount            Int?
      blobStorageKey         String?
      processingStartedAt    DateTime?
      processingCompletedAt  DateTime?

      @@index([processingStatus])
    }
    ```

## Key Bug Fixes

### 1. Null Upload Error (Main Issue)
- **Problem**: Accessing `lastUpload.private` before null check
- **Fix**: Moved null check before property access in `page.tsx:38`

### 2. Existing Upload Status Reset
- **Problem**: Adding documents to existing uploads set status back to PENDING
- **Fix**: Only new uploads get PENDING status, existing uploads stay COMPLETED

### 3. Status Polling 404 Error
- **Problem**: Hook tried to fetch status for `uploadId === "undefined"`
- **Fix**: Skip polling when uploadId is null or "undefined"

### 4. Buffer Type Mismatch
- **Problem**: TypeScript error - Buffer not assignable to BlobPart
- **Fix**: Wrap Buffer in `new Uint8Array(pdfBuffer)` when creating Blob

### 5. Topics Not Created
- **Problem**: Topics stored as array instead of JSON string, not merging
- **Fix**: Fetch existing topics, merge, deduplicate, store as `JSON.stringify()`

### 6. Web Scraping 403 Errors
- **Problem**: Websites blocking automated requests
- **Fix**: Added realistic browser headers and timeout configuration

## Workflow

### New Upload (PDF or URL)
1. User uploads → API creates Upload record with PENDING status
2. PDF saved to Redis blob storage (or URL stored in job payload)
3. Job published to QStash (or worker called directly in dev)
4. Return 202 with uploadId
5. Frontend navigates to chat page showing "Processing..." state
6. Worker processes in background, updates status to PROCESSING → COMPLETED
7. Frontend polls status, shows chat when COMPLETED

### Adding to Existing Upload
1. User adds PDF/URL to existing chat → API keeps Upload as COMPLETED
2. Content saved/queued for processing
3. Return 202 with uploadId
4. Frontend refreshes current page
5. Worker processes in background, merges topics with existing
6. Chat remains usable during processing

## Environment Variables Required
```env
# QStash (already configured)
QSTASH_URL=
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# Worker endpoint
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or production URL
```

## Dev Mode vs Production
- **Development**: `NODE_ENV=development` calls worker directly, skips signature verification
- **Production**: Uses QStash queue, verifies signatures, automatic retries on failure

## Testing Checklist
- [x] Upload new PDF → shows processing → completes
- [x] Upload new URL → shows processing → completes
- [x] Add PDF to existing upload → stays usable, refreshes when done
- [x] Add URL to existing upload → stays usable, refreshes when done
- [x] Topics merge correctly when adding to existing upload
- [x] No 404 errors on undefined uploadId
- [x] No null reference errors on chat page
- [x] Status polling stops when completed/failed
- [x] Error messages displayed correctly on failure
