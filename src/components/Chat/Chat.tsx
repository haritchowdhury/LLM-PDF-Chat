"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Upload, Send, Menu, X, Users, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "@/components/MarkDown";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import LeftSideBar from "@/components/Chat/LeftSideBar";
import RightSideBar from "@/components/Chat/RightSideBar";
import { Upload as PrismaUpload, Game } from "@prisma/client";
import LinkSubmitDialog from "@/components/Chat/UpsertLink";
import QuizForm from "@/components/Quiz/QuizForm";
import CommunityQuizForm from "@/components/Quiz/CommunityQuizForm";

// Define message types
type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
};

type ChatProps = {
  userId: string;
  publisher: string;
  sessionId?: string;
  namespace?: string;
  isPersonal?: boolean;
  workspaces?: PrismaUpload[];
  games?: Game[];
  upload?: PrismaUpload;
};

/**
 * Responsive Chat Component with collapsible sidebars
 */
const Chat = ({
  userId,
  publisher,
  sessionId,
  namespace,
  isPersonal,
  workspaces,
  games,
  upload,
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

  // Mobile sidebar states
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

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

  // Close mobile sidebars when clicking outside or on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Handle file uploads for RAG processing
   */
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
        toast({
          description: data.error,
          duration: 2000,
        });
      } else if (response.status === 202) {
        // Async processing started
        toast({
          description: "PDF is being processed in the background. You'll be notified when it's ready.",
          duration: 3000,
        });

        // If this is a new upload, navigate to it
        // If adding to existing, stay on current page and refresh
        if (namespace === "undefined" && data.uploadId) {
          setTimeout(() => {
            router.replace(`/chat/${data.uploadId}`);
          }, 100);
        } else {
          // Refresh the page to show processing status
          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      } else if (data.message || data.uploadId) {
        // Synchronous processing completed (legacy or immediate completion)
        toast({
          description: "Added the PDF to AI's knowledge successfully",
          duration: 2000,
        });

        setTimeout(() => {
          router.replace(`/chat/${data.uploadId || data.message}`);
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

  /**
   * Submit a question to the chat API
   */
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
          uploadId: upload?.id,
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
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="flex gap-4 flex-row bg-white rounded p-4">
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-gray-800">
            {isUploading ? "Uploading..." : "Loading..."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex relative">
      {/* Mobile Header with Sidebar Toggles */}
      <div className="md:hidden absolute top-0 left-0 right-0 z-30 bg-gradient-to-br from-blue-50 to-green-50 border-b border-gray-400 px-4 py-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="text-gray-800 hover:text-white hover:bg-gray-800"
        >
          <Menu className="h-4 w-4 mr-2" />
          Quiz
        </Button>

        <div className="text-sm text-gray-800 font-medium">
          {namespace === "undefined" ? "New Chat" : "Document Chat"}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className="text-gray-800 hover:text-white hover:bg-gray-800"
        >
          <FileText className="h-4 w-4 mr-2" />
          Files
        </Button>
      </div>

      {/* Left Sidebar - Desktop always visible, Mobile overlay */}
      <div className="hidden md:flex">
        <LeftSideBar
          namespace={namespace}
          isPersonal={isPersonal}
          upload={upload}
          currentUserId={userId}
        />
      </div>

      {/* Mobile Left Sidebar Overlay */}
      <AnimatePresence>
        {leftSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setLeftSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64"
            >
              <div className="h-full bg-gradient-to-br from-blue-50 to-green-50 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    Quiz Options
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLeftSidebarOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-grow overflow-y-auto p-4">
                  {namespace !== "undefined" && (
                    <div className="mb-4">
                      {/* Import and render quiz components directly */}
                      {isPersonal ? (
                        <QuizForm topic="" id={namespace} />
                      ) : (
                        <CommunityQuizForm topic="" id={namespace} />
                      )}
                    </div>
                  )}
                  {namespace === "undefined" && (
                    <div className="text-center text-gray-400 text-sm">
                      Upload a document first to access quiz options
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Chat Area - Responsive */}
      <div className="flex-1 flex flex-col h-full pt-12 md:pt-0">
        <Card className="w-full h-full rounded-none shadow-none bg-gradient-to-br from-blue-50 to-green-50 border-none flex flex-col overflow-hidden">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            id="fileInput"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileUpload}
          />

          {/* Messages Display Area */}
          <CardContent className="flex-grow overflow-hidden flex flex-col p-0">
            <div className="h-full w-full overflow-y-auto custom-scrollbar flex flex-col p-4 pb-16">
              {/* Empty state messages */}
              {!messages.length && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-green-50 text-gray-800 text-center text-sm mx-auto max-w-md">
                  {!isPersonal
                    ? "Ask something about this content"
                    : namespace === "undefined"
                      ? "Upload a document to get started"
                      : "Ask something about your document"}
                </div>
              )}

              {/* Message list - Responsive widths */}
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    "font-sans-semibold text-sm p-3 md:p-4 rounded-lg text-justify mt-2 mb-2",
                    message.role === "user"
                      ? "text-white bg-blue-400 self-end ml-auto max-w-[85%] md:max-w-[80%]"
                      : "text-gray-800 bg-gray-400 self-start mr-auto max-w-[85%] md:max-w-[80%] break-words"
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

          {/* Input Area - Responsive */}
          <div className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-green-50 border-t border-gray-200 sticky bottom-0 z-10">
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-row items-center gap-2"
            >
              {/* Upload button */}
              {(isPersonal || userId === publisher) && (
                <div className="flex gap-1 md:gap-2">
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
                </div>
              )}

              {/* Text input - Responsive */}
              <Input
                value={input}
                disabled={isProcessing}
                className="bg-white text-gray-800 border-gray-700 focus:border-gray-200 focus:ring-gray-400 text-sm md:text-base"
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                onKeyDown={handleKeyDown}
              />

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Right Sidebar - Desktop always visible, Mobile overlay */}
      <div className="hidden md:flex">
        <RightSideBar workspaces={workspaces} games={games} />
      </div>

      {/* Mobile Right Sidebar Overlay */}
      <AnimatePresence>
        {rightSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setRightSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: 256 }}
              animate={{ x: 0 }}
              exit={{ x: 256 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed right-0 top-0 bottom-0 z-50 w-64"
            >
              <div className="h-full bg-gradient-to-br from-blue-50 to-green-50 border-l border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-800">
                    Your Files
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRightSidebarOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <RightSideBar workspaces={workspaces} games={games} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;
