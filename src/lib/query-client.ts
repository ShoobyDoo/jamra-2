/**
 * TanStack Query Client Configuration
 * Centralized QueryClient setup with sensible defaults
 */

import { QueryClient } from "@tanstack/react-query";
import {
  GC_TIME,
  MAX_MUTATION_RETRIES,
  MAX_QUERY_RETRIES,
  STALE_TIME,
} from "../constants/query";

/**
 * Default options for all queries
 */
const queryConfig = {
  queries: {
    // Time before data is considered stale
    staleTime: STALE_TIME,

    // Cache time - how long unused data stays in cache
    gcTime: GC_TIME,

    // Retry failed requests
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && "status" in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to MAX_QUERY_RETRIES times for other errors
      return failureCount < MAX_QUERY_RETRIES;
    },

    // Refetch on window focus
    refetchOnWindowFocus: false,

    // Refetch on reconnect
    refetchOnReconnect: true,

    // Refetch on mount if data is stale
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations
    retry: MAX_MUTATION_RETRIES,
  },
};

/**
 * Create and export the QueryClient instance
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});
