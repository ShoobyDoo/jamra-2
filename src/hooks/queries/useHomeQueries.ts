import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type {
  ContinueReadingEntry,
  LibraryListResponse,
  ReadingProgress,
} from "../../types";

const CONTINUE_READING_LIMIT = 8;

export const homeKeys = {
  all: ["home"] as const,
  continueReading: ["home", "continue-reading"] as const,
};

export const useContinueReadingEntries = () => {
  return useQuery({
    queryKey: homeKeys.continueReading,
    queryFn: async ({ signal }) => {
      const libraryResponse = await apiClient.get<LibraryListResponse>(
        API_PATHS.library,
        {
          params: {
            sort: "lastUpdated",
            direction: "desc",
            limit: CONTINUE_READING_LIMIT,
          },
          signal,
        },
      );

      const items = libraryResponse.items ?? [];

      const progressResults = await Promise.allSettled(
        items.map(async (item) => {
          const progress = await apiClient.get<ReadingProgress | null>(
            API_PATHS.libraryLastRead(item.id),
            { signal },
          );

          if (!progress) {
            return null;
          }

          const totalPages = progress.totalPages ?? 0;
          const progressPercent =
            totalPages > 0
              ? Math.min(
                  100,
                  Math.round((progress.pageNumber / totalPages) * 100),
                )
              : undefined;

          const entry: ContinueReadingEntry = {
            libraryId: item.id,
            mangaId: item.mangaId,
            extensionId: item.extensionId,
            title: item.title,
            coverUrl: item.coverUrl,
            chapterId: progress.chapterId,
            chapterNumber: progress.chapterNumber,
            pageNumber: progress.pageNumber,
            totalPages: progress.totalPages,
            progressPercent,
            lastReadAt: progress.lastRead,
            updatedAt: item.lastUpdated,
          };

          return entry;
        }),
      );

      return progressResults
        .map((result) => (result.status === "fulfilled" ? result.value : null))
        .filter(Boolean) as ContinueReadingEntry[];
    },
  });
};
