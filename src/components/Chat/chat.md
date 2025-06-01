"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Upload, Send } from "lucide-react";
import {
Tooltip,
TooltipContent,
TooltipProvider,
TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/MarkDown";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import LeftSideBar from "@/components/Chat/LeftSideBar";
import RightSideBar from "@/components/Chat/RightSideBar";
import { Upload as PrismaUpload, Game } from "@prisma/client";
import LinkSubmitDialog from "@/components/UpsertLink";
// Define message types
type Message = {
role: "user" | "assistant";
content: string;
sources?: string[];
};

type ChatProps = {
userId: string;
sessionId?: string;
namespace?: string;
isPersonal?: boolean;
workspaces?: PrismaUpload[];
games?: Game[];
};

/\*\*

- Unified Chat Component that handles both personal and community interactions
  \*/
  const Chat = ({
  userId,
  sessionId,
  namespace,
  isPersonal,
  workspaces,
  games,
  }: ChatProps) => {
  // Router and toast utilities
  const router = useRouter();
  const { toast } = useToast();

// UI and interaction states
const [input, setInput] = useState("");
const [messages, setMessages] = useState<Message[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [isProcessing, setIsProcessing] = useState(false);
const [isUploading, setIsUploading] = useState(false);

// Refs for DOM interaction
const messagesEndRef = useRef<HTMLDivElement | null>(null);
const fileInputRef = useRef<HTMLInputElement>(null);

// Security check - redirect if no user ID
useEffect(() => {
if (!userId) {
router.push("/sign-in");
}
}, [userId, router]);

// Fetch existing chat history
useEffect(() => {
if (!userId) return;

    const endpoint = `/api/chat/history?${new URLSearchParams({
      sessionId: sessionId || "",
    })}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data?.rawMessages?.length > 0) {
          setMessages(data?.rawMessages.reverse());
        }
      })
      .catch((error) => {
        console.error("Failed to fetch chat history:", error);
        toast({
          variant: "destructive",
          description: "Failed to load chat history",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });

}, [userId, sessionId, namespace, toast]);

// Automatic scroll to bottom whenever messages change
useEffect(() => {
if (!isLoading && messages.length > 0) {
setTimeout(() => {
messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, 100);
}
}, [isLoading, messages, isProcessing]);

/\*\*

- Handle file uploads for RAG processing
  \*/
  const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
  ) => {
  const file = event.target.files?.[0];
  if (!file) return;


    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    // Add namespace and private flag if in personal mode
    if (namespace) {
      formData.append("namespace", namespace);
    }
    formData.append("private", isPersonal ? "true" : "false");

    toast({
      description: "Adding your PDF to AI's knowledge...",
      duration: 10000,
    });

    try {
      const response = await fetch("/api/upsert", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      } else if (data.message) {
        toast({
          description: "Added the PDF to AI's knowledge successfully",
          duration: 2000,
        });

        // Navigate to new chat with uploaded document
        setTimeout(() => {
          router.replace(`/chat/${data.message}`);
        }, 100);
      } else {
        throw new Error("Upload ID missing in response");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Something went wrong! ",
        duration: 2000,
      });
    } finally {
      setIsUploading(false);
    }

};

/\*\*

- Submit a question to the chat API
  \*/
  const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();
  if (!input.trim() || isProcessing) return;


    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_prompt: input,
          sessionId: sessionId,
          namespace: namespace,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant message to chat
      const assistantMessage: Message = {
        role: "assistant",
        content: data?.content || "I'm sorry, I couldn't process that request.",
        sources: data?.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setInput("");
    } catch (error) {
      console.error("Chat error:", error);

      toast({
        variant: "destructive",
        description: "Failed to get a response from AI",
        duration: 2000,
      });

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered an error processing your request. Please try again.",
          sources: [],
        },
      ]);
    } finally {
      setIsProcessing(false);
    }

};

// Handle keyboard input events
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
if (e.key === "Enter" && !e.shiftKey) {
e.preventDefault();
handleSubmit();
}
};

// Show appropriate loading states
if (isLoading || isUploading) {
return (
<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4 flex-row bg-gray-900 rounded p-4">
<motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
</div>
);
}

return (
<div className="w-full h-[calc(100vh-4rem)] flex items-stretch">
{/_ Left Sidebar _/}
<LeftSideBar namespace={namespace} isPersonal={isPersonal} />

      {/* Main Chat Area - Fixed Width */}
      <div className="flex-grow flex flex-col h-full relative max-w-[calc(100%-128px)] md:max-w-[calc(100%-512px)]">
        <Card className="w-full h-full rounded-none shadow-none bg-black border-none flex flex-col overflow-hidden">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            id="fileInput"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileUpload}
          />

          {/* Messages Display Area - Fixed with proper overflow */}
          <CardContent className="flex-grow overflow-hidden flex flex-col p-0">
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col p-4 pb-16">
              {/* Empty state messages */}
              {!messages.length && (
                <div className="p-4 rounded-lg bg-gray-800 text-gray-300 text-center text-sm">
                  {!isPersonal
                    ? "Ask something about this content"
                    : namespace === "undefined"
                      ? "Upload a document to get started"
                      : "Ask something about your document"}
                </div>
              )}

              {/* Message list with width constraint */}
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    "font-sans-semibold text-sm p-4 rounded-lg text-justify mt-2 mb-2",
                    message.role === "user"
                      ? "text-white bg-blue-600 self-end ml-auto max-w-[80%]"
                      : "text-gray-100 bg-gray-800 self-start mr-auto max-w-[80%] break-words"
                  )}
                >
                  <div className="w-full overflow-hidden break-words">
                    <MarkdownRenderer text={message.content} />
                  </div>

                  {/* Source citations if available */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <p className="font-semibold text-xs mb-1">Sources:</p>
                      <ul className="list-disc pl-4 text-xs">
                        {message.sources.map((source, sourceIdx) => (
                          <li key={sourceIdx} className="break-all">
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator for response */}
              {isProcessing && (
                <div className="p-4 self-center">
                  <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}

              {/* Scroll reference */}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </CardContent>

          {/* Input Area - Fixed to bottom */}
          <div className="p-3 bg-gray-900 border-t border-gray-800 sticky bottom-0 z-10">
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-row items-center gap-2"
            >
              {/* Upload button */}
              {isPersonal && (
                <>
                  <LinkSubmitDialog
                    upload={namespace}
                    isPersonal={isPersonal}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>Upload Document</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {/* Text input */}
              <Input
                value={input}
                disabled={isProcessing}
                className="bg-gray-800 text-gray-100 border-gray-700 focus:border-gray-600 focus:ring-gray-600"
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                onKeyDown={handleKeyDown}
              />

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Right Sidebar */}
      <RightSideBar workspaces={workspaces} games={games} />
    </div>

);
};

export default Chat;
