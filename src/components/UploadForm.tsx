"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Link as LinkIcon } from "lucide-react";

interface UploadFormProps {
  userId: string;
}

export default function UploadForm({ userId }: UploadFormProps) {
  const [uploadName, setUploadName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isUploadingPDF, setIsUploadingPDF] = useState(false);
  const [isUploadingURL, setIsUploadingURL] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handlePDFUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate name is provided
    if (!uploadName.trim()) {
      toast({
        description: "Please enter a name for your upload",
        duration: 2000,
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    // Validate description is provided
    if (!description.trim()) {
      toast({
        description: "Please enter a description for your upload",
        duration: 2000,
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        description: "Please upload a PDF file",
        duration: 2000,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingPDF(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("namespace", "undefined");
      formData.append("private", "false");
      formData.append("name", uploadName.trim());
      formData.append("description", description.trim());

      const response = await fetch("/api/upsert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }

      const data = await response.json();

      toast({
        description: "PDF uploaded successfully!",
        duration: 2000,
      });

      // Redirect to chat with the new upload
      if (data.message) {
        router.push(`/chat/${data.message}`);
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        description: "Failed to upload PDF. Please try again.",
        duration: 2000,
        variant: "destructive",
      });
    } finally {
      setIsUploadingPDF(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleURLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name is provided
    if (!uploadName.trim()) {
      toast({
        description: "Please enter a name for your upload",
        duration: 2000,
        variant: "destructive",
      });
      return;
    }

    // Validate description is provided
    if (!description.trim()) {
      toast({
        description: "Please enter a description for your upload",
        duration: 2000,
        variant: "destructive",
      });
      return;
    }

    if (!url.trim()) {
      toast({
        description: "Please enter a URL",
        duration: 2000,
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        description: "Please enter a valid URL",
        duration: 2000,
        variant: "destructive",
      });
      return;
    }

    setIsUploadingURL(true);

    try {
      const body: any = {
        url: url.trim(),
        namespace: "undefined",
        sharable: "true",
        name: uploadName.trim(),
        description: description.trim(),
      };

      const response = await fetch("/api/scraper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to scrape URL");
      }

      const data = await response.json();

      toast({
        description: "URL content loaded successfully!",
        duration: 2000,
      });

      // Clear form
      setUrl("");
      setUploadName("");
      setDescription("");

      // Redirect to chat with the new upload
      if (data.message) {
        router.push(`/chat/${data.message}`);
      }
    } catch (error) {
      console.error("Error scraping URL:", error);
      toast({
        description: "Failed to load URL content. Please try again.",
        duration: 2000,
        variant: "destructive",
      });
    } finally {
      setIsUploadingURL(false);
    }
  };

  return (
    <Card className="mb-6 shadow-md border-gray-200">
      <CardContent className="pt-6">
        {/* Header Text */}
        <div className="text-center mb-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Create a new Classroom
          </h3>
          <p className="text-xs text-gray-500">
            Upload you content and let people explore interactively.
          </p>
        </div>

        {/* Name Input - Required */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Enter a name for your upload *"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            className="w-full"
            disabled={isUploadingPDF || isUploadingURL}
            required
          />
        </div>

        {/* Description Input - Required */}
        <div className="mb-4">
          <Textarea
            placeholder="Enter a description for your upload *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-[80px]"
            disabled={isUploadingPDF || isUploadingURL}
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* PDF Upload Section */}
          <div className="flex-1">
            <label htmlFor="pdf-upload">
              <Button
                type="button"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isUploadingPDF || isUploadingURL}
                onClick={() => document.getElementById("pdf-upload")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingPDF ? "Uploading PDF..." : "Upload PDF"}
              </Button>
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handlePDFUpload}
              className="hidden"
              disabled={isUploadingPDF || isUploadingURL}
            />
          </div>

          {/* URL Input Section */}
          <form onSubmit={handleURLSubmit} className="flex-1">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="Enter URL to scrape"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={isUploadingPDF || isUploadingURL}
              />
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isUploadingPDF || isUploadingURL}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                {isUploadingURL ? "Loading..." : "Add URL"}
              </Button>
            </div>
          </form>
        </div>

        {/* Helper text */}
        <p className="text-sm text-gray-500 mt-3 text-center">
          Enter a name and description, then upload a PDF document or add a URL to start chatting
        </p>
      </CardContent>
    </Card>
  );
}
