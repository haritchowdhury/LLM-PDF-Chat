"use client";
import { abi, contractAddresses } from "@/creators-constants";
import { readContract /*, writeContract */ } from "@wagmi/core";
import {
  useAccount,
  useChainId,
  useDisconnect,
  /* useReadContract,
  useWriteContract, */
} from "wagmi";
import { config } from "@/wagmi";
import { useEffect, useState } from "react";
import {
  Card,
  /*  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, */
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
//import { parseUnits } from "viem";
import axios, { AxiosError } from "axios";

type Upload = {
  id: string;
  userId: string;
};
const milestoneSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
type Input = z.infer<typeof milestoneSchema>;

const CreateCommunityMilestones = ({ id, userId }: Upload) => {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();

  const { address, isConnected } = useAccount();
  const [fee, setFee] = useState<bigint>();
  const chainId = useChainId();
  const [mileStonesAddress, setMileStoneAddress] = useState(
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  );
  const form = useForm<Input>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      id: id || "",
      userId: userId || "",
    },
  });
  const { mutate: setMileStones, status } = useMutation({
    mutationFn: async ({ id, userId }: Input) => {
      //console.log("id:", id, fee);
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
      /*  await writeContract(config, {
        abi,
        address: mileStonesAddress,
        functionName: "lockFunds",
        args: [id],
        value: ethers.parseEther(price),
        overrides: {
          gasLimit: ethers.toBigInt(500000),
          gasPrice: ethers.parseUnits("50", "gwei"),
        },
      } as any); */
      const priceInEth = String(ethers.formatEther(price));
      console.log("price in ETH:", priceInEth, typeof priceInEth, price);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(mileStonesAddress, abi, signer);
      try {
        const tx = await contract.lockFunds(`${id}_${userId}`, id, {
          value: ethers.parseEther(priceInEth),
          gasLimit: ethers.toBigInt(500000),
        });
        await tx.wait();
        const upload = id;
        const response = await axios.post("/api/communityTopics", {
          upload,
        });
        console.log("Transaction successful:", tx, response);
      } catch (error) {
        console.log("error", error);
        throw new Error("Transaction failed");
      }
    },
  });

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
  //console.log("claim Milestone", mileStonesAddress, chainId);

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
          router.push(`/chat/${id}`);
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
            form.setValue("userId", userId);
          }}
        >
          Activate Milestones
        </Button>
      </form>
    </Card>
  );
};

export default CreateCommunityMilestones;
