"use client";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { useState, useEffect } from "react";
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
import { TopicCreationButton } from "@/components/TopicCreation";
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";

type Props = {
  topic: string;
  id: string;
  showLoader: any;
  setShowLoader: any;
};

type Input = z.infer<typeof quizCreationSchema>;

const QuizForm = ({
  topic: topicParam,
  showLoader,
  setShowLoader,
  id: uploadId,
}: Props) => {
  const router = useRouter();
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [topicsCreated, setTopicsCreated] = useState(false);
  const { toast } = useToast();
  const { mutate: getQuestions, status } = useMutation({
    mutationFn: async ({ amount, topic, id }: Input) => {
      console.log("atclient", amount, topic, id);
      const response = await axios.post("/api/game", {
        amount,
        topic,
        id,
      });
      return response.data;
    },
  });
  const [topics, setTopics] = useState([]);
  const [completed, setCompleted] = useState([]);
  const form = useForm<Input>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      topic: topicParam || "",
      amount: 3,
      id: uploadId || "",
    },
  });

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch("/api/topics").then((res) => res.json());
        setTopics(res.topics);
        setCompleted(res.completed);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
      setTopicsCreated(true);
    };

    fetchTopics();

    const interval = setInterval(fetchTopics, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log("Updated topics:", topics);
    console.log("Updated completed:", completed);
  }, [topics, completed]);

  useEffect(() => {
    if (uploadId) {
      console.log("Setting uploadId in form:", uploadId);
      form.setValue("id", uploadId);
    }
  }, [uploadId]);

  const onSubmit = async (data: Input) => {
    console.log("submitted data", data);
    setShowLoader(true);
    getQuestions(data, {
      onError: (error) => {
        setShowLoader(false);
        if (error instanceof AxiosError) {
          if (error.response?.status === 500) {
            toast({
              title: "Error",
              description:
                "Could not create a quiz, make sure the topic is present in the documnet.",
              variant: "destructive",
            });
          }
        }
      },
      onSuccess: ({ gameId }: { gameId: string }) => {
        console.log("gameid", gameId);
        if (!gameId) {
          console.error("gameId is missing!");
          return;
        }
        setFinishedLoading(true);
        setTimeout(() => {
          router.push(`/play/mcq/${gameId as string}`);
        }, 2000);
      },
    });
  };
  form.watch();

  return showLoader ? (
    <div className="flex gap-4 items-center justify-center bg-gray-900 rounded p-4">
      <small>Creating Quiz</small>
      <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ) : (
    <Card className="border-none w-full bg-black mb-0 pb-0 overflow-hidden">
      <div className="bg-black pb-0 mb-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col sm:flex-row w-full gap-2 p-2">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem className="flex-grow mb-0">
                    <FormControl className="bg-gray-200 text-black">
                      <Input placeholder="Quiz topic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-24 mb-0">
                    <FormControl className="bg-gray-200 text-black">
                      <Input
                        placeholder="# Q's"
                        type="number"
                        {...field}
                        onChange={(e) => {
                          form.setValue(
                            "amount",
                            parseInt(e.target.value) || 3
                          );
                        }}
                        min={3}
                        max={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={status === "pending"} type="submit">
                Quiz
              </Button>
            </div>
          </form>
        </Form>

        {!topicsCreated && (
          <div className="flex justify-center p-2">
            <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {!(topics?.length > 0) && topicsCreated && (
          <div className="p-2">
            <TopicCreationButton />
          </div>
        )}

        {topics?.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 justify-center rounded-md">
            {topics.map((topic, idx) => {
              const milestones: boolean[] = JSON.parse(completed as any) as any;
              const isCompleted = milestones[idx];

              return (
                <Button
                  key={topic}
                  variant="outline"
                  size="sm"
                  className={`m-0 border-none hover:bg-gray-700 ${
                    !isCompleted
                      ? "bg-gray-300 text-gray-800"
                      : "bg-gray-600 text-gray-100"
                  }`}
                  onClick={() => {
                    form.setValue("topic", topic);
                    form.setValue("amount", 5);
                  }}
                >
                  {topic}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default QuizForm;
