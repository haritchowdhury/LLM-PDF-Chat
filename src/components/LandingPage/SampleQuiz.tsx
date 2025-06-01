/*const SampleQuiz = () => {
  const sampleQuestions = [
    {
      question: "What is the main function of photosynthesis in plants?",
      options: [
        "To produce oxygen for animals",
        "To convert sunlight into chemical energy",
        "To absorb water from soil",
        "To release carbon dioxide",
      ],
      correct: 1,
    },
    {
      question: "Which part of the plant cell contains chlorophyll?",
      options: ["Nucleus", "Mitochondria", "Chloroplasts", "Cell wall"],
      correct: 2,
    },
    {
      question: "What gas do plants absorb during photosynthesis?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      correct: 2,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          See QuizCraft in Action
        </h3>
        <p className="text-lg text-gray-600">
          Here's a sample quiz generated from a biology textbook chapter
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900">
            Biology Quiz: Photosynthesis
          </h4>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            3 Questions
          </span>
        </div>

        <div className="space-y-8">
          {sampleQuestions.map((q, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-6">
              <h5 className="font-semibold text-gray-900 mb-4">
                {index + 1}. {q.question}
              </h5>
              <div className="space-y-2">
                {q.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default SampleQuiz; */
"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { differenceInSeconds } from "date-fns";
import { BarChart, ChevronRight, Timer } from "lucide-react";
import { cn, formatTimeDelta } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import MCQCounter from "@/components/Quiz/MCQCounter";

interface SampleQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
}

const SampleQuiz = () => {
  const sampleQuestions: SampleQuestion[] = [
    {
      id: "1",
      question: "What is the main function of photosynthesis in plants?",
      options: [
        "To produce oxygen for animals",
        "To convert sunlight into chemical energy",
        "To absorb water from soil",
        "To release carbon dioxide",
      ],
      correct: 1,
    },
    {
      id: "2",
      question: "Which part of the plant cell contains chlorophyll?",
      options: ["Nucleus", "Mitochondria", "Chloroplasts", "Cell wall"],
      correct: 2,
    },
    {
      id: "3",
      question: "What gas do plants absorb during photosynthesis?",
      options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
      correct: 2,
    },
  ];

  const [questionIndex, setQuestionIndex] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [stats, setStats] = useState({
    correct_answer: 0,
    wrong_answer: 0,
  });
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [gameStartTime] = useState<Date>(new Date());
  const [showResult, setShowResult] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const currentQuestion = useMemo(
    () => sampleQuestions[questionIndex],
    [questionIndex, sampleQuestions]
  );

  useEffect(() => {
    setIsClient(true);
    setNow(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!hasEnded && isClient) {
        setNow(new Date());
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasEnded, isClient]);

  const handleNext = useCallback(() => {
    if (selectedChoice === null) return;

    const isCorrect = selectedChoice === currentQuestion.correct;

    setStats((prevStats) => ({
      ...prevStats,
      correct_answer: isCorrect
        ? prevStats.correct_answer + 1
        : prevStats.correct_answer,
      wrong_answer: !isCorrect
        ? prevStats.wrong_answer + 1
        : prevStats.wrong_answer,
    }));

    setShowResult(true);

    // Show result for 1.5 seconds before moving to next question
    setTimeout(() => {
      setShowResult(false);

      if (questionIndex >= sampleQuestions.length - 1) {
        setHasEnded(true);
        return;
      }

      setSelectedChoice(null);
      setQuestionIndex((prev) => prev + 1);
    }, 1500);
  }, [
    selectedChoice,
    currentQuestion.correct,
    questionIndex,
    sampleQuestions.length,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showResult) return; // Disable keyboard input when showing result

      const key = event.key;
      if (["1", "2", "3", "4"].includes(key)) {
        const index = parseInt(key, 10) - 1;
        if (index >= 0 && index < currentQuestion.options.length) {
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
  }, [handleNext, currentQuestion.options.length, showResult]);

  if (hasEnded) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Quiz Complete!
          </h3>
          <div className="inline-block px-6 py-4 mt-4 font-semibold text-white bg-green-500 rounded-md">
            You completed the demo in{" "}
            {isClient && now
              ? formatTimeDelta(differenceInSeconds(now, gameStartTime))
              : "0s"}
          </div>
          <div className="mt-6 space-y-2">
            <div className="text-lg">
              <span className="text-green-600 font-semibold">
                Correct: {stats.correct_answer}
              </span>{" "}
              |{" "}
              <span className="text-red-600 font-semibold">
                Wrong: {stats.wrong_answer}
              </span>
            </div>
            <div className="text-gray-600">
              Score:{" "}
              {Math.round(
                (stats.correct_answer / sampleQuestions.length) * 100
              )}
              %
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className={cn(buttonVariants({ size: "lg" }), "mt-6")}
          >
            Try Again <BarChart className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          See QuizCraft in Action
        </h3>
        <p className="text-lg text-gray-600 mb-6">
          Here's a sample quiz generated from a biology textbook chapter
        </p>
        <p className="text-sm text-gray-500">
          Use keyboard shortcuts: 1-4 to select answers, Enter to submit
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-row justify-between mb-6">
          <div className="flex flex-col">
            <p>
              <span className="text-slate-400">Topic</span> &nbsp;
              <span className="px-2 py-1 text-white rounded-lg bg-slate-800">
                Biology: Photosynthesis
              </span>
            </p>
            <div className="flex self-start mt-3 text-slate-400">
              <Timer className="mr-2" />
              {isClient && now
                ? formatTimeDelta(differenceInSeconds(now, gameStartTime))
                : "0s"}
            </div>
          </div>
          <MCQCounter
            correct_answers={stats.correct_answer}
            wrong_answers={stats.wrong_answer}
          />
        </div>

        <Card className="w-full mb-6 bg-gray-200 border-none">
          <CardHeader className="flex flex-row items-center">
            <CardTitle className="mr-5 text-center divide-y divide-zinc-600/50">
              <div>{questionIndex + 1}</div>
              <div className="text-base text-slate-800">
                {sampleQuestions.length}
              </div>
            </CardTitle>
            <CardDescription className="flex-grow text-lg">
              {currentQuestion?.question}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="flex flex-col items-center justify-center w-full">
          {currentQuestion.options.map((option, index) => {
            let buttonVariant: "default" | "outline" | "destructive" =
              "outline";
            let buttonClass = "";

            if (showResult) {
              if (index === currentQuestion.correct) {
                buttonVariant = "default";
                buttonClass = "bg-green-500 hover:bg-green-600 text-white";
              } else if (
                index === selectedChoice &&
                index !== currentQuestion.correct
              ) {
                buttonVariant = "destructive";
              }
            } else if (selectedChoice === index) {
              buttonVariant = "default";
            }

            return (
              <Button
                key={index}
                variant={buttonVariant}
                className={cn(
                  "justify-start w-full py-8 mb-4 transition-all duration-300",
                  buttonClass
                )}
                onClick={() => !showResult && setSelectedChoice(index)}
                disabled={showResult}
              >
                <div className="flex items-center justify-start">
                  <div className="p-2 px-3 mr-5 bg-gray-800 text-white border rounded-md">
                    {index + 1}
                  </div>
                  <div className="text-start">{option}</div>
                </div>
              </Button>
            );
          })}

          <Button
            variant="default"
            className="mt-2"
            size="lg"
            onClick={handleNext}
            disabled={selectedChoice === null || showResult}
          >
            {showResult ? (
              selectedChoice === currentQuestion.correct ? (
                "Correct!"
              ) : (
                "Incorrect!"
              )
            ) : (
              <>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SampleQuiz;
