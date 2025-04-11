"use client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Eraser } from "lucide-react";
type Upload = {
  upload: string;
};

const milestoneSchema = z.object({
  upload: z.string().min(1),
});

type Input = z.infer<typeof milestoneSchema>;

const Erase = ({ upload }: Upload) => {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<Input>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      upload: upload || "",
    },
  });
  const { mutate: deleteChat, status } = useMutation({
    mutationFn: async ({ upload }: Input) => {
      const response = await fetch("/api/upsert", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upload: upload, type: "erase" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not be Erased");
      }

      return await response.json();
    },
  });

  const onSubmit = async (data: Input) => {
    deleteChat(data, {
      onError: (error) => {
        console.log(error);
        toast({
          title: "Error",
          description: "Something went wrong. Could not Erased!",
          variant: "destructive",
        });
      },
      onSuccess: (data) => {
        setTimeout(() => {
          toast({
            title: "Success",
            description: "Namespace erased successfully!",
            variant: "default",
          });
          router.push(`/profile/${data.userId}`);
        }, 2000);
      },
    });
  };

  return (
    <div className="border-none ">
      <form className="flex flex-grow" onSubmit={form.handleSubmit(onSubmit)}>
        <Button
          disabled={status === "pending"}
          type="submit"
          onClick={() => {
            form.setValue("upload", upload);
          }}
        >
          <Eraser />
        </Button>
      </form>
    </div>
  );
};

export default Erase;
