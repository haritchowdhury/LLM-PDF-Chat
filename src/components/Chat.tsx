"use client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { useChat } from "ai/react";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/MarkDown";
import PersonalQuizBar from "@/components/PersonalQuizBar";
import CommunityQuizBar from "@/components/CommunityQuizBar";

type User = {
  email: string;
  upload: string;
  sessionId: string;
  namespace: string;
  personal: boolean;
  userId: string;
};

const Chat = ({
  email,
  upload,
  sessionId,
  namespace,
  personal,
  userId,
}: User) => {
  const router = useRouter();
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (!email) {
    router.push("/sign-in");
  }

  const {
    messages,
    input,
    error,
    handleInputChange,
    handleSubmit,
    setMessages,
    isLoading,
  } = useChat({
    body: {
      upload: upload,
      sessionId: sessionId,
      namespace: namespace,
    },
  });

  useEffect(() => {
    if (error) {
      //console.log("error at chat");
      toast({
        duration: 2000,
        variant: "destructive",
        description:
          "You have exceeded 20 questions for the day. Come back tomorrow.",
      });
    }
  }, [error]);

  useEffect(() => {
    if (email) {
      fetch(
        `/api/chat/history?upload=${upload}&&sessionId=${sessionId}&&namespace=${namespace}`
      )
        .then((res) => res.json())
        .then((res) => {
          if (res?.messages?.length > 0) {
            setMessages(res.messages);
            setLoading(false);
          }
        })
        .finally(() => setDisabled(false));
    }
  }, [email]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      // Add a slightly longer delay for initial load to ensure DOM is ready
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 300);
    }
  }, [loading, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <>
      {disabled ? (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4 flex-row bg-gray-900 rounded p-4">
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
          {/* upload input section */}
          <Card className="w-full max-w-2xl mx-auto shadow-lg bg-black border-none flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
            <input
              type="file"
              id="fileInput"
              className="hidden w-full"
              accept="application/pdf"
              onChange={() => {
                setDisabled(true);
                const fileInput = document.getElementById(
                  "fileInput"
                ) as HTMLInputElement;
                if (
                  !fileInput ||
                  !fileInput.files ||
                  fileInput.files.length === 0
                ) {
                  toast({
                    duration: 2000,
                    variant: "destructive",
                    description: "No file attached.",
                  });
                  return;
                }
                const fileData = fileInput.files[0];
                const formData = new FormData();
                formData.append("file", fileData);
                formData.append("namespace", namespace);
                formData.append("private", "true");
                toast({
                  duration: 10000,
                  description: "Adding your PDF to AI's knowledge...",
                });

                fetch("/api/upsert", {
                  method: "POST",
                  body: formData,
                })
                  .then((res) => res.json())
                  .then((data) => {
                    console.log("response after upload:", data);
                    if (data.error) {
                      toast({
                        duration: 2000,
                        variant: "destructive",
                        description: data.error,
                      });
                      setDisabled(false);
                    } else if (data.message) {
                      toast({
                        duration: 2000,
                        description:
                          "Added the PDF to AI's knowledge successfully.",
                      });
                      setTimeout(() => {
                        //router.refresh();
                        router.replace(`/chat/${data.message}`);
                      }, 100);
                      //setMessages([]);
                      setDisabled(false);
                    } else {
                      throw new Error("Upload ID missing in response");
                    }
                  })
                  .catch((error) => {
                    console.error("Upload error:", error);
                    toast({
                      duration: 2000,
                      variant: "destructive",
                      description:
                        "Something went wrong! Currently we support text only PDFs.",
                    });
                    setDisabled(false);
                  });
              }}
            />

            {/* Wallet/Quiz Section - Dynamically sized */}
            {personal ? (
              <PersonalQuizBar
                upload={upload}
                sessionId={sessionId}
                namespace={namespace}
                showLoader={showLoader}
                setShowLoader={setShowLoader}
              />
            ) : (
              <CommunityQuizBar
                upload={upload}
                sessionId={sessionId}
                namespace={namespace}
                showLoader={showLoader}
                setShowLoader={setShowLoader}
                userId={userId}
              />
            )}

            {/* Messages Section - Takes available space */}
            <CardContent className="bg-gray-1000 rounded p-4 flex-grow overflow-hidden flex flex-col">
              <div className="h-full w-full overflow-y-auto rounded custom-scrollbar flex flex-col">
                {!messages?.length ? (
                  !personal ? (
                    <p className="p-4 rounded bg-gray-400 text-gray-100">
                      Ask Something
                    </p>
                  ) : (
                    <>
                      {upload === "undefined" ? (
                        <p className="p-4 rounded bg-gray-400 text-gray-100">
                          Upload a document
                        </p>
                      ) : (
                        <p className="p-4 rounded bg-gray-400 text-gray-100">
                          Ask something
                        </p>
                      )}
                    </>
                  )
                ) : (
                  <></>
                )}
                {disabled ? (
                  <div className="text-gray-1000 flex gap-4 flex-row justify-center p-4">
                    <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin pb-4" />
                  </div>
                ) : (
                  messages.map(({ content }, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        "font-sans-semibold text-sm p-2 rounded-lg text-justify mt-1",
                        idx % 2 == 0
                          ? "text-white bg-gray-1000 self-end"
                          : "text-gray-100 bg-gray-600 self-start"
                      )}
                    >
                      <MarkdownRenderer text={content} />
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="p-6">
                    {" "}
                    <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin " />
                  </div>
                )}
                <div className="h-4" />
                <div ref={messagesEndRef} className="h-px" />
              </div>
            </CardContent>

            {/* Input Section - Fixed height at bottom */}
            {!showLoader && (
              <CardContent className="p-2 bg-black flex-shrink-0">
                <div className="flex w-full flex-row items-center justify-center bg-black">
                  {personal && (
                    <div className="cursor-pointer border px-2 py-1 pt-2 text-gray-400 hover:text-gray-800">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger
                            onClick={() => {
                              const tmp = document.querySelector(
                                `[id="fileInput"]`
                              ) as HTMLInputElement;
                              tmp?.click();
                            }}
                          >
                            <Upload className="size-[20px]" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>Upload Document</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}

                  <Input
                    value={input}
                    disabled={disabled}
                    className="bg-gray-200 text-black border-none flex-grow"
                    onChange={handleInputChange}
                    placeholder="Ask something..."
                    onKeyDown={(e) => {
                      if (e.key.toLowerCase() == "enter") {
                        handleSubmit();
                      }
                    }}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
};
export default Chat;
