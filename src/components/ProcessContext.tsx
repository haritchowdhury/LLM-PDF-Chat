"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessContent({ session }) {
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const processContent = async () => {
      if (!session) {
        router.push("/sign-in?callbackUrl=/process-content");
        return;
      }

      try {
        const pendingType = sessionStorage.getItem("pendingType");
        const pendingUrl = sessionStorage.getItem("pendingUrl");

        if (!pendingType) {
          router.push("/");
          return;
        }

        let response;
        if (pendingType === "url") {
          // Process URL
          response = await fetch("/api/scraper", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: pendingUrl,
              namespace: "undefined",
              sharable: "true",
            }),
          });
        } else {
          // Process PDF
          const base64File = sessionStorage.getItem("pendingFile");
          const fileName = sessionStorage.getItem("pendingFileName");
          if (!base64File) {
            throw new Error("No file found");
          }

          // Convert base64 back to File
          const base64Data = base64File.split(",")[1];
          const binaryData = atob(base64Data);
          const bytes = new Uint8Array(binaryData.length);
          for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: "application/pdf" });
          const file = new File([blob], fileName, {
            type: "application/pdf",
          });

          const formData = new FormData();
          formData.append("file", file);
          formData.append("namespace", "undefined");
          formData.append("private", "false");

          response = await fetch("/api/upsert", {
            method: "POST",
            body: formData,
          });
        }

        const data = await response.json();

        if (!response.ok) {
          router.push("/");
          toast({
            variant: "destructive",
            description: "Something went wrong",
            duration: 2000,
          });
          throw new Error(data.error || "Failed to process content");
        }

        // Clear session storage
        sessionStorage.removeItem("pendingType");
        sessionStorage.removeItem("pendingUrl");
        sessionStorage.removeItem("pendingFile");

        toast({
          description: "Content processed successfully",
          duration: 2000,
        });

        // Redirect to chat page
        router.push(`/chat/${data.message}`);
      } catch (error) {
        console.error("Error processing content:", error);
        toast({
          variant: "destructive",
          description:
            error instanceof Error
              ? error.message
              : "Failed to process content",
          duration: 2000,
        });
        router.push("/");
      } finally {
        setIsProcessing(false);
      }
    };

    processContent();
  }, [router, toast, session]);
  /*
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-700">Processing your content...</p>
      </div>
    </div>
  ); */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 gap-4">
      <motion.div className="w-5 h-5 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-gray-800">Processing your content...</span>
    </div>
  );
}
