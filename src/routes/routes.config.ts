/**
 * Centralized route path constants for Manga Reader
 * Provides type-safe route paths across the application
 */

export const ROUTES = {
  // Main routes
  HOME: "/",
  DISCOVER: "/discover",
  LIBRARY: "/library",
  DOWNLOADS: "/downloads",
  HISTORY: "/history",
  EXTENSIONS: "/extensions",

  // Settings (Bottom area)
  SETTINGS: "/settings",

  // Dynamic routes (use buildRoute helper)
  MANGA_DETAILS: "/manga/:extensionId/:mangaId",
  READER: "/reader/:libraryId/chapters/:chapterId",

  // Error routes
  NOT_FOUND: "*",
} as const;

// Type for route paths
// export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Helper builders for dynamic routes
 */
export const buildRoute = {
  mangaDetails: (extensionId: string, mangaId: string) =>
    `/manga/${extensionId}/${mangaId}`,
  reader: (libraryId: string, chapterId: string) =>
    `/reader/${libraryId}/chapters/${chapterId}`,
} as const;
