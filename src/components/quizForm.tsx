"use client";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, CopyCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios, { AxiosError } from "axios";
type Props = {
  topic: string;
};

type Input = z.infer<typeof quizCreationSchema>;

const QuizForm = ({ topic: topicParam }: Props) => {
  const router = useRouter();
  const [showLoader, setShowLoader] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const { toast } = useToast();
  const { mutate: getQuestions, status } = useMutation({
    mutationFn: async ({ amount, topic, type }: Input) => {
      console.log(type);
      const response = await axios.post("/api/game", { amount, topic, type });
      return response.data;
    },
  });
  const form = useForm<Input>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      topic: topicParam,
      type: "mcq",
      amount: 3,
    },
  });
  form.watch();
  return (
    <>
      {/*<div className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2"> */}
      <Card className="fixed top-20">
        <Form {...form}>
          <form
            className="flex  grid-cols-3 flex-row w-full "

            /*onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" */
          >
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem className=" w-full">
                  <FormControl>
                    <Input placeholder="Enter a topic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem
                  className="w-full"
                  style={{ maxWidth: "calc(100vw - 300px)" }}
                >
                  <FormControl>
                    <Input
                      placeholder="How many questions?"
                      type="number"
                      {...field}
                      onChange={(e) => {
                        form.setValue("amount", parseInt(e.target.value));
                      }}
                      min={1}
                      max={9}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-between">
              <Button
                variant={
                  form.getValues("type") === "mcq" ? "default" : "secondary"
                }
                className="w-1/2 rounded-none rounded-l-lg"
                onClick={() => {
                  form.setValue("type", "mcq");
                }}
                type="button"
              >
                <CopyCheck className="w-4 h-4 mr-2" /> Multiple Choice
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant={
                  form.getValues("type") === "open_ended"
                    ? "default"
                    : "secondary"
                }
                className="w-1/2 rounded-none rounded-r-lg"
                onClick={() => form.setValue("type", "open_ended")}
                type="button"
              >
                <BookOpen className="w-4 h-4 mr-2" /> Open Ended
              </Button>
            </div>
            <Button /*disabled={}*/ type="submit">Submit</Button>
          </form>
        </Form>
      </Card>
      {/* </div> */}
    </>
  );
};

export default QuizForm;
