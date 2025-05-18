"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/Components/ui/input";
import { Upload } from "lucide-react";
import {
Tooltip,
TooltipContent,
TooltipProvider,
TooltipTrigger,
} from "@/Components/ui/tooltip";
import { Card, CardContent } from "@/Components/ui/card";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/Components/MarkDown";
import { toast } from "sonner";
import Image from "next/image";

// RAG chat message type definition
type Message = {
role: "user" | "assistant";
content: string;
sources: string[];
};
/\*\*

- Main Client side component to render the LLM RAG chat function
  \*/
  const Chat = ({ userId }: { userId: string }) => {
  // Initializes the router
  const router = useRouter();
  // Initializes the necessary States
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  // Initializes the Reference for automatic scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // If user does not exist reroute to root route, incase user logs out, or malicious usage
  useEffect(() => {
  if (!userId) router.push("/");
  }, [userId, router]);

// Fetches the existing chat history from /chat/history api
useEffect(() => {
if (!initialLoadComplete) {
fetch("/api/chat/history")
.then((res) => res.json())
.then((res) => {
console.log("messages at client", res.rawMessages);

          if (res?.rawMessages?.length > 0) {
            setMessages(res.rawMessages.reverse());
          }
        })
        .catch((err) => {
          console.error("Failed to fetch chat history:", err);
        })
        .finally(() => {
          setIsLoading(false);
          setInitialLoadComplete(true);
        });
    }

}, [initialLoadComplete]); // Renders only once when the component loads

// Sets the reference for scroll to bottom if chat history exists
useEffect(() => {
if (!isLoading && messages.length > 0) {
setTimeout(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
}, 300);
}
}, [isLoading, messages.length, isUploading]); // Renders if loading status, message.length, or uploading state changess

// Function to hande files upload
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
const file = e.target.files?.[0];
if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Post request to /upsert api with file content
      const res = await fetch("/api/upsert", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      toast("Added PDF data to AI's knowledge");

      if (data?.message) {
        // Rerender the route in case of succesful upload
        router.push(`/Chat/${data.message}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Pop up in case of success
      toast("File Could not be uploaded");
    } finally {
      // Pop up in case of failure
      setIsUploading(false);
    }

};

// Function to handle question submit
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
e.preventDefault();
if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input, sources: [] };
    // Updates the messages state with user message
    setMessages((prev) => [...prev, userMessage]);
    setStatus("loading");

    try {
      // Makes a Post request to the /chat api
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: input,
          // system_prompt: "Answer as helpfully as possible",
        }),
      });

      const data = await res.json();
      // Fetched assistant response
      const botMessage: Message = {
        role: "assistant",
        content: data?.content || "No response received",
        sources: data?.sources || ["No Sources"],
      };

      setMessages((prev) => [...prev, botMessage]);
      setInput("");
    } catch (error) {
      console.error("Chat error:", error);
      // Pop up incase the /chat api call fails
      toast("Failed to get a response from AI");

      // Add a graceful error message to the chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I encountered an error processing your request. Please try again.",
          sources: [],
        },
      ]);
    } finally {
      setStatus("idle");
    }

};
return (

<div className="w-full h-full flex flex-col">
{isLoading || isUploading ? (
<div className="flex flex-col items-center justify-center h-full">
<motion.div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
</div>
) : (
<Card className="flex flex-col bg-gray-900 text-white border-none h-full">
{/_ Renders Messages both user's and assistant's _/}
<CardContent className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
<>
<div className="max-w-xl px-4 py-2 rounded-lg text-sm whitespace-pre-wrap bg-gray-400 text-gray-800 self-start mr-auto">
<MarkdownRenderer
text={`Use the tooltip icon beside the input to upload a document.`}
/>

                <Image
                  src="/tooltip.png"
                  alt="Tooltip Image"
                  width={50}
                  height={50}
                  className="rounded-lg shadow-md"
                />
              </div>
              <div className="max-w-xl px-4 py-2 rounded-lg text-sm whitespace-pre-wrap bg-gray-400 text-gray-800 self-start mr-auto">
                <MarkdownRenderer
                  text={`You will see a pop up if the upload fails or succeds.`}
                />
              </div>
              <div className="max-w-xl px-4 py-2 rounded-lg text-sm whitespace-pre-wrap bg-gray-400 text-gray-800 self-start mr-auto">
                <MarkdownRenderer
                  text={`If the upload is succesful start asking questions!`}
                />
              </div>
            </>

            {messages.map(({ content, role, sources }, idx) => (
              <div
                key={idx}
                className={`max-w-xl px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  role === "user"
                    ? "bg-blue-600 text-white self-end ml-auto"
                    : "bg-gray-400 text-gray-800 self-start mr-auto"
                }`}
              >
                {/* Mark down properly formats the messages */}
                <MarkdownRenderer text={content} />
                {sources && sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="font-semibold text-xs mb-1">Sources:</p>
                    <ul className="list-disc pl-4 text-xs">
                      {sources.map((source, sourceIdx) => (
                        <li key={sourceIdx}>{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} className="h-4" />
            {/* Loading state when assistant is responding */}
            {status === "loading" && (
              <div>
                <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
              </div>
            )}
          </CardContent>

          {/* Renders Tootl tip for upload and input field for typing questions */}
          <CardContent className="bg-gray-600 p-1 border-t border-gray-400">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("fileInput")?.click()
                      }
                      className="p-2 rounded hover:bg-gray-700"
                    >
                      <Upload className="w-5 h-5 text-gray-400" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>Upload PDF</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow bg-gray-200 text-black border-none"
                placeholder="Ask something..."
              />
            </form>
          </CardContent>
        </Card>
      )}
    </div>

);
};

export default Chat;

---

## api/chat

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const maxDuration = 60;

import type { Message } from "ai";
import { Index } from "@upstash/vector";
import { aiUseChatAdapter } from "@upstash/rag-chat/nextjs";
import getUserSession from "@/lib/user.server";
import { queryUpstashAndLLM } from "@/lib/upstash";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db/db";

interface ChatRequest {
upload: string;
sessionId: string;
namespace: string;
messages: Message[];
}

const redis = new Redis({
url: process.env.UPSTASH*REDIS_REST_URL,
token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
const MAX_REQUESTS_PER_DAY = 20;
const EXPIRATION_TIME = 24 * 60 \_ 60 \* 7;
const index = new Index({
url: process.env.UPSTASH_VECTOR_REST_URL,
token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

export async function POST(request: NextRequest) {
const session = await auth();
const userId = String(session.user.id);
const user = await getUserSession();
const namespaceList = await new Index().listNamespaces();
const { upload, sessionId, namespace, messages } =
(await request.json()) as ChatRequest;
const question: string | undefined = messages.at(-1)?.content;
const requestCount =
(await redis.get<number>(`chat_rate_limit:${userId}`)) || 0;

if (!user) return new Response(null, { status: 403 });
const betaTester = await db.betatesters.findFirst({
where: {
email: session?.user.email,
},
});
if (!betaTester) {
if (requestCount >= MAX_REQUESTS_PER_DAY) {
return NextResponse.json(
`You have exceeded the nuber of questions you can ask in a week. Weekly limit ${MAX_REQUESTS_PER_DAY}`,
{ status: 429 }
);
}
}
if (requestCount >= 100) {
return NextResponse.json(
`You have exceeded the nuber of questions you can ask in a week. Weekly limit ${100}`,
{ status: 429 }
);
}
if (!question)
return new Response("No question in the request.", { status: 401 });
if (!namespaceList.includes(namespace)) {
return NextResponse.json("This Namespace has not been created.", {
status: 404,
});
}
//console.log("payload at chat", upload, sessionId, namespace);

let response: any;
try {
await redis.set(`chat_rate_limit:${userId}`, requestCount + 1, {
ex: EXPIRATION_TIME,
});
response = await queryUpstashAndLLM(index, namespace, sessionId, question);
//console.log("response from chat:", response[1]);
} catch {
return NextResponse.json(
"Unable to get response from model, contact the developer team.",
{
status: 401,
}
);
}

return aiUseChatAdapter(response /_, "sources"_/);
}

---

## api

chat/history

---

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import ragChat from "@/lib/rag.server";
import { NextResponse, NextRequest } from "next/server";
import getUserSession from "@/lib/user.server";

export async function GET(request: NextRequest) {
const userSession = await getUserSession();
if (!userSession) return new Response(null, { status: 403 });

const { searchParams } = request.nextUrl;
const upload = searchParams.get("upload");
const sessionId = searchParams.get("sessionId");
const namespace = searchParams.get("namespace");

//console.log("upload at history", sessionId, upload);

const messages = await ragChat.history.getMessages({
amount: 100,
sessionId: sessionId,
});
return NextResponse.json({ messages });
}
