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
  MANGA_DETAILS: "/manga/:id",
  READER: "/reader/:chapterId",

  // Error routes
  NOT_FOUND: "*",
} as const;

// Type for route paths
// export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Helper builders for dynamic routes
 */
export const buildRoute = {
  mangaDetails: (id: string) => `/manga/${id}`,
  reader: (chapterId: string) => `/reader/${chapterId}`,
} as const;
