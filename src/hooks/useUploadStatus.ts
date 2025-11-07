/**
 * useUploadStatus Hook
 *
 * Polls the server for upload processing status and stops when complete or failed.
 * Use this hook to show processing indicators in the UI.
 */

import { useEffect, useState } from "react";

interface UploadStatus {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage?: string | null;
  vectorCount?: number | null;
  processingStartedAt?: string | null;
  processingCompletedAt?: string | null;
}

interface UseUploadStatusReturn {
  data: UploadStatus | null;
  loading: boolean;
  error: string | null;
}

/**
 * Poll upload status from the server
 *
 * @param uploadId - The upload ID to poll
 * @param pollInterval - Polling interval in milliseconds (default: 3000ms)
 * @returns Upload status data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data, loading } = useUploadStatus(uploadId);
 *
 * if (loading) return <Spinner />;
 * if (data?.status === "PROCESSING") return <ProcessingIndicator />;
 * if (data?.status === "FAILED") return <ErrorMessage error={data.errorMessage} />;
 * if (data?.status === "COMPLETED") return <Chat />;
 * ```
 */
export function useUploadStatus(
  uploadId: string | null | undefined,
  pollInterval: number = 3000
): UseUploadStatusReturn {
  const [data, setData] = useState<UploadStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip polling if no uploadId or if it's "undefined"
    if (!uploadId || uploadId === "undefined") {
      setLoading(false);
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/upload/status/${uploadId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Upload not found");
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch status: ${response.statusText}`);
        }

        const status: UploadStatus = await response.json();

        if (isMounted) {
          setData(status);
          setLoading(false);
          setError(null);

          // Stop polling if completed or failed
          if (
            (status.status === "COMPLETED" || status.status === "FAILED") &&
            interval
          ) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch (err) {
        console.error("Error polling upload status:", err);
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
  }, [uploadId, pollInterval]);

  return { data, loading, error };
}

/**
 * Check if upload is still processing
 *
 * @param status - Upload status object
 * @returns True if status is PENDING or PROCESSING
 */
export function isProcessing(status: UploadStatus | null): boolean {
  return status?.status === "PENDING" || status?.status === "PROCESSING";
}

/**
 * Check if upload has completed successfully
 *
 * @param status - Upload status object
 * @returns True if status is COMPLETED
 */
export function isCompleted(status: UploadStatus | null): boolean {
  return status?.status === "COMPLETED";
}

/**
 * Check if upload has failed
 *
 * @param status - Upload status object
 * @returns True if status is FAILED
 */
export function isFailed(status: UploadStatus | null): boolean {
  return status?.status === "FAILED";
}
