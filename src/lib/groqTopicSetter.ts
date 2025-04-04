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
  model: string = "llama-3.3-70b-versatile",
  temperature: number = 1
) {
  try {
    const groq = new ChatGroq({
      model: model,
      temperature: temperature,
    });
    const parser = new JsonOutputParser<Topic[]>();

    const context_prompt = `You are a precise document analyzer that extracts the most relevant topics based solely on the provided document content.
    If the document is empty or doesn't contain sufficient information, respond with "Insufficient document content."
    You are a document structure analyzer that identifies the main organizational sections and categories within the provided document.
    Focus on categorizing content by its function rather than extracting specific details.

    Document:
    ${document_text}
    `;

    const prompt = ChatPromptTemplate.fromTemplate(
      "{context_prompt}\n\nIdentify the 5 most important high-level categories or sections in this document.\n{format_instructions}\n{query}"
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
