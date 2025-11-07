/**
 * QStash Worker Endpoint for Game/Question Generation
 *
 * Handles background processing of quiz question generation.
 * Called by QStash (or directly in development mode) to generate questions asynchronously.
 */

import { NextResponse } from "next/server";
import { Index } from "@upstash/vector";
import { verifyOrReturnError } from "@/lib/qstash-verify";
import { GameJobPayload } from "@/lib/qstash";
import { queryUpstash } from "@/lib/upstash";
import { strict_output } from "@/lib/groqQuestionSetter";
import db from "@/lib/db/db";
import { ProcessingStatus } from "@prisma/client";

// Initialize Upstash Vector index
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Increase timeout for long-running processing
export const maxDuration = 60; // 60 seconds

/**
 * POST handler - Process game question generation jobs
 */
export async function POST(request: Request) {
  let gameId: string | undefined;

  try {
    // 1. Read the raw body for signature verification
    const body = await request.text();

    // 2. Verify QStash signature (skipped in dev mode)
    const errorResponse = await verifyOrReturnError(request, body);
    if (errorResponse) {
      return errorResponse;
    }

    // 3. Parse the job payload
    const payload: GameJobPayload = JSON.parse(body);
    gameId = payload.gameId;
    const { uploadId, topic, amount, userId } = payload;

    console.log(
      `[Worker] Processing game ${gameId}: generating ${amount} questions on topic "${topic}"`
    );

    // 4. Update status to PROCESSING
    await db.game.update({
      where: { id: gameId },
      data: {
        processingStatus: ProcessingStatus.PROCESSING,
        processingStartedAt: new Date(),
      },
    });

    // 5. Generate questions
    const questions = await processGameQuestions(
      uploadId,
      topic,
      amount,
      userId,
      gameId,
      index
    );

    // 6. Update status to COMPLETED
    await db.game.update({
      where: { id: gameId },
      data: {
        processingStatus: ProcessingStatus.COMPLETED,
        processingCompletedAt: new Date(),
      },
    });

    console.log(
      `[Worker] Successfully processed game ${gameId}, generated ${questions.length} questions`
    );

    return NextResponse.json({
      success: true,
      gameId,
      questionCount: questions.length,
    });
  } catch (error) {
    console.error("[Worker] Error processing game:", error);

    // Update status to FAILED if we have a gameId
    if (gameId) {
      try {
        await db.game.update({
          where: { id: gameId },
          data: {
            processingStatus: ProcessingStatus.FAILED,
            processingCompletedAt: new Date(),
            errorMessage:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
        });
      } catch (dbError) {
        console.error("[Worker] Failed to update error status:", dbError);
      }
    }

    // Return 500 so QStash will retry (only in production)
    // In dev mode, we want to see the error immediately
    const isDevMode = request.headers.get("x-dev-mode") === "true";
    if (isDevMode) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Processing failed",
        },
        { status: 500 }
      );
    }

    // In production, return 500 for QStash to retry
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

/**
 * Process game question generation
 */
async function processGameQuestions(
  uploadId: string,
  topic: string,
  amount: number,
  userId: string,
  gameId: string,
  index: Index
): Promise<any[]> {
  console.log(`[Worker] Querying vector database for context...`);

  // 1. Get document and query vector database for context
  const document = await db.upload.findFirst({ where: { id: uploadId } });
  if (!document) {
    throw new Error(`Upload ${uploadId} not found`);
  }

  console.log(`[Worker] Document found:`, {
    uploadId,
    documentPrivate: document.private,
    documentUserId: document.userId,
    currentUserId: userId,
    topic,
  });

  console.log("input for data", uploadId, userId);

  const questionData = await queryUpstash(
    index,
    uploadId,
    topic,
    userId,
    document.private,
    document.userId
  );

  console.log(
    `[Worker] Query returned ${questionData.length} characters of context`
  );
  if (!questionData || questionData.length === 0) {
    throw new Error(
      `No relevant context found for topic "${topic}" in upload ${uploadId}. The document may not contain information about this topic.`
    );
  }

  console.log(`[Worker] Retrieved context, generating questions via LLM...`);

  // 2. Generate questions via LLM
  let questions: any = await strict_output(
    `You are a helpful AI that is able to generate mcq questions
    and answers, the length of each answer should not be more than
    15 words.

    IMPORTANT: You MUST generate EXACTLY ${amount} questions and return them as a JSON array with ${amount} elements.

    The structure MUST be an array with exactly ${amount} objects like this:
    [
      {
       "question": "string",
       "answer": "string",
       "option1": "string",
       "option2": "string",
       "option3": "string",
       "option4": "string"
      },
      ... (repeat for all ${amount} questions)
    ]`,
    `You are to generate ${amount} different random hard mcq questions about ${topic}.
    Each question should be strictly relevant to the topic and the answer should be clear, there should not be any ambiguity among the options for the question.
    Make sure each question is unique and covers different aspects of the topic.`,
    questionData
  );

  // 3. Ensure questions is always an array
  if (!Array.isArray(questions)) {
    if (questions && typeof questions === "object") {
      questions = [questions];
    } else {
      questions = [];
    }
  }

  if (questions.length === 0) {
    throw new Error("No questions generated");
  }

  console.log(
    `[Worker] Generated ${questions.length} questions, saving to database...`
  );

  // 4. Process and save questions to database
  type mcqQuestion = {
    question: string;
    answer: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
  };

  const manyData = questions.map((question: mcqQuestion) => {
    const options = [
      question.option1,
      question.option2,
      question.option3,
      question.option4,
    ].sort(() => Math.random() - 0.5);
    return {
      question: question.question,
      answer: question.answer,
      options: JSON.stringify(options),
      gameId: gameId,
      questionType: "mcq" as const,
    };
  });

  await db.question.createMany({
    data: manyData,
  });

  return questions;
}
