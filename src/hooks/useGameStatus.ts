/**
 * useGameStatus Hook
 *
 * Polls the server for game question generation status and stops when complete or failed.
 * Use this hook to show processing indicators in the UI while questions are being generated.
 */

import { useEffect, useState } from "react";

interface GameStatus {
  gameId: string;
  status: "pending" | "processing" | "completed" | "failed";
  questionCount: number;
  errorMessage?: string | null;
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
}

interface UseGameStatusReturn {
  data: GameStatus | null;
  loading: boolean;
  error: string | null;
}

/**
 * Poll game status from the server
 *
 * @param gameId - The game ID to poll
 * @param pollInterval - Polling interval in milliseconds (default: 3000ms)
 * @returns Game status data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, loading } = useGameStatus(gameId);
 *
 * if (loading) return <Spinner />;
 * if (data?.status === "processing") return <ProcessingIndicator />;
 * if (data?.status === "failed") return <ErrorMessage error={data.errorMessage} />;
 * if (data?.status === "completed") return <MCQGame questions={questions} />;
 * ```
 */
export function useGameStatus(
  gameId: string | null | undefined,
  pollInterval: number = 3000
): UseGameStatusReturn {
  const [data, setData] = useState<GameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip polling if no gameId or if it's "undefined"
    if (!gameId || gameId === "undefined") {
      setLoading(false);
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/game/status/${gameId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Game not found");
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch status: ${response.statusText}`);
        }

        const status: GameStatus = await response.json();

        if (isMounted) {
          setData(status);
          setLoading(false);
          setError(null);

          // Stop polling if completed or failed
          if (
            (status.status === "completed" || status.status === "failed") &&
            interval
          ) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (err) {
        console.error("Error polling game status:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch status");
          setLoading(false);
        }
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    interval = setInterval(pollStatus, pollInterval);

    // Cleanup
    return () => {
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameId, pollInterval]);

  return { data, loading, error };
}

/**
 * Check if game is still processing
 *
 * @param status - Game status object
 * @returns True if status is pending or processing
 */
export function isProcessing(status: GameStatus | null): boolean {
  return status?.status === "pending" || status?.status === "processing";
}

/**
 * Check if game has completed successfully
 *
 * @param status - Game status object
 * @returns True if status is completed
 */
export function isCompleted(status: GameStatus | null): boolean {
  return status?.status === "completed";
}

/**
 * Check if game has failed
 *
 * @param status - Game status object
 * @returns True if status is failed
 */
export function isFailed(status: GameStatus | null): boolean {
  return status?.status === "failed";
}
