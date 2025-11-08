"use client";

/**
 * ChatWrapper Component
 *
 * Wraps the Chat component and handles upload processing states.
 * Shows loading/processing/error states based on upload status.
 */

import React from "react";
import Chat from "./Chat";
import {
  useUploadStatus,
  isProcessing,
  isCompleted,
  isFailed,
} from "@/hooks/useUploadStatus";
import { Upload, Game } from "@prisma/client";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface ChatWrapperProps {
  uploadId: string;
  sessionId: string;
  namespace: string;
  isPersonal: boolean;
  userId: string;
  publisher: string;
  workspaces: Upload[];
  games: Game[];
  upload: Upload;
}

export default function ChatWrapper({
  uploadId,
  sessionId,
  namespace,
  isPersonal,
  userId,
  publisher,
  workspaces,
  games,
  upload,
}: ChatWrapperProps) {
  const { data: status, loading, error } = useUploadStatus(uploadId);

  // Loading initial status
  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-black">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  // Error fetching status
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-black">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  // Upload is still processing
  if (isProcessing(status)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-black px-4">
        <div className="mb-6">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Processing Your Content</h2>
        <p className="text-gray-400 text-center max-w-md mb-4">
          {status?.status === "PENDING"
            ? "Your upload is queued and will start processing shortly..."
            : "We're generating embeddings and preparing your content for chat. This may take a few minutes..."}
        </p>
        <div className="mt-6 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-800">
            You can safely close this page. Your content will continue
            processing in the background.
          </p>
        </div>
      </div>
    );
  }

  // Upload failed
  if (isFailed(status)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white px-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-3xl font-bold mb-2 text-red-400">
          Processing Failed
        </h2>
        <p className="text-gray-400 text-center max-w-md mb-4">
          {status?.errorMessage ||
            "Something went wrong while processing your content."}
        </p>
        <div className="mt-6 space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="ml-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Upload completed - show chat
  if (isCompleted(status)) {
    return (
      <Chat
        sessionId={sessionId}
        namespace={namespace}
        isPersonal={isPersonal}
        userId={userId}
        publisher={publisher}
        workspaces={workspaces}
        games={games}
        upload={upload}
      />
    );
  }

  // Fallback - show chat anyway
  return (
    <Chat
      sessionId={sessionId}
      namespace={namespace}
      isPersonal={isPersonal}
      userId={userId}
      publisher={publisher}
      workspaces={workspaces}
      games={games}
      upload={upload}
    />
  );
}
