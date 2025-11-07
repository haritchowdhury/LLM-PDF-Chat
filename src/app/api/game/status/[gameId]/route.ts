/**
 * Game Status API Endpoint
 *
 * Returns the processing status of a game, including question generation progress.
 * Used by the frontend to poll for game readiness.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db/db";
import { ProcessingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    gameId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Get authenticated session
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { gameId } = await context.params;

    // Fetch game with question count
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        userId: true,
        processingStatus: true,
        errorMessage: true,
        processingStartedAt: true,
        processingCompletedAt: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Check if user owns this game
    if (game.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Return game status
    return NextResponse.json({
      gameId: game.id,
      status: game.processingStatus.toLowerCase(),
      questionCount: game._count.questions,
      errorMessage: game.errorMessage,
      processingStartedAt: game.processingStartedAt,
      processingCompletedAt: game.processingCompletedAt,
    });
  } catch (error) {
    console.error("[Game Status] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
