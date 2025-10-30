import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ENDPOINTS } from '../../constants/api';
import type { Chapter } from '../../types';

// Query keys
export const chapterKeys = {
  all: ['chapters'] as const,
  byManga: (mangaId: string) => [...chapterKeys.all, 'manga', mangaId] as const,
  detail: (id: string) => [...chapterKeys.all, 'detail', id] as const,
};

// Hooks
export const useChaptersByManga = (mangaId: string) => {
  return useQuery({
    queryKey: chapterKeys.byManga(mangaId),
    queryFn: () => apiClient.get<Chapter[]>(ENDPOINTS.CHAPTERS_BY_MANGA(mangaId)),
    enabled: !!mangaId,
  });
};

export const useChapter = (id: string) => {
  return useQuery({
    queryKey: chapterKeys.detail(id),
    queryFn: () => apiClient.get<Chapter>(ENDPOINTS.CHAPTER_BY_ID(id)),
    enabled: !!id,
  });
};
