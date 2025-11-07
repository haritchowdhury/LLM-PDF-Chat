"use client";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { CommunityTopicCreationButton } from "@/components/Quiz/CommunityTopicCreation";
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";

type Props = {
  topic: string;
  id: string;
};

type Input = z.infer<typeof quizCreationSchema>;

const CommunityQuizForm = ({ topic: topicParam, id: uploadId }: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const [showLoader, setShowLoader] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [topicsCreated, setTopicsCreated] = useState(false);
  const [topics, setTopics] = useState([]);
  const [completed, setCompleted] = useState([]);
  const { mutate: getCommunityQuestions, status } = useMutation({
    mutationFn: async ({ amount, topic, id }: Input) => {
      try {
        console.log("Mutation input:", { amount, topic, id });
        const response = await axios.post("/api/game", {
          amount,
          topic,
          id,
        });
        return response.data;
      } catch (error) {
        console.error("Mutation error:", error);
        throw error;
      }
    },
  });

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
        const res = await fetch(`/api/communityTopics?upload=${uploadId}`).then(
          (res) => res.json()
        );
        setTopics(JSON.parse(res?.topics) || []);
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
    if (uploadId) {
      form.setValue("id", uploadId);
    }
  }, [uploadId]);
  /*useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch(`/api/communityTopics?upload=${uploadId}`).then(
          (res) => res.json()
        );

        // Fix: Better handling of the topics parsing
        const topicsData = res?.topics;
        if (topicsData && topicsData !== "") {
          try {
            const parsedTopics = JSON.parse(topicsData);
            setTopics(Array.isArray(parsedTopics) ? parsedTopics : []);
          } catch (parseError) {
            console.error("Error parsing topics JSON:", parseError);
            console.log("Raw topics data:", topicsData); // This will help debug
            setTopics([]);
          }
        } else {
          setTopics([]);
        }

        setCompleted(res.completed);
      } catch (error) {
        console.error("Error fetching topics:", error);
        setTopics([]); // Set empty array on error
      }
      setTopicsCreated(true);
    };

    fetchTopics();
    const interval = setInterval(fetchTopics, 5000);
    return () => clearInterval(interval);
  }, [uploadId]); // Also added uploadId as dependency since you're using it */

  const onSubmit = async (data: Input) => {
    console.log("submitting data", data);
    setShowLoader(true);
    getCommunityQuestions(data, {
      onError: (error) => {
        setShowLoader(false);
        if (error.message === "Request failed with status code 429") {
          toast({
            title: "Error",
            description:
              "Could not create a quiz, you exceeded the number of quizzes you can take in a day.",
            variant: "destructive",
          });
        } else if (error instanceof AxiosError) {
          if (error.response?.status === 500) {
            toast({
              title: "Error",
              description:
                "Could not create a quiz, make sure the topic is present in the document.",
              variant: "destructive",
            });
          }
        }
      },
      onSuccess: ({ gameId }: { gameId: string }) => {
        if (!gameId) {
          return;
        }
        setFinishedLoading(true);
        // Redirect immediately - questions will be generated in background
        router.push(`/play/mcq/${gameId as string}`);
      },
    });
  };
  form.watch();

  return showLoader ? (
    <div className="flex gap-2 items-center justify-center bg-gray-900 rounded p-2 my-2 w-full">
      <small className="text-xs text-white">Creating Quiz</small>
      <motion.div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
    </div>
  ) : (
    <div className="w-full bg-transparent space-y-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem className="mb-0">
                <FormControl className="bg-gray-200 text-black rounded-md">
                  <Input
                    placeholder="Quiz topic"
                    {...field}
                    className="text-xs h-8"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="flex gap-2 items-center">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="w-16 mb-0">
                  <FormControl className="bg-gray-200 text-black rounded-md">
                    <Input
                      placeholder="# Q's"
                      type="number"
                      {...field}
                      onChange={(e) => {
                        form.setValue("amount", parseInt(e.target.value) || 3);
                      }}
                      min={3}
                      max={5}
                      className="text-xs h-8 px-2"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <Button
              disabled={status === "pending"}
              type="submit"
              size="sm"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "bg-gradient-to-b from-indigo-200  border-gray-300 text-gray-800 hover:bg-gray-800",
              })}
            >
              Create Quiz
            </Button>
          </div>
        </form>
      </Form>

      {!topicsCreated && (
        <div className="flex justify-center p-1">
          <motion.div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <div className="py-1">
        <CommunityTopicCreationButton upload={uploadId} />
      </div>

      {topics?.length > 0 && (
        <div className="flex flex-col gap-1 p-1 w-full">
          <p className="text-xs text-gray-400 font-medium">Topics:</p>
          <div className="flex flex-wrap gap-1">
            {topics.map((topic, idx) => {
              const milestones: string[] =
                (JSON.parse(completed as any) as any) || [];
              const isCompleted = milestones.includes(topic);
              if (topic) {
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className={`text-xs p-1 h-6 leading-none ${
                      !isCompleted
                        ? "bg-gray-300 text-gray-800 hover:bg-gray-400"
                        : "bg-gray-600 text-gray-100 hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      form.setValue("topic", topic);
                      form.setValue("amount", 3);
                    }}
                  >
                    {topic}
                  </Button>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityQuizForm;
