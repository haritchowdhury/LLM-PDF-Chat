import db from "@/lib/db/db";
import { checkAnswerSchema } from "@/schemas/questions";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
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
