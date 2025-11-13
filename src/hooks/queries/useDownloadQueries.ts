import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type {
  DownloadDetailsResponse,
  DownloadListResponse,
  DownloadQueueItem,
  DownloadStats,
} from "../../types";

type DownloadFilters = {
  status?: string;
  libraryId?: string;
  extensionId?: string;
};

type QueueDownloadsPayload = {
  libraryId: string;
  extensionId: string;
  chapterIds: string[];
  chapterNumbers?: Record<string, string>;
};

export const downloadKeys = {
  all: ["downloads"] as const,
  list: (filters?: DownloadFilters) =>
    ["downloads", "list", filters] as const,
  detail: (downloadId: string) =>
    ["downloads", "detail", downloadId] as const,
  stats: ["downloads", "stats"] as const,
};

export const useDownloadQueue = (filters?: DownloadFilters) => {
  return useQuery({
    queryKey: downloadKeys.list(filters),
    queryFn: () =>
      apiClient.get<DownloadListResponse>(API_PATHS.downloads, {
        params: filters,
      }),
  });
};

export const useDownloadDetails = (downloadId?: string) => {
  return useQuery({
    queryKey: downloadId
      ? downloadKeys.detail(downloadId)
      : ["downloads", "detail"],
    queryFn: () =>
      apiClient.get<DownloadDetailsResponse>(
        API_PATHS.downloadDetails(downloadId!),
      ),
    enabled: Boolean(downloadId),
  });
};

export const useDownloadStats = () => {
  return useQuery({
    queryKey: downloadKeys.stats,
    queryFn: () => apiClient.get<DownloadStats>(API_PATHS.downloadStats),
  });
};

export const useStartDownload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QueueDownloadsPayload) =>
      apiClient.post<{ downloads: DownloadQueueItem[] }>(
        API_PATHS.downloads,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadKeys.all });
    },
  });
};

export const useCancelDownload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (downloadId: string) =>
      apiClient.delete<void>(API_PATHS.downloadDetails(downloadId), {
        expectJson: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: downloadKeys.all });
    },
  });
};
