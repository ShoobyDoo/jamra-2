/**
 * Centralized route path constants for Manga Reader
 * Provides type-safe route paths across the application
 */

export const ROUTES = {
  // Main routes
  HOME: '/',
  LIBRARY: '/library',
  DOWNLOADS: '/downloads',
  SETTINGS: '/settings',

  // Dynamic routes (use buildRoute helper)
  MANGA_DETAILS: '/manga/:id',
  READER: '/reader/:chapterId',

  // Error routes
  NOT_FOUND: '*',
} as const;

// Type for route paths
export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

// Helper function to build dynamic routes
export const buildRoute = {
  /**
   * Build manga details route
   * Example: buildRoute.mangaDetails('123') => '/manga/123'
   */
  mangaDetails: (id: string) => `/manga/${id}`,

  /**
   * Build reader route
   * Example: buildRoute.reader('chapter-456') => '/reader/chapter-456'
   */
  reader: (chapterId: string) => `/reader/${chapterId}`,
} as const;
