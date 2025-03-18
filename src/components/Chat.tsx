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
import QuizForm from "@/components/QuizForm";
import { abi, contractAddresses } from "@/constants";
import { readContract } from "@wagmi/core";
import { useAccount, useChainId, useDisconnect, useReadContract } from "wagmi";
import { config } from "@/wagmi";
import CreateMilestones from "@/components/CreateMilestones";
import { ConnectWallet } from "@/components/wallet/connect";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/MarkDown";
//import { chatSession } from "@/schemas/chat/chatsession";
//import { z } from "zod";

type User = {
  email: string;
  upload: string;
  sessionId: string;
  namespace: string;
};

interface MileStone {
  createdAt: bigint;
  creator: string;
  endsAt: bigint;
  isCompleted: boolean;
  milestoneCompleted: bigint;
  totalAmount: bigint;
  totalMilestones: bigint;
}

const articleDict = {
  AttentionIsAllYouNeed:
    "Ask from the groundbreaking article on transformers 'Attention is All You Need' " +
    "by Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, " +
    "Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin",
  bitcoinWhitepaper: "Ask from the Bitcoin Whitepaper",
};

const Chat = ({ email, upload, sessionId, namespace }: User) => {
  // console.log("clent side:", upload);
  const { disconnect } = useDisconnect();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const router = useRouter();
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

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [id, setId] = useState<string | undefined>();
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState();
  const [showLoader, setShowLoader] = useState(false);
  const [lockedIn, setLockedIn] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [mileStonesAddress, setMileStoneAddress] = useState(
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  );

  useEffect(() => {
    if (chainId in contractAddresses) {
      setMileStoneAddress(contractAddresses[chainId][0]);
    } else {
      setMileStoneAddress(null);
      toast({
        duration: 2000,
        variant: "destructive",
        description: "Contract not deployed on this chain.",
      });
    }
  }, [chainId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setId(upload);

      async function getUserDetails() {
        // console.log(mileStonesAddress);
        if (!mileStonesAddress) {
          toast({
            duration: 2000,
            variant: "destructive",
            description: "Contract not deployed on this chain.",
          });
        }
        const result = (await readContract(config, {
          abi,
          address: mileStonesAddress,
          functionName: "getUserMilestoneDetails",
          args: [upload],
        })) as MileStone;
        //console.log("user deets", result.creator, address, result, id, upload);
        if ((result?.creator as any) == address && isConnected) {
          setLockedIn(true);
        } else {
          setLockedIn(false);
        }
        setLoadingMilestones(false);
      }
      getUserDetails();
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, upload, mileStonesAddress]);

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
    scrollToBottom();
  }, [messages, setMessages]);

  return (
    <>
      {disabled ? (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-4 flex-row bg-gray-900 rounded p-4">
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-4">
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
                formData.append("sessionId", sessionId);
                formData.append("namespace", namespace);
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
                        router.refresh();
                        router.replace(
                          `/chat/${data.message}/${sessionId}/${namespace}`
                        );
                      }, 100);
                      setMessages([]);
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
                      description: "Something went wrong!",
                    });
                    setDisabled(false);
                  });
              }}
            />

            {/* Wallet/Quiz Section - Dynamically sized */}
            {!Object.keys(articleDict).includes(upload) && (
              <>
                {!isConnected && (
                  <div className="bg-black gap-3 text-white border-none w-full p-4 flex flex-col items-center">
                    <div>
                      <ConnectWallet />
                    </div>
                    <small>Connect Wallet to Access Quiz!</small>
                  </div>
                )}
                {isConnected && (
                  <>
                    <CardContent className="text-white bg-black flex-shrink-0 flex justify-center items-center p-0 pb-0 mb-0">
                      {lockedIn && isConnected && !loadingMilestones && (
                        <div className="w-full px-2 py-4 bg-black">
                          <QuizForm
                            topic={""}
                            id={upload}
                            showLoader={showLoader}
                            setShowLoader={setShowLoader}
                          />
                        </div>
                      )}
                      {isConnected && loadingMilestones && !lockedIn && (
                        <div className="p-4 flex justify-center">
                          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                      )}
                      {isConnected &&
                        !loadingMilestones &&
                        !lockedIn &&
                        upload != "undefined" && (
                          <div className="w-full px-2 py-8 bg-black">
                            <CreateMilestones
                              id={upload}
                              sessionId={sessionId}
                              namespace={namespace}
                            />
                          </div>
                        )}
                    </CardContent>
                  </>
                )}
              </>
            )}

            <hr className="m-0 border-gray-800" />

            {/* Messages Section - Takes available space */}
            <CardContent className="bg-gray-1000 rounded p-4 flex-grow overflow-hidden">
              <div className="h-full overflow-y-auto rounded flex-grow custom-scrollbar">
                {!messages?.length ? (
                  Object.keys(articleDict).includes(upload) ? (
                    <p className="p-4 rounded bg-gray-400 text-gray-100">
                      {articleDict[upload]}
                    </p>
                  ) : (
                    <p className="p-4 rounded bg-gray-400 text-gray-100">
                      Upload a document and ask something
                    </p>
                  )
                ) : (
                  <></>
                )}
                {disabled ? (
                  <div className="text-gray-1000 flex gap-4 flex-row justify-center p-4">
                    <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
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
                <div ref={messagesEndRef} className="h-0" />
              </div>
            </CardContent>

            {/* Input Section - Fixed height at bottom */}
            {!showLoader && (
              <CardContent className="p-2 bg-black flex-shrink-0">
                <div className="flex w-full flex-row items-center justify-center bg-black">
                  {!Object.keys(articleDict).includes(upload) && (
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
