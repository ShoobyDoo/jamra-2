/**
 * TYPE SHARING ARCHITECTURE
 *
 * Current State: Types are manually duplicated between client and server.
 *
 * Why This is Not Ideal:
 * - Type changes on server won't be caught by client until runtime
 * - Manual synchronization is error-prone
 * - No compile-time type safety for API contracts
 *
 * Future Plan (when backend types stabilize):
 * 1. Create shared types package (packages/shared or shared/types.ts)
 * 2. Use TypeScript project references
 * 3. Or use a monorepo tool (Turborepo, Nx)
 * 4. Or generate types from server (tRPC, OpenAPI, Zod schemas)
 *
 * For Now:
 * Manually keep these types in sync with server types.
 * Breaking changes will manifest as runtime errors during development.
 */

export interface Manga {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genres: string[];
  status: "ongoing" | "completed" | "hiatus";
  createdAt: number;
  updatedAt: number;
}

export interface CreateMangaInput {
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  genres?: string[];
  status?: "ongoing" | "completed" | "hiatus";
}

export interface Chapter {
  id: string;
  mangaId: string;
  title: string;
  chapterNumber: number;
  pageCount: number;
  createdAt: number;
}

export interface LibraryItem {
  id: string;
  mangaId: string;
  isFavorite: boolean;
  addedAt: number;
}

export interface ReadingProgress {
  id: string;
  mangaId: string;
  chapterId: string;
  currentPage: number;
  lastReadAt: number;
}

export interface DownloadQueueItem {
  id: string;
  mangaId: string;
  chapterId: string;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
  createdAt: number;
}

/**
 * WebSocket Event Payloads
 * Re-export from websocket.ts
 */
export type {
  DownloadCancelledPayload,
  DownloadChapterCompletePayload,
  DownloadFailedPayload,
  DownloadPageCompletePayload,
  DownloadProgressPayload,
  DownloadStartedPayload,
  LibraryUpdatedPayload,
  MangaUpdatedPayload,
} from "./websocket";
