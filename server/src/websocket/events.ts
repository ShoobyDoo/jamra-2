/**
 * WebSocket Event Types and Payloads
 * Shared event definitions for real-time communication
 */

/**
 * WebSocket Event Names
 * Should match frontend constants/websocket.ts
 */
export const WS_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  SUBSCRIPTION_ACK: "subscription:ack",

  // Download events
  DOWNLOAD_STARTED: "download:started",
  DOWNLOAD_PROGRESS: "download:progress",
  DOWNLOAD_PAGE_COMPLETE: "download:page:complete",
  DOWNLOAD_CHAPTER_COMPLETE: "download:chapter:complete",
  DOWNLOAD_FAILED: "download:failed",
  DOWNLOAD_CANCELLED: "download:cancelled",

  // Library events
  LIBRARY_ITEM_ADDED: "library:item:added",
  LIBRARY_ITEM_UPDATED: "library:item:updated",
  LIBRARY_ITEM_REMOVED: "library:item:removed",

  // Manga events (future)
  MANGA_UPDATED: "manga:updated",
} as const;

/**
 * Download Event Payloads
 */
export interface DownloadStartedPayload {
  downloadId: string;
  mangaId: string;
  chapterId: string;
  timestamp: number;
}

export interface DownloadProgressPayload {
  downloadId: string;
  chapterId: string;
  currentPage: number;
  totalPages: number;
  percentage: number;
  timestamp: number;
}

export interface DownloadPageCompletePayload {
  downloadId: string;
  chapterId: string;
  pageNumber: number;
  timestamp: number;
}

export interface DownloadChapterCompletePayload {
  downloadId: string;
  chapterId: string;
  totalPages: number;
  timestamp: number;
}

export interface DownloadFailedPayload {
  downloadId: string;
  chapterId: string;
  error: string;
  timestamp: number;
}

export interface DownloadCancelledPayload {
  downloadId: string;
  chapterId: string;
  timestamp: number;
}

/**
 * Library Event Payloads
 */
export interface LibraryItemSnapshotPayload {
  libraryId: string;
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  status: string;
  favorite: boolean;
  timestamp: number;
}

export interface LibraryItemUpdatedPayload extends LibraryItemSnapshotPayload {
  changes: Partial<Pick<LibraryItemSnapshotPayload, "status" | "favorite">>;
}

export interface LibraryItemRemovedPayload {
  libraryId: string;
  mangaId: string;
  extensionId: string;
  title: string;
  timestamp: number;
}

/**
 * Manga Event Payloads (future)
 */
export interface MangaUpdatedPayload {
  mangaId: string;
  changes: string[];
  timestamp: number;
}
