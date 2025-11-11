/**
 * Route constants for navigation and breadcrumbs
 */

export interface RouteConfig {
  path: string;
  label: string | ((params?: Record<string, string>) => string);
  parent?: string;
  fallbackRoute?: string; // Where to navigate if this segment is clicked but has no direct route
  breadcrumbs?: string[];
}

/**
 * Static route labels for breadcrumb display
 */
export const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/discover': 'Discover',
  '/library': 'Library',
  '/downloads': 'Downloads',
  '/history': 'History',
  '/extensions': 'Extensions',
  '/settings': 'Settings',
};

/**
 * Route hierarchy configuration for breadcrumbs
 * Includes dynamic routes with parent relationships
 */
export const ROUTE_HIERARCHY: Record<string, RouteConfig> = {
  '/': {
    path: '/',
    label: 'Home',
    breadcrumbs: ['/'],
  },
  '/discover': {
    path: '/discover',
    label: 'Discover',
    parent: '/',
    breadcrumbs: ['/', '/discover'],
  },
  '/library': {
    path: '/library',
    label: 'Library',
    parent: '/',
    breadcrumbs: ['/', '/library'],
  },
  '/downloads': {
    path: '/downloads',
    label: 'Downloads',
    parent: '/',
    breadcrumbs: ['/', '/downloads'],
  },
  '/history': {
    path: '/history',
    label: 'History',
    parent: '/',
    breadcrumbs: ['/', '/history'],
  },
  '/extensions': {
    path: '/extensions',
    label: 'Extensions',
    parent: '/',
    breadcrumbs: ['/', '/extensions'],
  },
  '/settings': {
    path: '/settings',
    label: 'Settings',
    parent: '/',
    breadcrumbs: ['/', '/settings'],
  },
  '/manga/:id': {
    path: '/manga/:id',
    label: 'Manga Details',
    parent: '/discover',
    fallbackRoute: '/discover', // If someone clicks "manga" segment, go to discover
    breadcrumbs: ['/', '/discover', '/manga/:id'],
  },
  '/reader/:chapterId': {
    path: '/reader/:chapterId',
    label: 'Reader',
    parent: '/manga/:id',
    breadcrumbs: ['/', '/discover', '/manga/:id', '/reader/:chapterId'],
  },
};

/**
 * Fallback routes for segments that don't have direct navigation paths
 */
export const SEGMENT_FALLBACKS: Record<string, string> = {
  manga: '/discover', // /manga -> /discover (manga list is on discover page)
  reader: '/library', // /reader -> /library (as fallback if no parent manga)
};
