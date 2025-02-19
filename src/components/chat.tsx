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
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import QuizForm from "@/components/quizForm";
import { useAccount } from "wagmi";
type User = {
  email: string;
};
const Chat = ({ email }: User) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const router = useRouter();
  if (!email) {
    router.push("/sign-in");
  }

  const { address, isConnected } = useAccount();

  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(true);
  // const [uploaded, setUploaded] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();
  const [suggestions, setSuggestions] = useState();
  useEffect(() => {
    if (email) {
      fetch("/api/chat/history")
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
    scrollToBottom();
  }, [messages, setMessages]);

  return (
    <>
      {disabled ? (
        <p className="text-white">loading...</p>
      ) : (
        <Card className="max-w-full md:max-w-2xl mx-auto shadow-lg bg-black border-none">
          <input
            type="file"
            id="fileInput"
            className="hidden w-full"
            accept="application/pdf"
            onChange={() => {
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
              toast({
                duration: 10000,
                description: "Adding your PDF to AI's knowledge...",
              });
              fetch("/api/upsert", {
                method: "POST",
                body: formData,
              }).then((res) => {
                if (res.ok) {
                  //                  setUploaded(true);
                  toast({
                    duration: 2000,
                    description: "Added the PDF to AI's knowledge succesfully.",
                  });
                  setTimeout(() => {
                    router.refresh();
                  }, 10000);
                  setMessages([]);
                } else {
                  toast({
                    duration: 2000,
                    variant: "destructive",
                    description: "Failed to add the PDF to AI's knowledge.",
                  });
                }
              });
            }}
          />
          <CardContent className="text-white flex justify-center items-center p-0 ">
            {isConnected ? (
              <QuizForm topic={""} />
            ) : (
              <div>Connect wallet to access quiz</div>
            )}
          </CardContent>
          <CardContent className=" bg-gray-900 rounded p-4">
            <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
              {!messages?.length ? (
                <p className="text-white">
                  {" "}
                  Upload a document and ask something
                </p>
              ) : (
                <></>
              )}
              {disabled ? (
                <p className="text-gray-500 text-center">loading... </p>
              ) : (
                messages.map(({ content }, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "font-sans-semibold text-sm p-2 rounded-lg text-justify mt-1",
                      idx % 2 == 0
                        ? "text-white bg-black self-end"
                        : "text-white bg-gray-600 self-start"
                    )}
                  >
                    {content}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </CardContent>
          <CardContent className="overflow-y-auto  p-0">
            <div className="fixed bottom-12  mb-10 flex w-full  flex-row items-center justify-center shadow left-0 right-0">
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
              <Input
                value={input}
                style={{ maxWidth: "clamp(300px, 100vw - 420px, 600px)" }}
                disabled={disabled}
                className="bg-gray-200 text-black border-none !rounded-none align-content: center "
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
        </Card>
      )}
    </>
  );
};
export { Chat };
