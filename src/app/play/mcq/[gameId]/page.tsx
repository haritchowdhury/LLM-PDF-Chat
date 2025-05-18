import { auth } from "@/lib/auth";
import db from "@/lib/db/db";
import MCQ from "@/components/Quiz/MCQ";
import { redirect } from "next/navigation";
import * as React from "react";

type Params = Promise<{ gameId: any }>;

export default async function MCQPage({ params }: { params: Params }) {
  const session: any = await auth();
  if (!session?.user) {
    return redirect("/");
  }
  const { gameId } = await params;
  const upload = await db.upload.findUnique({
    where: { id: gameId },
  });

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
    return redirect(`/chat/${upload.id}`);
  }
  return (
    <main className="flex relative items-center justify-center min-h-screen bg-black">
      <MCQ key={game.id} game={game} />{" "}
    </main>
  );
}
