// app/api/uploads/[id]/name/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db/db";
import { z } from "zod";

// Validation schema for the request body
const updateNameSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: uploadId } = await params;
    if (!uploadId) {
      return NextResponse.json(
        { error: "Upload ID is required" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateNameSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Check if upload exists and user owns it
    const existingUpload = await db.upload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        userId: true,
        name: true,
      },
    });

    if (session.user.id !== existingUpload.userId) {
      return NextResponse.json(
        { error: "Restricted to Uploader only" },
        { status: 401 }
      );
    }

    if (!existingUpload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (existingUpload.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own uploads" },
        { status: 403 }
      );
    }

    // Update the upload name
    const updatedUpload = await db.upload.update({
      where: { id: uploadId },
      data: { name },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    return NextResponse.json(updatedUpload, { status: 200 });
  } catch (error) {
    console.error("Error updating upload name:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
