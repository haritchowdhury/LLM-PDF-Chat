//import Groq from "groq-sdk";
//import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { JsonOutputParser } from "@langchain/core/output_parsers";

interface Topic {
  topic1: string;
  topic2: string;
  topic3: string;
  topic4: string;
  topic5: string;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  document_text: string,
  // default_category: string = "",
  // output_value_only: boolean = false,
  model: string = "llama-3.3-70b-versatile",
  temperature: number = 1
  // num_tries: number = 1,
  // verbose: boolean = false
) /* : Promise<
  {
    question: string;
    answer: string;
  }[]
>*/ {
  try {
    const groq = new ChatGroq({
      model: model,
      temperature: temperature,
    });
    const parser = new JsonOutputParser<Topic[]>();

    const context_prompt = `You are an assistant that strictly answers based on the provided document. 
    If the information is not in the document or the document is empty, respond with "I don't know." you can make up the wrong
    options from outside the document
    
    Here is the document:\n${document_text}`;

    const prompt = ChatPromptTemplate.fromTemplate(
      "{context_prompt}\n\nAnswer the user query strictly in JSON format.\n{format_instructions}\n{query}"
    );

    const partialedPrompt = await prompt.partial({
      context_prompt: context_prompt,
      format_instructions: system_prompt,
    });

    const chain = partialedPrompt.pipe(groq).pipe(parser);
    const res: any = await chain.invoke({ query: user_prompt });

    //const list_output: boolean = Array.isArray(res);
    //console.log("parsed output", res);
    return res;
  } catch (error) {
    return error as any;
  }
}
