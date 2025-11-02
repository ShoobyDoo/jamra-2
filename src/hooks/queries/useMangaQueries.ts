import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { ENDPOINTS } from "../../constants/api";
import type { CreateMangaInput, Manga } from "../../types";

// Query keys
export const mangaKeys = {
  all: ["manga"] as const,
  lists: () => [...mangaKeys.all, "list"] as const,
  detail: (id: string) => [...mangaKeys.all, "detail", id] as const,
};

// Hooks
export const useMangaList = () => {
  return useQuery({
    queryKey: mangaKeys.lists(),
    queryFn: () => apiClient.get<Manga[]>(ENDPOINTS.MANGA),
  });
};

export const useManga = (id: string) => {
  return useQuery({
    queryKey: mangaKeys.detail(id),
    queryFn: () => apiClient.get<Manga>(ENDPOINTS.MANGA_BY_ID(id)),
    enabled: !!id,
  });
};

export const useCreateManga = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMangaInput) =>
      apiClient.post<Manga>(ENDPOINTS.MANGA, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.lists() });
    },
  });
};

export const useDeleteManga = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(ENDPOINTS.MANGA_BY_ID(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mangaKeys.lists() });
    },
  });
};
