import db from "@/lib/db/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
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

    // Update the user's name in the database
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        name: newUsername.trim(),
      },
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
