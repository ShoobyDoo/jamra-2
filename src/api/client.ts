/**
 * API Client - Type-safe fetch wrapper for manga reader backend
 * Uses native fetch API for minimal bundle size
 */

import { API_BASE_URL } from "../constants/api";

/**
 * Custom error class for API errors
 * Exported for use in query error handling
 */
export class FetchError extends Error {
  status: number;
  statusText: string;

  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Helper to build full URL
 */
const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Request configuration options
 */
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number>;
}

/**
 * Type-safe fetch wrapper with error handling
 */
const apiFetch = async <T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> => {
  const { params, ...fetchConfig } = config;

  // Build URL with query params if provided
  let url = buildUrl(endpoint);
  if (params) {
    const searchParams = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    );
    url = `${url}?${searchParams.toString()}`;
  }

  // Set default headers
  const headers = new Headers(fetchConfig.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      throw new FetchError(
        `API Error: ${response.statusText}`,
        response.status,
        response.statusText,
      );
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Re-throw FetchError as-is
    if (error instanceof FetchError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof Error) {
      throw new FetchError(
        error.message || "Network error",
        0,
        "Network Error",
      );
    }

    // Fallback for unknown errors
    throw new FetchError("Unknown error occurred", 0, "Unknown Error");
  }
};

/**
 * API Client methods
 */
export const apiClient = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, config?: RequestConfig): Promise<T> => {
    return apiFetch<T>(endpoint, { ...config, method: "GET" });
  },

  /**
   * POST request
   */
  post: <T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...config,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /**
   * PUT request
   */
  put: <T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...config,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  /**
   * PATCH request
   */
  patch: <T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, config?: RequestConfig): Promise<T> => {
    return apiFetch<T>(endpoint, { ...config, method: "DELETE" });
  },
};
