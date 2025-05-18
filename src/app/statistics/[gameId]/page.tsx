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
import ClaimMilestones from "@/components/Quiz/ClaimMilestones";
import ClaimCommunityMilestones from "@/components/Quiz/ClaimCommunityMilestones";
import { ArrowLeft } from "lucide-react";

type Params = Promise<{ gameId: any }>;

const Statistics = async ({ params }: { params: Params }) => {
  const { gameId } = await params;
  const session: any = await auth();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (!session?.user) return redirect("/");

  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { questions: true },
  });
  if (!game) return redirect("/");
  const upload = await db.upload.findUnique({
    where: { id: game.uploadId },
  });
  console.log(upload.id, "upload id");
  if (!game) return redirect("/");
  if (!upload) return redirect("/");

  let accuracy = 0;

  if (game.gameType === "mcq") {
    const totalCorrect = game.questions.filter((q) => q.isCorrect).length;
    accuracy = (totalCorrect / game.questions.length) * 100;
  }
  accuracy = Math.round(accuracy * 100) / 100;
  let isClaimable = false;

  console.log(game.topic, upload.options);

  let quizId: string;

  if (upload.private === true) {
    const completed: string[] = JSON.parse(upload.isCompleted as string) || [];

    if (!completed.includes(game?.topic)) {
      console.log(" claimable true");
      isClaimable = true;
    }
  } else {
    const communityQuiz = await db.communityquiz.findFirst({
      where: { uploadId: upload.id, userId: session?.user.id },
    });
    quizId = communityQuiz.id;

    const completed: string[] =
      JSON.parse(communityQuiz.isCompleted as string) || [];
    if (!completed.includes(game?.topic)) {
      console.log("true");
      isClaimable = true;
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8 lg:p-12">
      <div className="max-w-5xl mx-auto pt-16">
        <div className="mb-8 flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <Link
              href={`/chat/${upload.id}`}
              className={buttonVariants({
                variant: "outline",
                className:
                  "bg-gray-900 border-gray-700  hover:border-gray-600 text-white",
              })}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chat
            </Link>

            {isClaimable && (
              <div className="animate-pulse">
                {upload.private ? (
                  <ClaimMilestones id={upload.id} topic={game.topic} />
                ) : (
                  <ClaimCommunityMilestones
                    id={quizId}
                    topic={game.topic}
                    upload={upload.id}
                  />
                )}
              </div>
            )}
          </div>

          <ResultsCard accuracy={accuracy} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AccuracyCard accuracy={accuracy} />
            <TimeTakenCard
              timeEnded={new Date(game.timeEnded ?? 0)}
              timeStarted={new Date(game.timeStarted ?? 0)}
            />
          </div>

          <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            <h2 className="px-4 py-3 text-lg font-semibold border-b border-gray-800">
              Questions Review
            </h2>
            <div className="p-2">
              <QuestionsList questions={game.questions} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Statistics;
