"use client";
import { abi, contractAddresses } from "@/creators-constants";
import { readContract /*, writeContract */ } from "@wagmi/core";
import {
  useAccount,
  useChainId,
  /* useDisconnect,
  useReadContract,
  useWriteContract, */
} from "wagmi";
import { config } from "@/wagmi";
import { useEffect, useState } from "react";
/*import {
  Card,
    CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
} from "@/components/ui/card";*/
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { withdrawlSchema } from "@/schemas/forms/quiz";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { ConnectWallet } from "@/components/wallet/connect";
import { motion } from "framer-motion";

type Input = z.infer<typeof withdrawlSchema>;

const Withdrawl = () => {
  const router = useRouter();
  //const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [stringBalance, setStringBalance] = useState<string>();
  const chainId = useChainId();
  const [mileStonesAddress, setMileStoneAddress] = useState(
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  );
  const [loading, setLoading] = useState(true);
  const form = useForm<Input>({
    resolver: zodResolver(withdrawlSchema),
    defaultValues: {
      value: "",
    },
  });
  const { mutate: getWithdrawl, status } = useMutation({
    mutationFn: async ({ value }: Input) => {
      const EthValue = ethers.parseEther(value);
      if (EthValue > balance) {
        throw new Error("Entered amount more than account balance");
      }
      console.log("atclient", value);
      const provider = new ethers.BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const contract = new ethers.Contract(mileStonesAddress, abi, signer);
      try {
        const tx = await contract.creatorsWithdrawl(EthValue);
        await tx.wait();
        console.log("Transaction successful:", tx);
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
          functionName: "getBalance",
          account: address,
          //args: [],
        })) as any;
        console.log(typeof ethers.formatEther(result.balance));
        setBalance(result.balance);
        setStringBalance(ethers.formatEther(result.balance));
        setLoading(false);
      }
      getUserDetails();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: Input) => {
    getWithdrawl(data, {
      onError: (error) => {
        console.log("error", error, typeof Error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Funds Withdrawn succesfully",
        });
        router.refresh();
      },
    });
  };
  form.watch();

  return (
    <>
      {loading ? (
        <div className="flex gap-4 items-center justify-center bg-gray-900 rounded p-4">
          <small>Loading</small>
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-row items-center justify-center gap-8 p-4  rounded">
          {isConnected ? (
            <>
              <small>Your Balance: {stringBalance}</small>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="flex flex-col sm:flex-row w-full gap-2">
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem className="flex-grow mb-0">
                          <FormControl className="bg-gray-200 text-black">
                            <Input placeholder="Withdraw amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button disabled={status === "pending"} type="submit">
                      Withdraw
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          ) : (
            <>
              <div className="flex flex-row items-center justify-center gap-8 p-4  rounded">
                <div>
                  <ConnectWallet />
                </div>
                <div>Connect Wallet to access finances!</div>
              </div>
              <hr className="m-0 border-gray-800" />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default Withdrawl;
