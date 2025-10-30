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
 * Library Event Payloads (future)
 */
export interface LibraryUpdatedPayload {
  mangaId: string;
  action: 'added' | 'removed' | 'updated';
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
