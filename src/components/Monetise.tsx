"use client";
//import { config } from "@/wagmi";
import { abi, contractAddresses } from "@/creators-constants";
import { useAccount, useChainId } from "wagmi";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  uploadId: string;
  userId: string;
};
const MonetiseSchema = z.object({
  uploadId: z.string().min(1),
});
type Input = z.infer<typeof MonetiseSchema>;

const Monetise = ({ uploadId, userId }: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [mileStonesAddress, setMileStoneAddress] = useState(
    chainId in contractAddresses ? contractAddresses[chainId][0] : null
  );
  const form = useForm<Input>({
    resolver: zodResolver(MonetiseSchema),
    defaultValues: {
      uploadId: uploadId || "",
    },
  });
  const { mutate: setMileStones, status } = useMutation({
    mutationFn: async ({ uploadId }: Input) => {
      console.log("upload Id", uploadId);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(mileStonesAddress, abi, signer);
      try {
        const tx = await contract.createProduct(uploadId);
        await tx.wait();
        console.log("Monetised succesfully:", tx);
      } catch (error) {
        console.log("error", error);
        throw new Error("Failed to Monetise");
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

  const onSubmit = async (data: Input) => {
    setMileStones(data, {
      onError: (error) => {
        console.log(error);
        toast({
          title: "Error",
          description: "Something went wrong. Could not Monetise!",
          variant: "destructive",
        });
      },
      onSuccess: () => {
        setTimeout(() => {
          toast({
            title: "Success",
            description: "Article Monetised Succesfully!",
            variant: "default",
          });
          router.replace(`/chat/${uploadId}`);
        }, 2000);
      },
    });
  };
  form.watch();

  return (
    <Card className="border-none bg-black text-white ">
      <form
        className="flex items-center justify-center"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Button
          disabled={status === "pending"}
          type="submit"
          onClick={() => {
            form.setValue("uploadId", uploadId);
          }}
        >
          Monetise
        </Button>
      </form>
    </Card>
  );
};

export default Monetise;
