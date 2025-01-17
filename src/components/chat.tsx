"use client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { useChat } from "ai/react";
import { Input } from "@/components/ui/input";
//import { Button } from "@/components/ui/button";
import MemoizedMD from "@/components/memoized-react-markdown";
import { Upload } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Chat = ({ email }) => {
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const router = useRouter();
  if (!email) {
    router.push("/sign-in");
  }
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();

  useEffect(() => {
    if (email) {
      fetch("/api/chat/history")
        .then((res) => res.json())
        .then((res) => {
          if (res?.messages?.length > 0) setMessages(res.messages);
        })
        .finally(() => setDisabled(false));
    }
  }, [email]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <>
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="application/pdf"
        onChange={() => {
          const fileInput = document.getElementById(
            "fileInput"
          ) as HTMLInputElement;
          if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
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
          /*const loadingToast = */
          toast({
            duration: 10000,
            description: "Adding your PDF to AI's knowledge...",
          });
          fetch("/api/upsert", {
            method: "POST",
            body: formData,
          }).then((res) => {
            // loadingToast.dismiss();
            if (res.ok) {
              toast({
                duration: 2000,
                description: "Added the PDF to AI's knowledge succesfully.",
              });
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

      <div className="flex flex-column items-start justify-between">
        <h6 className="font-bold"> DocWhisperer</h6>
      </div>
      <div
        className="mx-auto flex w-full flex-col overflow-y-auto  "
        style={{
          maxHeight: "calc(100vh - 400px)",
          paddingBottom: "8px",
          maxWidth: "calc(100vw - 100px)",
          margin: "0 auto",
          padding: "0",
        }}
      >
        {email ? (
          disabled ? (
            <div className="mt-8 flex flex-col gap-y-2">
              <div className="h-[30px] animate-pulse bg-black/10" />
              <div className="h-[30px] animate-pulse bg-black/10" />
              <div className="h-[30px] animate-pulse bg-black/10" />
            </div>
          ) : (
            messages.map(({ content }, idx) => (
              <MemoizedMD key={idx} message={content} />
            ))
          )
        ) : (
          <div className="mt-8 flex max-w-max flex-col justify-center">{}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="fixed bottom-0  mb-20 flex w-full max-w-[82vw] flex-row items-center shadow sm:max-w-md">
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
          disabled={disabled}
          className="!rounded-none align-content: center"
          onChange={handleInputChange}
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key.toLowerCase() == "enter") handleSubmit();
          }}
        />
      </div>
    </>
  );
};

export { Chat };
