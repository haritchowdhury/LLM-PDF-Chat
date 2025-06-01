import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link, Send, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

type Upload = {
  upload: string;
  isPersonal: boolean;
};

const LinkSubmitDialog = ({ upload, isPersonal }: Upload) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputLink, setInputLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!inputLink.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    toast({
      description: "Adding your URL to AI's knowledge...",
      duration: 10000,
    });

    try {
      const response = await fetch("/api/scraper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: inputLink.trim(),
          namespace: upload || "undefined",
          sharable: isPersonal ? "false" : "true",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          variant: "destructive",
          description: "Something went wrong, can't scrape this url!",
          duration: 2000,
        });
        //router.replace(`/chat/${upload}`);
      } else {
        toast({
          description: "Added the URL to AI's knowledge successfully",
          duration: 2000,
        });
        router.replace(`/chat/${data.message}`);
      }

      setIsSuccess(true);
      console.log("Upload ID:", data.message);

      // Reset after success
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setInputLink("");
        setError(null);
      }, 2000);
    } catch (err) {
      /* setTimeout(() => {
        router.replace(`/chat/${upload}`);
      }, 100);*/
      console.error("Error submitting link:", err);
      toast({
        variant: "destructive",
        description:
          err instanceof Error
            ? err.message
            : "Something went wrong! Currently we support text only PDFs.",
        duration: 2000,
      });
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setInputLink("");
    setError(null);
    setIsSuccess(false);
  };

  return (
    <div className="flex justify-center bg-gray-white">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-md">
            <Link className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md w-full p-0 bg-white text-gray-800 border border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 text-gray-800 p-4 border-b border-gray-800">
            <DialogTitle className="text-lg font-medium flex items-center gap-2 text-gray-800">
              <Link className="h-5 w-5 text-blue-400" />
              Read from a link
            </DialogTitle>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Enter URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputLink}
                  onChange={(e) => setInputLink(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-gray-white border border-gray-200 rounded-md p-3 text-gray-800 pr-10"
                  disabled={isLoading}
                />
                <ExternalLink className="absolute right-3 top-3 h-5 w-5 text-gray-500" />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-md p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={handleClose}
                disabled={isLoading}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700 rounded-md px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || isSuccess || !inputLink.trim()}
                className={`px-4 py-2 ${
                  isSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white rounded-md flex items-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isSuccess ? (
                  <span>Success!</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit</span>
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center">
                {isLoading
                  ? "Scraping and processing your link..."
                  : "Make sure your link is valid before submitting"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinkSubmitDialog;
