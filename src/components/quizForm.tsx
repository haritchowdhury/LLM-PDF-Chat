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
import { TopicCreationButton } from "@/components/topicCreation";
import axios, { AxiosError } from "axios";
type Props = {
  topic: string;
};

type Input = z.infer<typeof quizCreationSchema>;
const QuizForm = ({ topic: topicParam }: Props) => {
  const router = useRouter();
  const [showLoader, setShowLoader] = useState(false);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [topicsCreated, setTopicsCreated] = useState(false);
  const { toast } = useToast();
  const { mutate: getQuestions, status } = useMutation({
    mutationFn: async ({ amount, topic }: Input) => {
      console.log(amount, topic);
      const response = await axios.post("/api/game", {
        amount,
        topic /*, type */,
      });
      return response.data;
    },
  });
  const [topics, setTopics] = useState([]);
  const form = useForm<Input>({
    resolver: zodResolver(quizCreationSchema),
    defaultValues: {
      topic: topicParam || "",
      //type: "mcq",
      amount: 3,
    },
  });
  /*
USEEFEECT */
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/topics")
        .then((res) => res.json())
        .then((res) => {
          console.log(res);

          setTopics(res.topics);
        })
        .finally(() => setTopicsCreated(true));
    }, 5000); // Runs every 1000ms (1 second)

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);
  /**/

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
    <p className="bg-black text-white"> Creating Quiz...</p>
  ) : (
    <>
      <Card className="border-none fixed top-20 left-1/2 -translate-x-1/2 w-[500px] bg-black">
        <Form {...form}>
          <form
            className="flex  grid-cols-3 flex-row w-full "
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem
                  className=" w-5/6"
                  style={{ maxWidth: "calc(100vw - 80px)" }}
                >
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
                <FormItem
                  className="w-1/6 px-1"
                  style={{ maxWidth: "calc(100vw - 80px)" }}
                >
                  <FormControl className="bg-gray-200 text-black">
                    <Input
                      placeholder="How many questions?"
                      type="number"
                      {...field}
                      //value={field.value ?? 3}
                      onChange={(e) => {
                        form.setValue("amount", parseInt(e.target.value) || 3);
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
          </form>
        </Form>
        {!topics?.length ? (
          <TopicCreationButton />
        ) : (
          <div className="flex flex-wrap gap-3 py-2 justify-center bg-black rounded-md">
            {topics.map((topic, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-black bg-gray-200 border-gray-600 hover:bg-gray-700"
                onClick={() => {
                  form.setValue("topic", topic);
                  form.setValue("amount", 5);
                }}
              >
                {topic}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};

export default QuizForm;
