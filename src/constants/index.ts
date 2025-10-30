/**
 * Constants Index
 * Centralized export of all application constants
 */

// API constants
export { API_BASE_URL, ENDPOINTS } from './api';

// Query constants
export {
  STALE_TIME,
  GC_TIME,
  DOWNLOAD_POLL_INTERVAL,
  MAX_QUERY_RETRIES,
  MAX_MUTATION_RETRIES,
} from './query';

// WebSocket constants
export {
  WS_URL,
  WS_RECONNECT_INTERVAL,
  WS_MAX_RECONNECT_ATTEMPTS,
  WS_RECONNECT_BACKOFF_MULTIPLIER,
  WS_EVENTS,
  type WSEventType,
} from './websocket';

// UI constants
export {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  SEARCH_DEBOUNCE_MS,
  SCROLL_THROTTLE_MS,
  TOAST_DURATION,
  MODAL_TRANSITION_DURATION,
  IMAGE_LOAD_TIMEOUT,
  IMAGE_RETRY_ATTEMPTS,
  READER_PRELOAD_PAGES,
  READER_CACHE_SIZE,
  MAX_CONCURRENT_DOWNLOADS,
  DOWNLOAD_RETRY_ATTEMPTS,
} from './ui';
