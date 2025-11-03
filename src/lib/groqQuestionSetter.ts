import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { JsonOutputParser } from "@langchain/core/output_parsers";

interface Question {
  question: string;
  answer: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
}

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  document_text: string,
  model: string = "llama-3.3-70b-versatile",
  temperature: number = 1
) {
  try {
    const groq = new ChatGroq({
      model: model,
      temperature: temperature,
    });
    const parser = new JsonOutputParser<Question[]>();

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

    // Ensure the result is always an array
    if (Array.isArray(res)) {
      return res;
    } else if (res && typeof res === 'object') {
      // If it's a single object, wrap it in an array
      console.warn('strict_output received a single object instead of an array, wrapping it');
      return [res];
    } else {
      console.error('strict_output received invalid data:', res);
      return [];
    }
  } catch (error) {
    console.error('Error in strict_output:', error);
    return [];
  }
}
