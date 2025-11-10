/**
 * Constants Index
 * Centralized export of all application constants
 */

// API constants
export { API_BASE_URL, ENDPOINTS } from "./api";

// Query constants
export {
  GC_TIME,
  MAX_MUTATION_RETRIES,
  MAX_QUERY_RETRIES,
  STALE_TIME,
} from "./query";

// WebSocket constants
export {
  WS_EVENTS,
  WS_MAX_RECONNECT_ATTEMPTS,
  WS_RECONNECT_BACKOFF_MULTIPLIER,
  WS_RECONNECT_INTERVAL,
  WS_URL,
  type WSEventType,
} from "./websocket";

// UI constants
export {
  DEFAULT_PAGE_SIZE,
  DOWNLOAD_RETRY_ATTEMPTS,
  IMAGE_LOAD_TIMEOUT,
  IMAGE_RETRY_ATTEMPTS,
  MAX_CONCURRENT_DOWNLOADS,
  MODAL_TRANSITION_DURATION,
  PAGE_SIZE_OPTIONS,
  READER_CACHE_SIZE,
  READER_PRELOAD_PAGES,
  SCROLL_THROTTLE_MS,
  SEARCH_DEBOUNCE_MS,
  TOAST_DURATION,
} from "./ui";
