import db from "@/lib/db/db";
import { endGameSchema } from "@/schemas/questions";
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { gameId } = endGameSchema.parse(body);

    const game = await db.game.findUnique({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      return NextResponse.json(
        {
          message: "Game not found",
        },
        {
          status: 404,
        }
      );
    }

    if (game.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You can only end your own games" },
        { status: 403 }
      );
    }

    await db.game.update({
      where: {
        id: gameId,
      },
      data: {
        timeEnded: new Date(),
      },
    });

    return NextResponse.json({
      message: "Game Ended",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Something Went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
