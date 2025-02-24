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
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/wallet/connect";
import { motion } from "framer-motion";

type User = {
  email: string;
  upload: string;
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

const Chat = ({ email, upload }: User) => {
  console.log("clent side:", upload);
  const { disconnect } = useDisconnect();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const router = useRouter();
  if (!email) {
    router.push("/sign-in");
  }
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [id, setId] = useState<string | undefined>();
  const { toast } = useToast();
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(true);
  // const [uploaded, setUploaded] = useState(false);
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
        console.log(mileStonesAddress);
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
        console.log("user deets", result.creator, address, result, id, upload);
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
        <CardContent className="top-20 flex gap-4 flex-row fixed bg-gray-900 rounded p-4 left-1/2 -translate-x-1/2">
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </CardContent>
      ) : (
        <Card className="max-w-full md:max-w-2xl mx-auto shadow-lg bg-black border-none">
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
              toast({
                duration: 10000,
                description: "Adding your PDF to AI's knowledge...",
              });
              fetch("/api/upsert", {
                method: "POST",
                body: formData,
              }).then((res) => {
                if (res.ok) {
                  toast({
                    duration: 2000,
                    description: "Added the PDF to AI's knowledge succesfully.",
                  });
                  setTimeout(() => {
                    router.refresh();

                    router.replace("/");
                  }, 100);
                  setMessages([]);
                  setDisabled(false);
                } else {
                  toast({
                    duration: 2000,
                    variant: "destructive",
                    description: "Failed to add the PDF to AI's knowledge.",
                  });
                  setDisabled(false);
                }
              });
            }}
          />
          <CardContent className="text-white h-full flex justify-center items-center p-0 ">
            {isConnected && (
              <>
                {lockedIn && isConnected && !loadingMilestones && (
                  <QuizForm
                    topic={""}
                    id={upload}
                    showLoader={showLoader}
                    setShowLoader={setShowLoader}
                  />
                )}
                {isConnected && loadingMilestones && !lockedIn && (
                  <CardContent className="top-20 flex gap-4 flex-row fixed bg-gray-900 rounded p-4 left-1/2 -translate-x-1/2">
                    <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  </CardContent>
                )}
                {isConnected && !loadingMilestones && !lockedIn && (
                  <CreateMilestones id={upload} />
                )}
              </>
            )}
            {!isConnected && !loadingMilestones && (
              <div className="bg-black gap-3 text-white border-none fixed top-20 p-0 left-1/2 -translate-x-1/2 w-[275px]">
                <div>
                  <ConnectWallet />{" "}
                </div>
                <small className="flex justify-center">
                  Connect Wallet to Access Quiz!
                </small>
              </div>
            )}
          </CardContent>
          <CardContent className=" bg-gray-1000 rounded p-4">
            <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
              {!messages?.length ? (
                <p className="p-4 rounded  bg-gray-500 text-gray-100">
                  {" "}
                  Upload a document and ask something
                </p>
              ) : (
                <></>
              )}
              {disabled ? (
                <CardContent className="text-gray-1000 flex gap-4 flex-row fixed bg-gray-900 rounded p-4 left-1/2 -translate-x-1/2">
                  <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                </CardContent>
              ) : (
                messages.map(({ content }, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "font-sans-semibold text-sm p-2 rounded-lg text-justify mt-1",
                      idx % 2 == 0
                        ? "text-white bg-black self-end"
                        : "text-gray-100 bg-gray-500 self-start"
                    )}
                  >
                    {content}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} className="h-0" />
            </div>
          </CardContent>
          {!showLoader ? (
            <>
              {" "}
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
            </>
          ) : (
            <></>
          )}
        </Card>
      )}
    </>
  );
};
export { Chat };
