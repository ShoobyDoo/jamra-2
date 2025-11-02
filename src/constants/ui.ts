/**
 * UI Constants
 * General UI configuration values
 */

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * Debounce / Throttle
 */
export const SEARCH_DEBOUNCE_MS = 300;
export const SCROLL_THROTTLE_MS = 100;

/**
 * Timeouts
 */
export const TOAST_DURATION = 3000; // 3 seconds
export const MODAL_TRANSITION_DURATION = 200; // 200ms

/**
 * Image Loading
 */
export const IMAGE_LOAD_TIMEOUT = 10000; // 10 seconds
export const IMAGE_RETRY_ATTEMPTS = 3;

/**
 * Reader
 */
export const READER_PRELOAD_PAGES = 2; // Preload next 2 pages
export const READER_CACHE_SIZE = 10; // Keep 10 pages in memory

/**
 * Download
 */
export const MAX_CONCURRENT_DOWNLOADS = 3;
export const DOWNLOAD_RETRY_ATTEMPTS = 3;

/**
 * UI Layout Options
 */
export const LAYOUT = {
  HEADER_HEIGHT: 50,
  NAVBAR_WIDTH: 90,
  MAIN_PADDING: "py-5 px-6",
} as const;
