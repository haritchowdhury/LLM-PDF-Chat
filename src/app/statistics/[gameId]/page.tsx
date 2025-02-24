import db from "@/lib/db/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";
import ResultsCard from "@/components/statistics/ResultsCard";
import AccuracyCard from "@/components/statistics/AccuracyCard";
import TimeTakenCard from "@/components/statistics/TimeTakenCard";
import QuestionsList from "@/components/statistics/QuestionsList";
import { buttonVariants } from "@/components/ui/button";

import { LucideLayoutDashboard } from "lucide-react";
import Link from "next/link";
import ClaimMilestones from "@/components/ClaimMilestones";
type Params = Promise<{ gameId: any }>;

const Statistics = async ({ params }: { params: Params }) => {
  const { gameId } = await params;
  const session: any = await auth();

  if (!session?.user) return redirect("/");

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { questions: true },
  });
  if (!game) return redirect("/");
  const upload = await db.upload.findUnique({
    where: { id: game.uploadId },
  });
  if (!game) return redirect("/");
  let accuracy = 0;

  if (game.gameType === "mcq") {
    const totalCorrect = game.questions.filter((q) => q.isCorrect).length;
    accuracy = (totalCorrect / game.questions.length) * 100;
  } else if (game.gameType === "open_ended") {
    const totalPercentage = game.questions.reduce(
      (acc, q) => acc + (q.percentageCorrect ?? 0),
      0
    );
    accuracy = totalPercentage / game.questions.length;
  }
  accuracy = Math.round(accuracy * 100) / 100;
  let isClaimable = false;
  const topics = upload?.options as any[];
  let j = topics.length;
  for (let i = 0; i < topics.length; i++) {
    if (game.topic == topics[i]) {
      j = i;
    }
  }
  const completed: boolean[] = JSON.parse(upload.isCompleted as string);
  if (j != topics.length && completed[j] == false) {
    console.log("true");
    isClaimable = true;
  }

  return (
    <main className="flex relative items-center overflow-y-auto justify-center max-h-[900px] bg-black">
      <div className="flex flex-col h-screen  p-1 mb-4 px-2">
        <div className="flex items-center justify-between mb-1">
          <h6 className="text-lg font-bold tracking-tight text-white">
            Summary
          </h6>
        </div>

        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="grid gap-3  md:grid-cols-7 flex-grow justify-center items-stretch overflow-auto">
            <ResultsCard accuracy={accuracy} />
            <AccuracyCard accuracy={accuracy} />
            <TimeTakenCard
              timeEnded={new Date(game.timeEnded ?? 0)}
              timeStarted={new Date(game.timeStarted ?? 0)}
            />
          </div>

          <div className="flex-grow">
            <QuestionsList questions={game.questions} />
          </div>
          <div className="flex flex-row justify-between">
            <Link href="/" className={buttonVariants()}>
              <LucideLayoutDashboard className="mr-2" />
              Home
            </Link>
            <div>
              {isClaimable && <ClaimMilestones id={upload.id} ix={j} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Statistics;
