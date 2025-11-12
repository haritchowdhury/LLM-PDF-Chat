import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db/db";

// POST: Toggle like (like/unlike)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Check if upload exists and is public
    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      select: { id: true, private: true, likedBy: true },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (upload.private) {
      return NextResponse.json(
        { error: "Cannot like private uploads" },
        { status: 403 }
      );
    }

    // Toggle like
    const hasLiked = upload.likedBy.includes(session.user.id);
    /*  const updatedLikedBy = hasLiked
      ? upload.likedBy.filter((id) => id !== session.user.id)
      : [...upload.likedBy, session.user.id]; */

    const updatedUpload = await db.upload.update({
      where: { id: uploadId },
      data: {
        likedBy: hasLiked
          ? { set: upload.likedBy.filter((id) => id !== session.user.id) }
          : { push: session.user.id },
      },
      select: {
        id: true,
        likedBy: true,
      },
    });

    /*  const updatedUpload = await db.upload.update({
      where: { id: uploadId },
      data: { likedBy: updatedLikedBy },
      select: {
        id: true,
        likedBy: true,
      },
    }); */

    return NextResponse.json({
      liked: !hasLiked,
      likeCount: updatedUpload.likedBy.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check if user has liked and get like count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id: uploadId } = await params;

    const upload = await db.upload.findUnique({
      where: { id: uploadId },
      select: { likedBy: true },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const liked = session?.user?.id
      ? upload.likedBy.includes(session.user.id)
      : false;

    return NextResponse.json({
      liked,
      likeCount: upload.likedBy.length,
    });
  } catch (error) {
    console.error("Error fetching like status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
