"use client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

type Upload = {
  id: string;
  topic: string;
};
const milestoneSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
});
type Input = z.infer<typeof milestoneSchema>;

const ClaimMilestones = ({ id, topic }: Upload) => {
  const router = useRouter();
  const { toast } = useToast();

  const { mutate: updateMilestones, status } = useMutation({
    mutationFn: async ({ id, topic }: Input) => {
      console.log("id:", id);
      const response = await axios.put("/api/topics", {
        topic: topic,
        upload: id,
      });
    },
  });

  const form = useForm<Input>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      id: id || "",
      topic: topic || "",
    },
  });

  const onSubmit = async (data: Input) => {
    updateMilestones(data, {
      onError: (error) => {
        console.log(error);
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
          router.push(`/chat/${id}`);
        }, 2000);
      },
    });
  };
  form.watch();

  return (
    <div className="border-none">
      <form className="flex flex-grow" onSubmit={form.handleSubmit(onSubmit)}>
        <Button
          disabled={status === "pending"}
          type="submit"
          onClick={() => {
            form.setValue("id", id);
            form.setValue("topic", topic);
          }}
        >
          Claim Milestones
        </Button>
      </form>
    </div>
  );
};

export default ClaimMilestones;
