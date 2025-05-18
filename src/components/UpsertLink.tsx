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
type Upload = {
  upload: string;
};
const LinkSubmitDialog = ({ upload }: Upload) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputLink, setInputLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Demo function to simulate loading
  const handleSubmit = () => {
    if (!inputLink.trim()) {
      return; // Don't proceed if no link
    }
    setIsLoading(true);

    // Simulate API request delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      // Reset after success
      setTimeout(() => {
        setIsSuccess(false);
        setIsOpen(false);
        setInputLink("");
      }, 1500);
    }, 1500);
  };

  return (
    <div className="flex justify-center bg-gray-900">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-md">
            <Link className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md w-full p-0 bg-black border border-gray-800 rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-black p-4 border-b border-gray-800">
            <DialogTitle className="text-lg font-medium flex items-center gap-2 text-white">
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
                  className="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-200 pr-10"
                />
                <ExternalLink className="absolute right-3 top-3 h-5 w-5 text-gray-500" />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                onClick={() => setIsOpen(false)}
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
                    <span>Submitting...</span>
                  </>
                ) : isSuccess ? (
                  <span>Submitted!</span>
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
                Make sure your link is valid before submitting
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinkSubmitDialog;
