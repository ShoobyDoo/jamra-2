import { useQueries, useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { API_PATHS } from "../../constants/api";
import type {
  LibraryItem,
  LibraryListResponse,
  ReadingProgress,
} from "../../types";
import { libraryKeys } from "./useLibraryQueries";

/**
 * Reading activity entry that combines library item with its reading progress
 */
export interface ReadingActivityEntry {
  libraryItem: LibraryItem;
  progress: ReadingProgress;
}

/**
 * Query keys for reading activity
 */
export const readingActivityKeys = {
  all: ["reading-activity"] as const,
  list: () => ["reading-activity", "list"] as const,
};

/**
 * Fetches all library items and aggregates their reading progress into a timeline
 * Sorted by most recent reading activity
 */
export const useReadingActivity = () => {
  // First, fetch all library items
  const libraryQuery = useQuery({
    queryKey: libraryKeys.list({ sort: "lastUpdated", direction: "desc" }),
    queryFn: () =>
      apiClient.get<LibraryListResponse>(API_PATHS.library, {
        params: { sort: "lastUpdated", direction: "desc" },
      }),
  });

  // Then fetch progress for each library item
  const progressQueries = useQueries({
    queries:
      libraryQuery.data?.items.map((item) => ({
        queryKey: libraryKeys.progress(item.id),
        queryFn: () =>
          apiClient.get<ReadingProgress[]>(API_PATHS.libraryProgress(item.id)),
        enabled: Boolean(libraryQuery.data),
      })) ?? [],
  });

  // Aggregate and sort all reading activity entries
  const activities: ReadingActivityEntry[] = [];
  if (libraryQuery.data && progressQueries.every((q) => q.isSuccess)) {
    libraryQuery.data.items.forEach((item, index) => {
      const progressData = progressQueries[index]?.data;
      if (progressData && progressData.length > 0) {
        // Get all progress entries for this library item
        progressData.forEach((progress) => {
          activities.push({
            libraryItem: item,
            progress,
          });
        });
      }
    });

    // Sort by most recent reading activity
    activities.sort(
      (a, b) =>
        new Date(b.progress.lastRead).getTime() -
        new Date(a.progress.lastRead).getTime(),
    );
  }

  return {
    data: activities,
    isLoading:
      libraryQuery.isLoading || progressQueries.some((q) => q.isLoading),
    isError: libraryQuery.isError || progressQueries.some((q) => q.isError),
    error:
      libraryQuery.error || progressQueries.find((q) => q.error)?.error || null,
  };
};

/**
 * Simplified hook that only fetches recent reading activity (last N entries per library item)
 * More efficient for displaying in the history page
 */
export const useRecentReadingActivity = (options?: { limit?: number }) => {
  const limit = options?.limit ?? 50;

  // Fetch library items sorted by last updated
  const libraryQuery = useQuery({
    queryKey: libraryKeys.list({
      sort: "lastUpdated",
      direction: "desc",
      limit: 20,
    }),
    queryFn: () =>
      apiClient.get<LibraryListResponse>(API_PATHS.library, {
        params: { sort: "lastUpdated", direction: "desc", limit: 20 },
      }),
  });

  // Fetch only the last read progress for each item (more efficient)
  const lastReadQueries = useQueries({
    queries:
      libraryQuery.data?.items.map((item) => ({
        queryKey: libraryKeys.lastRead(item.id),
        queryFn: () =>
          apiClient.get<ReadingProgress | null>(
            API_PATHS.libraryLastRead(item.id),
          ),
        enabled: Boolean(libraryQuery.data),
      })) ?? [],
  });

  // Combine library items with their last read progress
  const activities: ReadingActivityEntry[] = [];
  if (libraryQuery.data && lastReadQueries.every((q) => q.isSuccess)) {
    libraryQuery.data.items.forEach((item, index) => {
      const lastRead = lastReadQueries[index]?.data;
      if (lastRead) {
        activities.push({
          libraryItem: item,
          progress: lastRead,
        });
      }
    });

    // Sort by most recent
    activities.sort(
      (a, b) =>
        new Date(b.progress.lastRead).getTime() -
        new Date(a.progress.lastRead).getTime(),
    );
  }

  return {
    data: activities.slice(0, limit),
    isLoading:
      libraryQuery.isLoading || lastReadQueries.some((q) => q.isLoading),
    isError: libraryQuery.isError || lastReadQueries.some((q) => q.isError),
    error:
      libraryQuery.error ||
      lastReadQueries.find((q) => q.error)?.error ||
      null,
  };
};
