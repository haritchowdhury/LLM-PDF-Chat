import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

interface TopicsData {
  topics: string[];
  completed: string[];
}

interface UseTopicsOptions {
  enabled?: boolean;
  pollingEnabled?: boolean;
  pollingKey?: number;
  pollingBaseline?: string | null;
}

export function useTopics(
  uploadId: string | null | undefined,
  type: "personal" | "community",
  options?: UseTopicsOptions
) {
  const endpoint =
    type === "personal"
      ? `/api/topics?upload=${uploadId}`
      : `/api/communityTopics?upload=${uploadId}`;

  const pollingKeyRef = useRef<number | undefined>(options?.pollingKey);
  const pollingBaselineRef = useRef<string | null>(
    options?.pollingBaseline ?? null
  );

  useEffect(() => {
    if (pollingKeyRef.current !== options?.pollingKey) {
      pollingKeyRef.current = options?.pollingKey;
      pollingBaselineRef.current = options?.pollingBaseline ?? null;
    }
    if (!options?.pollingEnabled) {
      pollingBaselineRef.current = null;
    }
  }, [options?.pollingKey, options?.pollingEnabled, options?.pollingBaseline]);

  return useQuery<TopicsData>({
    queryKey: ["topics", type, uploadId],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("Failed to fetch topics");
      }
      const data = await res.json();

      let topics: string[] = [];
      let completed: string[] = [];

      try {
        topics =
          typeof data.topics === "string"
            ? JSON.parse(data.topics) || []
            : data.topics || [];
      } catch {
        topics = [];
      }

      try {
        completed =
          typeof data.completed === "string"
            ? JSON.parse(data.completed) || []
            : data.completed || [];
      } catch {
        completed = [];
      }

      return { topics, completed };
    },
    enabled: !!uploadId && options?.enabled !== false,
    refetchInterval: (query) => {
      if (!options?.pollingEnabled) return false;

      if (pollingBaselineRef.current === null) return false;

      const currentSignature = JSON.stringify(query.state.data?.topics ?? []);
      if (currentSignature !== pollingBaselineRef.current) {
        return false;
      }

      return 3000;
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}
