"use client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardDescription } from "@/components/ui/card";
import axios, { AxiosError } from "axios";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { motion } from "framer-motion";

const schema = z.object({});
type Input = z.infer<typeof schema>;
type Upload = {
  upload: string;
};
const CommunityTopicCreationButton = ({ upload }: Upload) => {
  const { toast } = useToast();
  const [created, setCreated] = useState(true);
  const form = useForm<Input>();
  const { mutate: getTopics, status } = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/communityTopics", {
        upload,
      });
      return response.data;
    },
  });

  const onSubmit = async (data: Input) => {
    console.log(data);
    setCreated(false);
    getTopics(undefined, {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Something went wrong. Could not Create topics!",
          variant: "destructive",
        });
        setCreated(true);
      },
      onSuccess: () => {
        setTimeout(() => {
          toast({
            title: "Success",
            description: "Topics created succesfully!",
            variant: "default",
          });
          setCreated(true);
        }, 2000);
      },
    });
  };
  form.watch();

  return (
    <Card className="border-none bg-black text-white">
      {!created ? (
        <CardDescription className="mb-0">
          {" "}
          <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </CardDescription>
      ) : (
        <form
          className="flex w-full pt-1 items-center justify-center"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Button disabled={status === "pending"} type="submit">
            Generate Topics
          </Button>
        </form>
      )}
    </Card>
  );
};

export { CommunityTopicCreationButton };
