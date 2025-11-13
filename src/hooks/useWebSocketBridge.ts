/**
 * WebSocket Bridge Hook
 * Centralized WebSocket event handling that updates React Query caches
 * This hook should be mounted once at the app root level
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { WS_EVENTS } from "../constants/websocket";
import { wsClient } from "../lib/websocket-client";
import { libraryKeys } from "./queries/useLibraryQueries";
import { downloadKeys } from "./queries/useDownloadQueries";
import type {
  DownloadStartedPayload,
  DownloadProgressPayload,
  DownloadChapterCompletePayload,
  DownloadFailedPayload,
  DownloadCancelledPayload,
  LibraryItemSnapshotPayload,
  LibraryItemUpdatedPayload,
  LibraryItemRemovedPayload,
} from "../types/websocket";

interface UseWebSocketBridgeOptions {
  enableNotifications?: boolean;
  notifyOnDownloadComplete?: boolean;
  notifyOnDownloadFailed?: boolean;
  notifyOnLibraryChanges?: boolean;
}

/**
 * Hook that bridges WebSocket events to React Query cache updates
 * Mount this once in your app root (e.g., App.tsx)
 *
 * @example
 * ```tsx
 * // In App.tsx
 * useWebSocketBridge({
 *   enableNotifications: true,
 *   notifyOnDownloadComplete: true,
 *   notifyOnDownloadFailed: true,
 * });
 * ```
 */
export const useWebSocketBridge = (
  options: UseWebSocketBridgeOptions = {},
) => {
  const {
    enableNotifications = true,
    notifyOnDownloadComplete = true,
    notifyOnDownloadFailed = true,
    notifyOnLibraryChanges = false,
  } = options;

  const queryClient = useQueryClient();

  useEffect(() => {
    // Download Started
    const unsubscribeDownloadStarted = wsClient.on<DownloadStartedPayload>(
      WS_EVENTS.DOWNLOAD_STARTED,
      (data) => {
        console.log("[WebSocket] Download started:", data);
        queryClient.invalidateQueries({ queryKey: downloadKeys.all });
        queryClient.invalidateQueries({ queryKey: downloadKeys.stats });
      },
    );

    // Download Progress
    const unsubscribeDownloadProgress = wsClient.on<DownloadProgressPayload>(
      WS_EVENTS.DOWNLOAD_PROGRESS,
      (data) => {
        console.log(
          `[WebSocket] Download progress: ${data.percentage}% (${data.currentPage}/${data.totalPages})`,
        );
        // For progress updates, we invalidate specific download detail query
        // to avoid refetching the entire list too frequently
        queryClient.invalidateQueries({
          queryKey: downloadKeys.detail(data.downloadId),
        });
      },
    );

    // Download Chapter Complete
    const unsubscribeDownloadChapterComplete =
      wsClient.on<DownloadChapterCompletePayload>(
        WS_EVENTS.DOWNLOAD_CHAPTER_COMPLETE,
        (data) => {
          console.log("[WebSocket] Download chapter complete:", data);
          queryClient.invalidateQueries({ queryKey: downloadKeys.all });
          queryClient.invalidateQueries({ queryKey: downloadKeys.stats });

          if (enableNotifications && notifyOnDownloadComplete) {
            notifications.show({
              title: "Chapter Downloaded",
              message: `Downloaded ${data.totalPages} pages successfully`,
              color: "green",
            });
          }
        },
      );

    // Download Failed
    const unsubscribeDownloadFailed = wsClient.on<DownloadFailedPayload>(
      WS_EVENTS.DOWNLOAD_FAILED,
      (data) => {
        console.error("[WebSocket] Download failed:", data);
        queryClient.invalidateQueries({ queryKey: downloadKeys.all });

        if (enableNotifications && notifyOnDownloadFailed) {
          notifications.show({
            title: "Download Failed",
            message: data.error || "An error occurred during download",
            color: "red",
          });
        }
      },
    );

    // Download Cancelled
    const unsubscribeDownloadCancelled = wsClient.on<DownloadCancelledPayload>(
      WS_EVENTS.DOWNLOAD_CANCELLED,
      (data) => {
        console.log("[WebSocket] Download cancelled:", data);
        queryClient.invalidateQueries({ queryKey: downloadKeys.all });
        queryClient.invalidateQueries({ queryKey: downloadKeys.stats });

        if (enableNotifications) {
          notifications.show({
            title: "Download Cancelled",
            message: "Download has been cancelled",
            color: "yellow",
          });
        }
      },
    );

    // Library Item Added
    const unsubscribeLibraryItemAdded =
      wsClient.on<LibraryItemSnapshotPayload>(
        WS_EVENTS.LIBRARY_ITEM_ADDED,
        (data) => {
          console.log("[WebSocket] Library item added:", data);
          queryClient.invalidateQueries({ queryKey: libraryKeys.all });

          if (enableNotifications && notifyOnLibraryChanges) {
            notifications.show({
              title: "Added to Library",
              message: `${data.title} has been added to your library`,
              color: "blue",
            });
          }
        },
      );

    // Library Item Updated
    const unsubscribeLibraryItemUpdated =
      wsClient.on<LibraryItemUpdatedPayload>(
        WS_EVENTS.LIBRARY_ITEM_UPDATED,
        (data) => {
          console.log("[WebSocket] Library item updated:", data);
          // Invalidate all library queries to reflect the update
          queryClient.invalidateQueries({ queryKey: libraryKeys.all });
          // Also invalidate the specific item detail if it exists in cache
          queryClient.invalidateQueries({
            queryKey: libraryKeys.detail(data.libraryId),
          });
        },
      );

    // Library Item Removed
    const unsubscribeLibraryItemRemoved =
      wsClient.on<LibraryItemRemovedPayload>(
        WS_EVENTS.LIBRARY_ITEM_REMOVED,
        (data) => {
          console.log("[WebSocket] Library item removed:", data);
          queryClient.invalidateQueries({ queryKey: libraryKeys.all });

          if (enableNotifications && notifyOnLibraryChanges) {
            notifications.show({
              title: "Removed from Library",
              message: `${data.title} has been removed from your library`,
              color: "orange",
            });
          }
        },
      );

    // Cleanup all subscriptions on unmount
    return () => {
      unsubscribeDownloadStarted();
      unsubscribeDownloadProgress();
      unsubscribeDownloadChapterComplete();
      unsubscribeDownloadFailed();
      unsubscribeDownloadCancelled();
      unsubscribeLibraryItemAdded();
      unsubscribeLibraryItemUpdated();
      unsubscribeLibraryItemRemoved();
    };
  }, [
    queryClient,
    enableNotifications,
    notifyOnDownloadComplete,
    notifyOnDownloadFailed,
    notifyOnLibraryChanges,
  ]);
};
