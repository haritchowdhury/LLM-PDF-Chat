import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";

export async function summarizer(
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

    const context_prompt = `Capture the main points, decisions, and important information exchanged in a summary in less than 150 words.

    
    Here is the document:\n${document_text}`;

    const prompt = ChatPromptTemplate.fromTemplate(
      "{context_prompt}\n\nAnswer the user query strictly in less than 150 words.\n{format_instructions}\n{query}"
    );

    const partialedPrompt = await prompt.partial({
      context_prompt: context_prompt,
      format_instructions: system_prompt,
    });

    const chain = partialedPrompt.pipe(groq);
    const res: any = await chain.invoke({ query: user_prompt });

    return res;
  } catch (error) {
    return error as any;
  }
}
