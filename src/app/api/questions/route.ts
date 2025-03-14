import { strict_output } from "@/lib/groqQuestionSetter";
import getUserSession from "@/lib/user.server";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse, NextRequest } from "next/server";
import { ZodError } from "zod";
import { queryUpstash } from "@/lib/upstash";
import { Index } from "@upstash/vector";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
  });
  try {
    const { amount, topic, type, namespace } = getQuestionsSchema.parse(body);
    console.log("quesionAPI", amount, topic, type, namespace);
    const questionData = await queryUpstash(index, namespace, topic);
    console.log(questionData);
    //console.log(amount, topic, type);
    let questions: any;
    if (type === "mcq") {
      questions = await strict_output(
        `You are a helpful AI that is able to generate mcq questions 
        and answers, the length of each answer should not be more than 
        15 words, store all answers and questions and options in a JSON 
        array of the following structure:
        {
         "question": "string",
         "answer": "string",
         "option1": "string",
         "option2": "string",
         "option3": "string",
         "option4": "string"
         }`,
        new Array(amount).fill(
          `You are to generate a random hard mcq question about ${topic}. 
          The question should be strictly relevant to the topic and the answer should be clear, there should not be any ambiguity among the options for the question.`
        ),
        questionData
      );
    }
    console.log(JSON.stringify(questions));
    return NextResponse.json(
      {
        questions: questions,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        }
      );
    } else {
      console.error(" error", error);
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        {
          status: 500,
        }
      );
    }
  }
}
