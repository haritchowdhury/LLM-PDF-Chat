import db from "@/lib/db/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questionId, userInput } = checkAnswerSchema.parse(body);
    const question = await db.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json(
        {
          message: "Question not found!",
        },
        {
          status: 404,
        }
      );
    }
    const game = await db.game.findFirst({ where: { id: question.gameId } });

    if (question.gameId !== game.userId) {
      return NextResponse.json(
        { error: "Forbidden: You can only answer your own questions" },
        { status: 403 }
      );
    }

    await db.question.update({
      where: { id: questionId },
      data: { userAnswer: userInput },
    });

    if (question.questionType === "mcq") {
      const isCorrect =
        question.answer.toLowerCase().trim() === userInput.toLowerCase().trim();
      await db.question.update({
        where: { id: questionId },
        data: { isCorrect },
      });
      return NextResponse.json({ isCorrect });
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "There was a problem resolving Zod request",
        },
        {
          status: 400,
        }
      );
    }
  }
}
