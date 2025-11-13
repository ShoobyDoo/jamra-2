/**
 * API Constants - JAMRA backend
 * Centralised routes + base URL helpers shared across hooks/services.
 */

/**
 * Base API URL
 * Defaults to http://localhost:3000 and can be overridden via VITE_API_URL.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * REST endpoint paths (always include the `/api` prefix).
 */
export const API_PATHS = {
  health: "/health",

  settings: "/api/settings",
  setting: (key: string) => `/api/settings/${encodeURIComponent(key)}`,

  catalog: "/api/catalog",
  catalogSync: "/api/catalog/sync",

  extensions: "/api/extensions",
  extension: (extensionId: string) => `/api/extensions/${extensionId}`,
  extensionSearch: (extensionId: string) =>
    `/api/extensions/${extensionId}/search`,
  extensionManga: (extensionId: string, mangaId: string) =>
    `/api/extensions/${extensionId}/manga/${mangaId}`,
  extensionChapters: (extensionId: string, mangaId: string) =>
    `/api/extensions/${extensionId}/manga/${mangaId}/chapters`,
  extensionPages: (
    extensionId: string,
    mangaId: string,
    chapterId: string,
  ) =>
    `/api/extensions/${extensionId}/manga/${mangaId}/chapters/${chapterId}/pages`,
  extensionsInstall: "/api/extensions/install",
  extensionsInstallJob: (jobId: string) =>
    `/api/extensions/install/${jobId}`,

  installer: "/api/installer",
  installerJob: (jobId: string) => `/api/installer/install/${jobId}`,

  library: "/api/library",
  libraryItem: (libraryId: string) => `/api/library/${libraryId}`,
  libraryFavorite: (libraryId: string) =>
    `/api/library/${libraryId}/favorite`,
  libraryProgress: (libraryId: string) =>
    `/api/library/${libraryId}/progress`,
  libraryChapterProgress: (libraryId: string, chapterId: string) =>
    `/api/library/${libraryId}/chapters/${chapterId}/progress`,
  libraryLastRead: (libraryId: string) =>
    `/api/library/${libraryId}/last-read`,
  libraryStats: "/api/library/stats",

  downloads: "/api/downloads",
  downloadDetails: (downloadId: string) =>
    `/api/downloads/${downloadId}`,
  downloadStats: "/api/downloads/stats",

  readerChapter: (libraryId: string, chapterId: string) =>
    `/api/reader/${libraryId}/chapters/${chapterId}`,
  readerNextChapter: (libraryId: string, chapterId: string) =>
    `/api/reader/${libraryId}/chapters/${chapterId}/next`,
  readerPreviousChapter: (libraryId: string, chapterId: string) =>
    `/api/reader/${libraryId}/chapters/${chapterId}/previous`,
  readerPage: (
    libraryId: string,
    chapterId: string,
    pageNumber: number,
  ) =>
    `/api/reader/${libraryId}/chapters/${chapterId}/pages/${pageNumber}`,
} as const;

export type ApiPathKey = keyof typeof API_PATHS;
