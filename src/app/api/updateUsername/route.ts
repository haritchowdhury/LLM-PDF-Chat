import db from "@/lib/db/db";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { userId, newUsername } = body;

    if (!userId || !newUsername || newUsername.trim() === "") {
      return NextResponse.json(
        { error: "User ID and non-empty username are required" },
        {
          status: 400,
        }
      );
    }
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 50) {
      return NextResponse.json(
        { error: "Username must be between 2 and 50 characters" },
        { status: 400 }
      );
    }

    // Prevent special characters abuse
    if (!/^[a-zA-Z0-9_\s-]+$/.test(trimmedUsername)) {
      return NextResponse.json(
        {
          error:
            "Username can only contain letters, numbers, spaces, hyphens, and underscores",
        },
        { status: 400 }
      );
    }

    // Update the user's name in the database
    const updatedUser = await db.user.update({
      where: { id: session.user.id }, // Use session ID
      data: { name: trimmedUsername },
    });

    return NextResponse.json(
      { error: "User name updated" },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating username:", error);

    // Check for Prisma-specific errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User not found" },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
      }
    );
  } finally {
    // Close the Prisma connection
    await db.$disconnect();
  }
}
