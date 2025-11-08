"use client";

import { useGameStatus, isProcessing, isCompleted, isFailed } from "@/hooks/useGameStatus";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface GameStatusWrapperProps {
  gameId: string;
  uploadId: string;
  hasQuestions: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper component that handles async game question generation
 * Shows loading state while questions are being generated
 * Renders children only when game is ready
 */
export default function GameStatusWrapper({
  gameId,
  uploadId,
  hasQuestions,
  children,
}: GameStatusWrapperProps) {
  const { data, loading, error } = useGameStatus(gameId);
  const router = useRouter();
  const hasRefreshed = useRef(false);

  // Check if questions are ready from API status
  const questionsReady = data && data.questionCount > 0;

  // Reload page when status becomes completed AND questions are ready but not loaded yet
  // This ensures we fetch the updated game data with questions from the server
  useEffect(() => {
    if (data && isCompleted(data) && questionsReady && !hasQuestions && !hasRefreshed.current) {
      hasRefreshed.current = true;
      // Use full page reload to ensure server-side data is fetched
      window.location.reload();
    }
  }, [data, questionsReady, hasQuestions]);

  // Initial loading
  if (loading) {
    return (
      <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h2 className="text-xl font-semibold text-gray-800">
              Loading game...
            </h2>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => router.push(`/chat/${uploadId}`)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Processing state or waiting for questions to be generated
  if (data && (isProcessing(data) || (isCompleted(data) && !questionsReady))) {
    return (
      <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h2 className="text-xl font-semibold text-gray-800">
              Generating Questions...
            </h2>
            <p className="text-gray-600">
              Please wait while we generate quiz questions from your document.
            </p>
            <p className="text-sm text-gray-500">
              Status: {data.status.toUpperCase()}
            </p>
            {data.questionCount > 0 && (
              <p className="text-sm text-blue-600">
                {data.questionCount} question{data.questionCount !== 1 ? "s" : ""} generated
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Failed state
  if (data && isFailed(data)) {
    return (
      <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Generation Failed
            </h2>
            <p className="text-gray-600">
              {data.errorMessage || "Failed to generate quiz questions. Please try again."}
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => router.push(`/chat/${uploadId}`)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Chat
              </button>
              <button
                onClick={() => router.refresh()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Completed state with questions loaded - render the actual game
  if (data && isCompleted(data) && questionsReady && hasQuestions) {
    return <>{children}</>;
  }

  // Fallback (shouldn't reach here)
  return (
    <main className="flex relative items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="bg-white shadow-2xl rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-600">Unknown game state</p>
          <button
            onClick={() => router.push(`/chat/${uploadId}`)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    </main>
  );
}
