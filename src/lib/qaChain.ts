import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGroq } from "@langchain/groq";
import { Message } from "@/lib/redisChat";

/**
 * Chat completion function using langchain with conversational memory and citation tracking
 * @param system_prompt - System prompt
 * @param user_prompt - User query
 * @param document_text - Context text extracted from Vectorstore
 * @param chatHistory - Previous conversation messages (optional)
 * @param availableSources - Array of source names that are available in the context (optional)
 * @param model - LLM model
 * @param temperature - Model Temperature
 * @returns Object containing the response and array of cited sources
 */
export async function qaChain(
  system_prompt: string,
  user_prompt: string | string[],
  document_text: string,
  chatHistory: Message[] = [],
  availableSources: string[] = [],
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

    // Build conversation history string if chat history exists
    let conversationContext = "";
    if (chatHistory.length > 0) {
      conversationContext = "\n\nPrevious conversation:\n";
      chatHistory.forEach((msg) => {
        const role = msg.role === "user" ? "User" : "Assistant";
        conversationContext += `${role}: ${msg.content}\n`;
      });
      conversationContext += "\n";
    }

    // Build sources list with source name mapping
    let sourcesContext = "";
    const sourceNameMap: { [key: string]: string } = {}; // Map source name to source string

    if (availableSources.length > 0) {
      sourcesContext =
        "\n\nAvailable sources (use these exact names in your response):\n";
      availableSources.forEach((source, idx) => {
        const sourceId = `SOURCE_${idx + 1}`;
        sourcesContext += `${sourceId}: ${source}\n`;
        sourceNameMap[sourceId] = source;
      });
    }

    // Context Prompt to restrict assistant to PDF content with conversation history
    const context_prompt = `You are an expert assistant who has access to the following document.
    You can go through large chunks of text and provide the exact information
    the user is asking for. If the answer isn't available, politely inform the user.
    Pay close attention to detail and don't provide dubious information that may not be
    present in provided context.
    Vary your responses and avoid starting answers with the same phrasing repeatedly.
    Make each response natural and engaging.${conversationContext}${sourcesContext}
    Here is the document:\n${document_text}`;

    // Enhanced format instructions for structured JSON response with citations
    const citationInstructions = `
    ${system_prompt}

    CRITICAL: You MUST respond with a valid JSON object in this EXACT format:
    {
      "answer": "Your detailed answer here",
      "sources_used": ["SOURCE_1", "SOURCE_3"]
    }

    Rules:
    1. The "answer" field contains your complete response to the user
    2. The "sources_used" field is an array containing ONLY the source IDs you actually used to formulate your answer
    3. Only include sources that directly contributed to your answer
    4. If you didn't use any sources, use an empty array: "sources_used": []
    5. Use the exact SOURCE_X identifiers from the available sources list
    6. Your entire response must be valid JSON - no additional text before or after`;

    // Prompt Template
    const prompt = ChatPromptTemplate.fromTemplate(
      "{context_prompt}\n\nAnswer the user query strictly based on the context prompt and previous conversation (if any).\n{format_instructions}\n{query}"
    );

    // Final Prompt
    const partialedPrompt = await prompt.partial({
      context_prompt: context_prompt,
      format_instructions: citationInstructions,
    });

    // Chain Response
    const chain = partialedPrompt.pipe(groq);
    const res: any = await chain.invoke({ query: user_prompt });

    // Parse the JSON response to extract answer and cited sources
    const responseText = res.content || res.text || String(res);
    let parsedResponse: any = null;
    let citedSources: string[] = [];
    let cleanAnswer = responseText;

    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
        cleanAnswer = parsedResponse.answer || responseText;

        // Convert source IDs to actual source names
        if (
          parsedResponse.sources_used &&
          Array.isArray(parsedResponse.sources_used)
        ) {
          citedSources = parsedResponse.sources_used
            .map((sourceId: string) => sourceNameMap[sourceId])
            .filter((source: string | undefined) => source !== undefined);
        }
      }
    } catch (error) {
      console.error("Failed to parse JSON response from LLM:", error);
      console.log("Raw response:", responseText);
      // Fallback: return all sources if JSON parsing fails
      citedSources = availableSources;
    }

    // If no sources were cited or parsing failed, fallback to all sources
    if (citedSources.length === 0 && availableSources.length > 0) {
      console.warn("No sources cited by LLM, falling back to all sources");
      citedSources = [];
    }

    // Update response content with clean answer
    res.content = cleanAnswer;

    return {
      response: res,
      citedSources: citedSources,
    };
  } catch (error) {
    return error as any;
  }
}
