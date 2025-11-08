import { auth } from "@/lib/auth";
import db from "@/lib/db/db";
import MCQ from "@/components/Quiz/MCQ";
import GameStatusWrapper from "@/components/Quiz/GameStatusWrapper";
import { redirect } from "next/navigation";
import * as React from "react";

type Params = Promise<{ gameId: any }>;

export default async function MCQPage({ params }: { params: Params }) {
  const session: any = await auth();
  if (!session?.user) {
    return redirect("/");
  }
  const { gameId } = await params;

  const game = await db.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
        },
      },
    },
  });

  if (!game) {
    return redirect("/");
  }

  // Wrap the game component with GameStatusWrapper to handle async question generation
  return (
    <GameStatusWrapper
      gameId={game.id}
      uploadId={game.uploadId}
      hasQuestions={game.questions.length > 0}
    >
      <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <MCQ key={game.id} game={game} />
      </main>
    </GameStatusWrapper>
  );
}
