/**
 * WebSocket Event Payloads
 * Type definitions for WebSocket events from the server
 * These should match server/src/websocket/events.ts
 */

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

export interface LibraryItemUpdatedPayload
  extends LibraryItemSnapshotPayload {
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
