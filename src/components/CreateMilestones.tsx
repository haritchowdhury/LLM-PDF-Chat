"use client";
import { abi, contractAddresses } from "@/constants";
import { readContract, writeContract } from "@wagmi/core";
import { useAccount, useChainId, useReadContract, useDisconnect } from "wagmi";
import { config } from "@/wagmi";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { parseUnits } from "viem";

type Upload = {
  id: string;
  sessionId: string;
  namespace: string;
};
const milestoneSchema = z.object({
  id: z.string().min(1),
});
type Input = z.infer<typeof milestoneSchema>;

const CreateMilestones = ({ id, sessionId, namespace }: Upload) => {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const { address, isConnected } = useAccount();
  const [fee, setFee] = useState<bigint>();
  const chainId = useChainId();
  const mileStonesAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;
  if (!mileStonesAddress) {
    router.push("/");
    toast({
      title: "Error",
      description: "Contract is not deployed on this chain!",
      variant: "destructive",
    });
    disconnect();
  }
  //console.log("claim Milestone", mileStonesAddress, chainId);
  const { mutate: setMileStones, status } = useMutation({
    mutationFn: async ({ id }: Input) => {
      console.log("id:", id, fee);
      const result = await readContract(config, {
        abi,
        address: mileStonesAddress,
        functionName: "getPrice",
        args: [],
        chainId: chainId,
        account: address,
      } as any);
      const price = String(Number(result));
      console.log("price:", typeof result, result);
      await writeContract(config, {
        abi,
        address: mileStonesAddress,
        functionName: "lockFunds",
        args: [id],
        value: ethers.parseEther(price),
      } as any);
      console.log("mutation:", result);
    },
  });

  const form = useForm<Input>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      id: id || "",
    },
  });

  const onSubmit = async (data: Input) => {
    setMileStones(data, {
      onError: (error) => {
        console.log(error);
        toast({
          title: "Error",
          description: "Something went wrong. Could not Lock In!",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        setTimeout(() => {
          toast({
            title: "Success",
            description:
              "Milestones Unlocked succesfully! Now you can generate topics.",
            variant: "default",
          });
          router.push(`/chat/${id}/${sessionId}/${namespace}`);
        }, 2000);
      },
    });
  };
  form.watch();
  return (
    <Card className="border-none bg-black text-white fixed top-20 p-0 left-1/2 -translate-x-1/2 w-[350px]">
      <form
        className="flex w-full pt-1 items-center justify-center"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Button
          disabled={status === "pending"}
          type="submit"
          onClick={() => {
            form.setValue("id", id);
          }}
        >
          Activate Milestones
        </Button>
      </form>
    </Card>
  );
};

export default CreateMilestones;
