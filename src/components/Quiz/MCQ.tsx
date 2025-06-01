"use client";
import { Game, Question } from "@prisma/client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { differenceInSeconds } from "date-fns";
import Link from "next/link";
import { BarChart, ChevronRight, Loader2, Timer } from "lucide-react";
import { checkAnswerSchema, endGameSchema } from "@/schemas/questions";
import { cn, formatTimeDelta } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { z } from "zod";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import MCQCounter from "@/components/Quiz/MCQCounter";

type Props = {
  game: Game & { questions: Pick<Question, "id" | "options" | "question">[] };
};

const MCQ = ({ game }: Props) => {
  const { toast } = useToast();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [stats, setStats] = useState({
    correct_answer: 0,
    wrong_answer: 0,
  });
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const currentQuestion = useMemo(
    () => game.questions[questionIndex],
    [questionIndex, game.questions]
  );

  const options = useMemo(() => {
    if (!currentQuestion?.options) return [];
    return JSON.parse(currentQuestion.options as string) as string[];
  }, [currentQuestion]);

  const { mutate: checkAnswer, status } = useMutation({
    mutationFn: async () => {
      if (selectedChoice === null) return;
      const payload: z.infer<typeof checkAnswerSchema> = {
        questionId: currentQuestion.id,
        userInput: options[selectedChoice],
      };
      const response = await axios.post(`/api/checkAnswer`, payload);
      return response.data;
    },
  });

  const { mutate: endGame } = useMutation({
    mutationFn: async () => {
      const payload: z.infer<typeof endGameSchema> = { gameId: game.id };
      await axios.post(`/api/endGame`, payload);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded]);

  const handleNext = useCallback(() => {
    if (selectedChoice === null) return;

    checkAnswer(undefined, {
      onSuccess: ({ isCorrect }) => {
        setStats((prevStats) => ({
          ...prevStats,
          correct_answer: isCorrect
            ? prevStats.correct_answer + 1
            : prevStats.correct_answer,
          wrong_answer: !isCorrect
            ? prevStats.wrong_answer + 1
            : prevStats.wrong_answer,
        }));

        toast({
          title: isCorrect ? "Correct" : "Incorrect",
          description: isCorrect ? "You got it right!" : "You got it wrong!",
          variant: isCorrect ? "default" : "destructive",
        });

        if (questionIndex >= game.questions.length - 1) {
          endGame();
          setHasEnded(true);
          return;
        }

        setSelectedChoice(null);
        setQuestionIndex((prev) => prev + 1);
      },
    });
  }, [
    checkAnswer,
    questionIndex,
    game.questions.length,
    toast,
    endGame,
    selectedChoice,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      if (["1", "2", "3", "4"].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (index >= 0 && index < options.length) {
          setSelectedChoice(index);
        }
      } else if (key === "Enter") {
        handleNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNext, options.length]);

  if (hasEnded) {
    return (
      <div className="absolute flex flex-col justify-center -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
        <div className="px-4 py-2 mt-2 font-semibold text-white bg-green-500 rounded-md whitespace-nowrap">
          You Completed in{" "}
          {formatTimeDelta(differenceInSeconds(now!, game.timeStarted))}
        </div>
        <Link
          href={`/statistics/${game.id}`}
          className={cn(buttonVariants({ size: "lg" }), "mt-2")}
        >
          View Statistics <BarChart className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2 md:w-[80vw] max-w-4xl w-[90vw] h-[calc(100vh-0rem)] top-1/2 left-1/2 pt-20">
      <div className="flex flex-row justify-between">
        <div className="flex flex-col">
          <p>
            <span className="text-slate-400">Topic</span> &nbsp;
            <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
              {game.topic}
            </span>
          </p>
          <div className="flex self-start mt-3 text-slate-400">
            <Timer className="mr-2" />
            {formatTimeDelta(differenceInSeconds(now!, game.timeStarted))}
          </div>
        </div>
        <MCQCounter
          correct_answers={stats.correct_answer}
          wrong_answers={stats.wrong_answer}
        />
      </div>
      <Card className="w-full mt-4 bg-gray-200 border-none">
        <CardHeader className="flex flex-row items-center">
          <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
            <div>{questionIndex + 1}</div>
            <div className="text-base text-slate-800">
              {game.questions.length}
            </div>
          </CardTitle>
          <CardDescription className="flex-grow text-lg">
            {currentQuestion?.question}
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="flex flex-col items-center justify-center w-full mt-4">
        {options.map((option, index) => (
          <Button
            key={index}
            variant={selectedChoice === index ? "default" : "outline"}
            className="justify-start w-full py-8 mb-4"
            onClick={() => setSelectedChoice(index)}
          >
            <div className="flex items-center justify-start">
              <div className="p-2 px-3 mr-5 bg-gray-800 text-white border rounded-md">
                {index + 1}
              </div>
              <div className="text-start">{option}</div>
            </div>
          </Button>
        ))}
        <Button
          variant="default"
          className="mt-2"
          size="lg"
          onClick={handleNext}
          disabled={status === "pending"}
        >
          {status === "pending" && (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          )}
          Next <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MCQ;
