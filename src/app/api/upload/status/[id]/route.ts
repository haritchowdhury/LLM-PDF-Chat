/**
 * Upload Status Endpoint
 *
 * Provides real-time status updates for uploads being processed in the background.
 * Frontend polls this endpoint to check when processing is complete.
 */

import { NextResponse } from "next/server";
import db from "@/lib/db/db";
import { auth } from "@/lib/auth";

/**
 * GET /api/upload/status/[id]
 *
 * Returns the processing status of an upload
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await auth();
    const userId = session ? String(session.user.id) : null;

    // Allow unauthenticated requests for public uploads
    // But if authenticated, verify ownership
    const { id } = await params;
    const uploadId = id;

    // Fetch upload status
    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        processingStatus: true,
        errorMessage: true,
        vectorCount: true,
        processingStartedAt: true,
        processingCompletedAt: true,
        private: true,
        userId: true,
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Check access permissions
    // Private uploads can only be accessed by the owner
    if (upload.private && upload.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return status information
    return NextResponse.json({
      id: upload.id,
      status: upload.processingStatus,
      errorMessage: upload.errorMessage,
      vectorCount: upload.vectorCount,
      processingStartedAt: upload.processingStartedAt,
      processingCompletedAt: upload.processingCompletedAt,
    });
  } catch (error) {
    console.error("[Status API] Error fetching upload status:", error);
    return NextResponse.json(
      { error: "Failed to fetch upload status" },
      { status: 500 }
    );
  }
}
