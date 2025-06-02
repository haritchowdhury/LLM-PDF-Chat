"use client";
import { useState, useRef } from "react";
import { Book } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const ContentInput = () => {
  const [activeTab, setActiveTab] = useState<"url" | "pdf">("url");
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleUrlSubmit = async () => {
    if (!url.trim()) return;

    // Store URL in sessionStorage and redirect to sign-in with callback
    sessionStorage.setItem("pendingUrl", url.trim());
    sessionStorage.setItem("pendingType", "url");

    // Redirect to sign-in with callbackUrl pointing to the processing page
    router.push(
      `/sign-in?callbackUrl=${encodeURIComponent("/process-content")}`
    );
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Convert file to base64 and store in sessionStorage for unauthenticated users
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      sessionStorage.setItem("pendingFile", base64String);
      sessionStorage.setItem("pendingFileName", file.name);
      sessionStorage.setItem("pendingType", "pdf");

      // Redirect to sign-in with callbackUrl pointing to the processing page
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent("/process-content")}`
      );
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Create Your Classroom in 3 Easy Steps
          </h3>

          {/* Show message for unauthenticated users */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm text-center">
              📝 Start creating your spaces below. You'll be asked to sign in
              before we process your content.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-8">
            <button
              onClick={() => setActiveTab("url")}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === "url"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📄 From URL
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
                activeTab === "pdf"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📁 Upload PDF
            </button>
          </div>

          {/* URL Input */}
          {activeTab === "url" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste any URL (article, blog post, Wikipedia page, etc.)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="text-center">
                <button
                  onClick={handleUrlSubmit}
                  disabled={!url || isLoading}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Processing..." : "Continue"}
                </button>
              </div>
            </div>
          )}

          {/* PDF Upload */}
          {activeTab === "pdf" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload a PDF document
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop your PDF here, or
                  </p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    browse files
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {isLoading && (
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">
                  Processing your content...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentInput;
