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
import ClaimCommunityMilestones from "@/components/ClaimCommunityMilestones";

type Params = Promise<{ gameId: any }>;

const Statistics = async ({ params }: { params: Params }) => {
  const { gameId } = await params;
  const session: any = await auth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (!session?.user) return redirect("/");

  const sessionId = `${session.user.id}_session`;
  const namespace = `${session.user.id}_documents`;

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
  } /*else if (game.gameType === "open_ended") {
    const totalPercentage = game.questions.reduce(
      (acc, q) => acc + (q.percentageCorrect ?? 0),
      0
    );
    accuracy = totalPercentage / game.questions.length;
  }*/
  accuracy = Math.round(accuracy * 100) / 100;
  let isClaimable = false;
  let j = 5;
  console.log(upload);
  if (upload.private === true) {
    const topics = upload?.options as any[];
    for (let i = 0; i < topics?.length; i++) {
      if (game.topic == topics[i]) {
        j = i;
      }
    }
    const completed: boolean[] = JSON.parse(upload.isCompleted as string);
    if (
      j != topics?.length &&
      completed[j] == false &&
      upload.timeStarted >= weekAgo
    ) {
      console.log("true");
      isClaimable = true;
    }
  } else {
    const communityQuiz = await db.communityquiz.findFirst({
      where: { uploadId: upload.id, userId: session?.user.id },
    });
    console.log(communityQuiz);
    const topics = communityQuiz?.options as any[];
    for (let i = 0; i < topics?.length; i++) {
      if (game.topic == topics[i]) {
        j = i;
      }
    }
    const completed: boolean[] = JSON.parse(
      communityQuiz.isCompleted as string
    );
    if (
      j != topics?.length &&
      completed[j] == false &&
      communityQuiz.timeStarted >= weekAgo
    ) {
      console.log("true");
      isClaimable = true;
    }
  }

  return (
    <main className="flex flex-grow items-center p-20 justify-center  bg-black">
      <div className="flex flex-col  p-1 px-2 overflow-y-auto">
        <div className="flex flex-col flex-grow item-center justify-between">
          <div className="flex flex-row justify-between">
            <Link href={`/chat/${upload.id}`} className={buttonVariants()}>
              <LucideLayoutDashboard className="mr-2" />
              Chat
            </Link>
            <div>
              {isClaimable && upload.private && (
                <ClaimMilestones
                  id={upload.id}
                  ix={j}
                  sessionId={sessionId}
                  namespace={namespace}
                  upload={upload.id}
                />
              )}
              {isClaimable && !upload.private && (
                <ClaimCommunityMilestones
                  id={`${upload.id}_${session?.user.id}`}
                  ix={j}
                  sessionId={sessionId}
                  namespace={namespace}
                  upload={upload.id}
                />
              )}
            </div>
          </div>
          <ResultsCard accuracy={accuracy} />
          <div className="flex flex-row justify-between">
            <AccuracyCard accuracy={accuracy} />
            <TimeTakenCard
              timeEnded={new Date(game.timeEnded ?? 0)}
              timeStarted={new Date(game.timeStarted ?? 0)}
            />
          </div>
          <div className="flex-grow">
            <QuestionsList questions={game.questions} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Statistics;
