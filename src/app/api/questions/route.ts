/*import { strict_output } from "@/lib/groqQuestionSetter";
import getUserSession from "@/lib/user.server";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse, NextRequest } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const maxDuration = 500;

export async function POST(request: NextRequest) {
  //const user = await getUserSession();
  //const [sessionId, namespace] = user;

  // if (!user?) {
  //   return NextResponse.json(
  //     { error: "You must be logged in to create a game." },
  //     {
  //       status: 401,
  //     }
  //   );
  // }
  const body = await request.json();
  const { amount, topic, type } = getQuestionsSchema.parse(body);
  console.log(amount, topic, type);
  try {
    let questions: any;
    if (type === "mcq") {
      questions = await strict_output(
        "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words, store all answers and questions and options in a JSON array",
        new Array(amount).fill(
          `You are to generate a random hard mcq question about ${topic}`
        ),
        {
          question: "question",
          answer: "answer with max length of 15 words",
          option1: "option1 with max length of 15 words",
          option2: "option2 with max length of 15 words",
          option3: "option3 with max length of 15 words",
        },
        `Apple Inc. is an American multinational corporation and technology company headquartered in Cupertino, California, in Silicon Valley. 
        It is best known for its consumer electronics, software, and services. Founded in 1976 as Apple Computer Company by Steve Jobs, Steve Wozniak
        and Ronald Wayne, the company was incorporated by Jobs and Wozniak as Apple Computer, Inc. the following year. It was renamed Apple Inc. in 2007 
        as the company had expanded its focus from computers to consumer electronics. Apple is the largest technology company by revenue, with US$391.04 
        billion in the 2024 fiscal year. The company was founded to produce and market Wozniak's Apple I personal computer. Its second computer, the Apple II, 
        became a best seller as one of the first mass-produced microcomputers. Apple introduced the Lisa in 1983 and the Macintosh in 1984, as some of the first 
        computers to use a graphical user interface and a mouse. By 1985, internal company problems led to Jobs leaving to form NeXT, Inc., and Wozniak withdrawing 
        to other ventures; John Sculley served as long-time CEO for over a decade. In the 1990s, Apple lost considerable market share in the personal computer industry 
        to the lower-priced Wintel duopoly of the Microsoft Windows operating system on Intel-powered PC clones. In 1997, Apple was weeks away from bankruptcy. To resolve 
        its failed operating system strategy, it bought NeXT, effectively bringing Jobs back to the company, who guided Apple back to profitability over the next decade 
        with the introductions of the iMac, iPod, iPhone, and iPad devices to critical acclaim as well as the iTunes Store, launching the "Think different" advertising campaign,
        and opening the Apple Store retail chain. These moves elevated Apple to consistently be one of the world's most valuable brands since about 2010. Jobs resigned in 2011 
        for health reasons, and died two months later; he was succeeded as CEO by Tim Cook. Apple's current product lineup includes portable and home hardware such as the iPhone,
        iPad, Apple Watch, Mac, and Apple TV; operating systems such as iOS, iPadOS, and macOS; and various software and services including Apple Pay, iCloud, and multimedia streaming services like Apple Music and Apple TV+. Apple is one of the Big Five American information technology companies;[a] for the most part since 2011,[b] Apple has been the world's largest company by market capitalization, and, as of 2023, is the largest`
      );
    }
    console.log(questions);
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
      console.error("elle gpt error", error);
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        {
          status: 500,
        }
      );
    }
  }
}
*/

import { strict_output } from "@/lib/groqQuestionSetter";
import getUserSession from "@/lib/user.server";
import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse, NextRequest } from "next/server";
import { ZodError } from "zod";
import { queryUpstash } from "@/lib/upstash";
import { Index } from "@upstash/vector";

export const runtime = "nodejs";
export const maxDuration = 500;

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
          `You are to generate a random hard mcq question about ${topic}. The question should be strictly relevant to the topic.`
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
