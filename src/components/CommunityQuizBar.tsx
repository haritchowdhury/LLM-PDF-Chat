import CommunityQuizForm from "@/components/CommunityQuizForm";
import { abi, contractAddresses } from "@/creators-constants";
import { useAccount, useChainId } from "wagmi";
import { useToast } from "@/hooks/use-toast";
//import { z } from "zod";
//import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { readContract } from "@wagmi/core";
import { config } from "@/wagmi";
import { ConnectWallet } from "@/components/wallet/connect";
import { motion } from "framer-motion";
import CreateCommunityMilestones from "@/components/CreateCommunityMilestones";
import { useRouter } from "next/navigation";

type Props = {
  upload: string;
  sessionId: string;
  namespace: string;
  showLoader: any;
  setShowLoader: any;
  userId: string;
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
const CommunityQuizBar = ({
  upload,
  sessionId,
  namespace,
  showLoader,
  setShowLoader,
  userId,
}: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [quizExists, setQuizExists] = useState(false);
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
      router.push("/");
    }
  }, [chainId]);

  useEffect(() => {
    /*const interval = setInterval(() => {*/
    async function getProductDetails() {
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
        functionName: "getIdentifier",
        args: [upload],
        account: address,
        //args: [],
      })) as any;
      if (result.creator !== "0x0000000000000000000000000000000000000000") {
        setQuizExists(true);
      }
      console.log(result.creator, quizExists, result.fans);
    }
    getProductDetails();
    console.log(quizExists);

    /*  }, 1000); */

    //return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
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
          args: [`${upload}_${userId}`],
          account: address,
        })) as MileStone;
        // console.log("milestone", result);
        if ((result?.creator as any) == address && isConnected) {
          setLockedIn(true);
        } else {
          setLockedIn(false);
        }
        setLoadingMilestones(false);
        console.log("milestone details", result);
      }
      getUserDetails();
    }, 5000);

    return () => clearInterval(interval);
  }, [isConnected, upload, mileStonesAddress, chainId]);

  return (
    <div>
      {!isConnected && (
        <>
          <div className="bg-black gap-3 text-white border-none w-full p-4 flex flex-col items-center">
            <div>Connect Wallet to Access Quiz!</div>
          </div>
          <hr className="m-0 border-gray-800" />
        </>
      )}
      {isConnected && loadingMilestones ? (
        <div className="p-4 flex justify-center">
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {isConnected && !quizExists && (
            <>
              <div className="bg-black gap-3 text-white border-none w-full p-4 flex flex-col items-center">
                <div>Creator has not published Quizzes for this article!</div>
              </div>
              <hr className="m-0 border-gray-800" />
            </>
          )}
          {isConnected && quizExists && !lockedIn && (
            <>
              <div className="w-full px-2 py-8 bg-black">
                <CreateCommunityMilestones id={upload} userId={userId} />
              </div>
              <hr className="m-0 border-gray-800" />
            </>
          )}
          {isConnected && quizExists && lockedIn && (
            <>
              <CommunityQuizForm
                topic={""}
                id={upload}
                showLoader={showLoader}
                setShowLoader={setShowLoader}
              />
              <hr className="m-0 border-gray-800" />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CommunityQuizBar;
