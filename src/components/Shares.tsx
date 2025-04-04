"use client";
import { Upload } from "@prisma/client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { MessageSquareText } from "lucide-react";
import Delete from "@/components/Delete";
import Link from "next/link";
import ShareLinkModel from "@/components/ShareLink";
import { buttonVariants } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { abi, contractAddresses } from "@/creators-constants";
import { useAccount, useChainId } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { readContract } from "@wagmi/core";
import { config } from "@/wagmi";
import Monetise from "@/components/Monetise";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

type Props = {
  shares: Upload[];
  userId: string;
  currentUser: string;
  platformlink: string;
};
const Shares = ({ shares, userId, currentUser, platformlink }: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [mileStonesAddress, setMileStoneAddress] = useState(
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  );
  const [monetisedProducts, setMonetisedProducts] = useState([]);
  const [loadingShares, setLoadingShares] = useState(true);

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
    async function getUserDetails() {
      setMileStoneAddress(
        chainId in contractAddresses ? contractAddresses[chainId][0] : null
      );
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
        functionName: "getBalance",
        account: address,
      })) as any;
      setMonetisedProducts(result.identifier_list);
      setLoadingShares(false);
      console.log("shares:", result);
      console.log(result.identifier_list);
    }
    getUserDetails();
    /* }, 1000); */

    //return () => clearInterval(interval);
  }, [isConnected ?? false, mileStonesAddress ?? ""]);

  return (
    <>
      {loadingShares ? (
        <div className="flex gap-4 items-center justify-center bg-gray-900 rounded p-4">
          <small>Loading Shares</small>
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <Card className="p-3 bg-black border-gray-700 text-gray-200">
          <Card className="flex justify-center w-full bg-gray-800 text-gray-200 p-2 border-none font-bold">
            Published Articles
          </Card>
          <div className="flex flex-wrap sm:flex-row gap-2 mt-2">
            {!shares.length && (
              <div>
                <small>You have not shared anything yet!</small>
              </div>
            )}
            {shares.map((share) => (
              <div key={share.id} className="gap-1 flex flex-wrap">
                <Link href={`/chat/${share.id}`} className={buttonVariants()}>
                  {share.name.slice(0, 25)}
                  <MessageSquareText />
                </Link>
                {userId === currentUser && (
                  <Delete upload={share.id as string} />
                )}
                <ShareLinkModel link={`${platformlink}${share.id}`} />
                {isConnected && currentUser === userId ? (
                  <>
                    {!monetisedProducts ||
                    !monetisedProducts.includes(share.id) ? (
                      <Monetise uploadId={share.id} userId={currentUser} />
                    ) : (
                      <small className="text-white"> Monetised</small>
                    )}
                  </>
                ) : (
                  <></>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
};

export default Shares;
