"use client";
import { useEffect, useState } from "react";
import { abi, contractAddresses } from "@/constants";
import { useAccount, useChainId } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { readContract } from "@wagmi/core";
import { config } from "@/wagmi";
import CreateMilestones from "@/components/CreateMilestones";
import { ConnectWallet } from "@/components/wallet/connect";
import QuizForm from "@/components/QuizForm";
import { CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type Props = {
  upload: string;
  sessionId: string;
  namespace: string;
  showLoader: any;
  setShowLoader: any;
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
const PersonalQuizBar = ({
  upload,
  sessionId,
  namespace,
  showLoader,
  setShowLoader,
}: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [mileStonesAddress, setMileStoneAddress] = useState(
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  );
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [lockedIn, setLockedIn] = useState(false);
  const [id, setId] = useState<string | undefined>();

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
      router.push("/");
    }
  }, [chainId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setId(upload);

      async function getUserDetails() {
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
        if ((result?.creator as any) == address && isConnected) {
          setLockedIn(true);
        } else {
          setLockedIn(false);
        }
        setLoadingMilestones(false);
      }
      getUserDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, upload, mileStonesAddress, chainId]);

  return (
    <>
      {!isConnected && upload !== "undefined" && (
        <>
          <div className="bg-black gap-3 text-white border-none w-full p-4 flex flex-col items-center">
            <div>
              <ConnectWallet />
            </div>
            <small>Connect Wallet to Access Quiz!</small>
          </div>
          <hr className="m-0 border-gray-800" />
        </>
      )}
      {isConnected && (
        <>
          <CardContent className="text-white bg-black flex-shrink-0 flex justify-center items-center p-0 pb-0 mb-0">
            {lockedIn &&
              isConnected &&
              !loadingMilestones &&
              upload !== "undefined" && (
                <div className="w-full px-2 py-4 bg-black">
                  <QuizForm
                    topic={""}
                    id={upload}
                    showLoader={showLoader}
                    setShowLoader={setShowLoader}
                  />
                  <hr className="m-0 border-gray-800" />
                </div>
              )}
            {isConnected && loadingMilestones && !lockedIn && (
              <div className="p-4 flex justify-center">
                <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <hr className="m-0 border-gray-800" />
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
  );
};

export default PersonalQuizBar;
