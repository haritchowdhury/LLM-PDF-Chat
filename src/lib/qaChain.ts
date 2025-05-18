import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
/**
 * Chat completion function using langchain
 * @param system_prompt - System prompt
 * @param user_prompt - User query
 * @param document_text - Context text extracted from Vectorstore
 * @param model - LLM model
 * @param temperature - Model Temperature
 */
export async function qaChain(
  system_prompt: string,
  user_prompt: string | string[],
  document_text: string,
  model: string = "llama-3.3-70b-versatile",
  temperature: number = 1
) {
  try {
    // Defines the LLM
    const groq = new ChatGroq({
      model: model,
      temperature: temperature,
      streaming: true,
    });
    // Context Prompt to restrict assitant to PDF content
    const context_prompt = `You are an expert assistant who has access to ${document_text}. 
    You can go through large chunks of text and provide the exact information 
    the user is asking for. If the answer isn't available, politely inform the user. 
    Pay close attention to detail and don't provide dubious information that may not be 
    present in provided context.  
    Vary your responses and avoid starting answers with the same phrasing repeatedly.  
    Make each response natural and engaging. 
    Here is the document:\n${document_text}`;
    // Prompt Template
    const prompt = ChatPromptTemplate.fromTemplate(
      "{context_prompt}\n\nAnswer the user query strictly based on the context prompt.\n{format_instructions}\n{query}"
    );
    // Final Prompt
    const partialedPrompt = await prompt.partial({
      context_prompt: context_prompt,
      format_instructions: system_prompt,
    });
    // Chain Response
    const chain = partialedPrompt.pipe(groq);
    const res: any = await chain.invoke({ query: user_prompt });
    return res;
  } catch (error) {
    return error as any;
  }
}
