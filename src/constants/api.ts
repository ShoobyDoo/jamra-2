/**
 * API Constants - Manga Reader Backend
 * Centralized API configuration and endpoint constants
 */

/**
 * Base API URL
 * Uses VITE_API_URL from environment or defaults to localhost:3000
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * API Endpoints
 * Only includes endpoints used in 2+ places
 * Single-use endpoints can be inline in query hooks
 */
export const ENDPOINTS = {
  // Manga endpoints (used in list + search)
  MANGA: "/manga",
  MANGA_BY_ID: (id: string) => `/manga/${id}`,

  // Chapter endpoints
  CHAPTERS: "/chapters",
  CHAPTER_BY_ID: (id: string) => `/chapters/${id}`,
  CHAPTERS_BY_MANGA: (mangaId: string) => `/chapters?mangaId=${mangaId}`,

  // Library endpoints (used in get, add, remove)
  LIBRARY: "/library",
  LIBRARY_BY_MANGA: (mangaId: string) => `/library/${mangaId}`,
  LIBRARY_PROGRESS: (mangaId: string) => `/library/progress/${mangaId}`,

  // Download endpoints (used in queue, add)
  DOWNLOADS: "/downloads",
  DOWNLOAD_BY_ID: (id: string) => `/downloads/${id}`,
} as const;
