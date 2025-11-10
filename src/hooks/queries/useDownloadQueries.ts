/**
 * Download Queries with WebSocket Integration
 *
 * IMPORTANT: This hook uses WebSocket for real-time updates instead of polling.
 *
 * Usage Pattern:
 * 1. Use useDownloadQueue() to get initial download queue data
 * 2. Use useWebSocket with WS_EVENTS.DOWNLOAD_PROGRESS in your component
 * 3. Invalidate query cache when WebSocket events are received
 *
 * Example:
 * ```tsx
 * const { data: queue } = useDownloadQueue();
 * const downloadProgress = useWebSocket<DownloadProgressPayload>(WS_EVENTS.DOWNLOAD_PROGRESS);
 *
 * useEffect(() => {
 *   if (downloadProgress) {
 *     queryClient.invalidateQueries({ queryKey: downloadKeys.queue });
 *   }
 * }, [downloadProgress]);
 * ```
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../constants/api";
import type { DownloadQueueItem } from "../../types";

// Query keys
export const downloadKeys = {
  queue: ["downloads", "queue"] as const,
};

// Hooks
export const useDownloadQueue = () => {
  return useQuery({
    queryKey: downloadKeys.queue,
    queryFn: () => apiClient.get<DownloadQueueItem[]>(ENDPOINTS.DOWNLOADS),
    // No refetchInterval - WebSocket provides real-time updates
  });
};

export const useStartDownload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mangaId,
      chapterId,
    }: {
      mangaId: string;
      chapterId: string;
    }) =>
      apiClient.post<DownloadQueueItem>(ENDPOINTS.DOWNLOADS, {
        mangaId,
        chapterId,
      }),
    onSuccess: () => {
      // Invalidate queue to show new download
      queryClient.invalidateQueries({ queryKey: downloadKeys.queue });
    },
  });
};

export const useCancelDownload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ENDPOINTS.DOWNLOAD_BY_ID(id)),
    onSuccess: () => {
      // Invalidate queue to remove cancelled download
      queryClient.invalidateQueries({ queryKey: downloadKeys.queue });
    },
  });
};
