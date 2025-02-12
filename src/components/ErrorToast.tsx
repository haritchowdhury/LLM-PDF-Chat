"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const ErrorToast = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { toast } = useToast();

  useEffect(() => {
    if (error) {
      toast({
        duration: 2000,
        variant: "destructive",
        description: "Credentials not found.",
      });
    }
  }, [error]);

  return null; // No UI, only side effect
};

export default ErrorToast;
