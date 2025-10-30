/**
 * TanStack Query Constants
 * Configuration values for query client and hooks
 */

/**
 * Time before data is considered stale (5 minutes)
 * After this time, queries will refetch on mount or window focus
 */
export const STALE_TIME = 1000 * 60 * 5;

/**
 * Garbage collection time (10 minutes)
 * How long unused/inactive query data stays in cache before removal
 */
export const GC_TIME = 1000 * 60 * 10;

/**
 * Download queue polling interval (2 seconds)
 * DEPRECATED: Will be replaced by WebSocket real-time updates
 * @deprecated Use WebSocket events instead
 */
export const DOWNLOAD_POLL_INTERVAL = 2000;

/**
 * Maximum retry attempts for failed queries
 */
export const MAX_QUERY_RETRIES = 2;

/**
 * Maximum retry attempts for failed mutations
 */
export const MAX_MUTATION_RETRIES = 1;
