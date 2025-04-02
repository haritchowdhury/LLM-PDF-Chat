"use client";
import { abi, contractAddresses } from "@/creators-constants";
import { /*readContract,*/ writeContract } from "@wagmi/core";
import {
  useAccount,
  useChainId,
  useDisconnect,
  /* useReadContract,
  useWriteContract, */
} from "wagmi";
import { config } from "@/wagmi";
import { useState, useEffect } from "react";
/*import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; */
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { ethers } from "ethers";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

type Upload = {
  id: string;
  ix: number;
  sessionId: string;
  namespace: string;
  upload: string;
};
const milestoneSchema = z.object({
  id: z.string().min(1),
  ix: z.number(),
});
type Input = z.infer<typeof milestoneSchema>;

const ClaimCommunityMilestones = ({
  id,
  ix,
  sessionId,
  namespace,
  upload,
}: Upload) => {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [lockedIn, setLockedIn] = useState(false);
  const chainId = useChainId();
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

  if (!mileStonesAddress) {
    router.push("/");
    toast({
      title: "Error",
      description: "Contract is not deployed on this chain!",
      variant: "destructive",
    });
    disconnect();
  }

  const { mutate: updateMilestones, status } = useMutation({
    mutationFn: async ({ id, ix }: Input) => {
      console.log("id:", id);
      const data = await writeContract(config, {
        address: mileStonesAddress as `0x${string}`,
        abi,
        functionName: "completeMilestone",
        args: [id as string],
        value: ethers.parseEther("0"),
        account: address,
      } as any);
      const response = await axios.put("/api/communityTopics", {
        ix,
        upload,
      });
    },
  });

  const form = useForm<Input>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      id: id || "",
      ix: ix || 0,
    },
  });

  const onSubmit = async (data: Input) => {
    updateMilestones(data, {
      onError: (error) => {
        console.log(error);
        setLockedIn(true);
        toast({
          title: "Error",
          description: "Something went wrong. Could not Claim Milestone!",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        setTimeout(() => {
          toast({
            title: "Success",
            description: "Milestone claimed succesfully!",
            variant: "default",
          });
          router.push(`/chat/${upload}`);
        }, 2000);
      },
    });
  };
  form.watch();

  return (
    isConnected &&
    !lockedIn && (
      <div className="border-none">
        <form className="flex flex-grow" onSubmit={form.handleSubmit(onSubmit)}>
          <Button
            disabled={status === "pending"}
            type="submit"
            onClick={() => {
              form.setValue("id", id);
              form.setValue("ix", ix);
            }}
          >
            Claim Milestones
          </Button>
        </form>
      </div>
    )
  );
};

export default ClaimCommunityMilestones;
