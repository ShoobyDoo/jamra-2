/**
 * WebSocket Constants
 * Configuration and event types for real-time communication
 */

/**
 * WebSocket Server URL
 * Uses VITE_WS_URL from environment or defaults to localhost:3000
 */
export const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

/**
 * WebSocket Reconnection Configuration
 */
export const WS_RECONNECT_INTERVAL = 3000; // 3 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 10;
export const WS_RECONNECT_BACKOFF_MULTIPLIER = 1.5; // Exponential backoff

/**
 * WebSocket Event Types
 * Server-to-client events for real-time updates
 */
export const WS_EVENTS = {
  // Connection events
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",
  SUBSCRIPTION_ACK: "subscription:ack",

  // Download events
  DOWNLOAD_STARTED: "download:started",
  DOWNLOAD_PROGRESS: "download:progress",
  DOWNLOAD_PAGE_COMPLETE: "download:page:complete",
  DOWNLOAD_CHAPTER_COMPLETE: "download:chapter:complete",
  DOWNLOAD_FAILED: "download:failed",
  DOWNLOAD_CANCELLED: "download:cancelled",

  // Library events
  LIBRARY_ITEM_ADDED: "library:item:added",
  LIBRARY_ITEM_UPDATED: "library:item:updated",
  LIBRARY_ITEM_REMOVED: "library:item:removed",

  // Manga events (future - for multi-client sync)
  MANGA_UPDATED: "manga:updated",
} as const;

/**
 * Type-safe event names
 */
export type WSEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];
