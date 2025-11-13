import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type {
  LibraryItem,
  LibraryListResponse,
  LibraryStats,
  LibraryStatus,
  ReadingProgress,
} from "../../types";

type LibraryListFilters = {
  status?: LibraryStatus;
  favorite?: boolean;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

type ProgressPayload = {
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
};

type LibraryMutationBase = Pick<
  LibraryItem,
  "mangaId" | "extensionId" | "title" | "status"
> & { coverUrl?: string };

export const libraryKeys = {
  all: ["library"] as const,
  list: (filters?: LibraryListFilters) =>
    ["library", "list", filters] as QueryKey,
  detail: (libraryId: string) =>
    ["library", "detail", libraryId] as const,
  stats: ["library", "stats"] as const,
  progress: (libraryId: string) =>
    ["library", "progress", libraryId] as const,
  lastRead: (libraryId: string) =>
    ["library", "last-read", libraryId] as const,
};

export const useLibraryList = (filters?: LibraryListFilters) => {
  return useQuery({
    queryKey: libraryKeys.list(filters),
    queryFn: () =>
      apiClient.get<LibraryListResponse>(API_PATHS.library, {
        params: filters,
      }),
  });
};

export const useLibraryItem = (libraryId?: string) => {
  return useQuery({
    queryKey: libraryId ? libraryKeys.detail(libraryId) : ["library", "detail"],
    queryFn: () =>
      apiClient.get<LibraryItem>(API_PATHS.libraryItem(libraryId!)),
    enabled: Boolean(libraryId),
  });
};

export const useLibraryStats = () => {
  return useQuery({
    queryKey: libraryKeys.stats,
    queryFn: () => apiClient.get<LibraryStats>(API_PATHS.libraryStats),
  });
};

export const useLibraryProgress = (libraryId?: string) => {
  return useQuery({
    queryKey: libraryId ? libraryKeys.progress(libraryId) : ["library", "progress"],
    queryFn: () =>
      apiClient.get<ReadingProgress[]>(API_PATHS.libraryProgress(libraryId!)),
    enabled: Boolean(libraryId),
  });
};

export const useLastReadProgress = (libraryId?: string) => {
  return useQuery({
    queryKey: libraryId ? libraryKeys.lastRead(libraryId) : ["library", "last-read"],
    queryFn: () =>
      apiClient.get<ReadingProgress | null>(API_PATHS.libraryLastRead(libraryId!)),
    enabled: Boolean(libraryId),
  });
};

export const useAddToLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LibraryMutationBase) =>
      apiClient.post<LibraryItem>(API_PATHS.library, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};

export const useUpdateLibraryItem = (libraryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<Pick<LibraryItem, "status" | "favorite">>) =>
      apiClient.patch<LibraryItem>(API_PATHS.libraryItem(libraryId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};

export const useToggleFavorite = (libraryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { favorite: boolean }) =>
      apiClient.patch<LibraryItem>(API_PATHS.libraryFavorite(libraryId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};

export const useRemoveFromLibrary = (libraryId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.delete<void>(API_PATHS.libraryItem(libraryId), {
        expectJson: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};

export const useUpsertProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProgressPayload) =>
      apiClient.put<ReadingProgress>(
        API_PATHS.libraryProgress(payload.libraryId),
        {
          chapterId: payload.chapterId,
          chapterNumber: payload.chapterNumber,
          pageNumber: payload.pageNumber,
          totalPages: payload.totalPages,
        },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: libraryKeys.progress(variables.libraryId),
      });
      queryClient.invalidateQueries({
        queryKey: libraryKeys.lastRead(variables.libraryId),
      });
      queryClient.invalidateQueries({ queryKey: libraryKeys.list() });
    },
  });
};
