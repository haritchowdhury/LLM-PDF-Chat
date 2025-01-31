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

import QuizForm from "@/components/quizForm";
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
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();

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
      <input
        type="file"
        id="fileInput"
        className="hidden "
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
          //setDisabled(true);
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
              setTimeout(() => {
                //window.location.reload();
                router.refresh();
              }, 10000);
              //router.refresh();
              //setDisabled(false);
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
      {!messages.length ? (
        <p className="text-white"> Upload a document to start a conversation</p>
      ) : (
        <></>
      )}

      <div
        className="mx-auto flex w-full flex-col overflow-y-auto  "
        style={{
          maxHeight: "clamp(300px, 100vh - 320px, 900px)",
          paddingBottom: "8px",
          paddingTop: "8px",
          maxWidth: "clamp(300px, 100vw - 420px, 900px)",
          margin: "0 auto",
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
              <div
                key={idx}
                className={clsx(
                  "font-sans-semibold text-sm prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 mt-4 w-full break-words pt-0.1",
                  idx % 2 == 0
                    ? "text-white bg-black self-end p-2 rounded-lg text-justify"
                    : "text-white bg-gray-900 self-start p-2 rounded-lg text-justify"
                )}
              >
                {" "}
                {content}
              </div>
            ))
          )
        ) : (
          <div className="mt-8 flex max-w-max flex-col justify-center">{}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="fixed bottom-0  mb-20 flex w-full  flex-row items-center justify-center shadow left-0 right-0">
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
          style={{ maxWidth: "clamp(300px, 100vw - 420px, 900px)" }}
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
/*<>
          <div className=" fixed top-40 flex  items-start">
            <h6 className="font-bold text-white  px-2 rounded-lg ">
              DocWhisperer
            </h6>
          </div>
          <div style={{ maxWidth: "clamp(300px, 100vw - 100px, 900px)" }}>
            <QuizForm />{" "}
          </div>
        </> */
