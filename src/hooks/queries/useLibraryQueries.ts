import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../constants/api';
import type { LibraryItem, ReadingProgress } from '../../types';

// Query keys
export const libraryKeys = {
  all: ['library'] as const,
  progress: (mangaId: string) => ['library', 'progress', mangaId] as const,
};

// Hooks
export const useLibrary = () => {
  return useQuery({
    queryKey: libraryKeys.all,
    queryFn: () => apiClient.get<LibraryItem[]>(ENDPOINTS.LIBRARY),
  });
};

export const useReadingProgress = (mangaId: string) => {
  return useQuery({
    queryKey: libraryKeys.progress(mangaId),
    queryFn: () =>
      apiClient.get<ReadingProgress>(ENDPOINTS.LIBRARY_PROGRESS(mangaId)),
    enabled: !!mangaId,
  });
};

export const useUpdateProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      mangaId,
      chapterId,
      page,
    }: {
      mangaId: string;
      chapterId: string;
      page: number;
    }) =>
      apiClient.put<ReadingProgress>(`${ENDPOINTS.LIBRARY}/progress`, {
        mangaId,
        chapterId,
        page,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });
};
