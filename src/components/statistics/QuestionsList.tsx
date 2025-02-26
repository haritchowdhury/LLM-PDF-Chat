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
type Props = {
  questions: Question[];
};

const QuestionsList = ({ questions }: Props) => {
  return (
    <Table>
      <TableCaption>End of list.</TableCaption>
      <TableHeader>
        <TableRow className="border-none">
          <TableHead className="w-[10px]">No.</TableHead>
          <TableHead>Question & Correct Answer</TableHead>
          <TableHead>Your Answer</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <>
          {questions.map(
            (
              { answer, question, userAnswer, percentageCorrect, isCorrect },
              index
            ) => {
              return (
                <TableRow key={index} className="border-none">
                  <TableCell className="font-medium text-white">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-white">
                    {question} <br />
                    <br />
                    <span className="font-semibold text-white">{answer}</span>
                  </TableCell>

                  <TableCell
                    className={`${
                      isCorrect ? "text-green-200" : "text-red-200"
                    } font-semibold`}
                  >
                    {userAnswer}
                  </TableCell>

                  {percentageCorrect && (
                    <TableCell className="text-right text-white">
                      {percentageCorrect}
                    </TableCell>
                  )}
                </TableRow>
              );
            }
          )}
        </>
      </TableBody>
    </Table>
  );
};

export default QuestionsList;
