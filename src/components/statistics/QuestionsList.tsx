"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Question } from "@prisma/client";
import { CheckCircle, XCircle } from "lucide-react";

type Props = {
  questions: Question[];
};

const QuestionsList = ({ questions }: Props) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="text-gray-500">
          End of quiz results • {questions.length} questions
        </TableCaption>
        <TableHeader>
          <TableRow className="border-gray-200 white">
            <TableHead className="w-14 text-gray-400">#</TableHead>
            <TableHead className="text-gray-800">
              Question & Correct Answer
            </TableHead>
            <TableHead className="text-gray-400">Your Answer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map(
            (
              { answer, question, userAnswer, percentageCorrect, isCorrect },
              index
            ) => (
              <TableRow
                key={index}
                className="border-gray-800 hover:bg-gray-900/70"
              >
                <TableCell className="font-mono text-gray-500">
                  {(index + 1).toString().padStart(2, "0")}
                </TableCell>
                <TableCell>
                  <div className="mb-2">{question}</div>
                  <div className="text-sm font-semibold px-2 py-1 bg-gray-800 inline-block rounded">
                    {answer}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 mt-0.5 text-red-500 flex-shrink-0" />
                    )}
                    <span
                      className={isCorrect ? "text-green-300" : "text-red-300"}
                    >
                      {userAnswer}
                    </span>
                  </div>

                  {percentageCorrect && (
                    <div className="text-xs text-gray-500 mt-1">
                      Similarity: {percentageCorrect}%
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default QuestionsList;
