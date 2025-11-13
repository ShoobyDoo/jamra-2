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
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${base}${endpoint}`;
};

/**
 * Request configuration options
 */
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  expectJson?: boolean;
}

/**
 * Type-safe fetch wrapper with error handling
 */
const apiFetch = async <T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> => {
  const { params, expectJson = true, ...fetchConfig } = config;

  // Build URL with query params if provided
  let url = buildUrl(endpoint);
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      searchParams.append(key, String(value));
    });
    if ([...searchParams.keys()].length > 0) {
      url = `${url}?${searchParams.toString()}`;
    }
  }

  // Set default headers when a JSON body is present
  const headers = new Headers(fetchConfig.headers);
  if (
    fetchConfig.body &&
    !(fetchConfig.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...fetchConfig,
      headers,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const message =
        (await safeReadText(response)) || response.statusText || "API Error";
      throw new FetchError(message, response.status, response.statusText);
    }

    if (!expectJson) {
      return response as unknown as T;
    }

    const payload = await safeParseJson<T>(response);
    return payload as T;
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

const safeReadText = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return "";
  }
};

const safeParseJson = async <T>(response: Response): Promise<T | null> => {
  const text = await safeReadText(response);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new FetchError("Failed to parse response JSON", response.status, "");
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
    const payload =
      body === undefined ? undefined : JSON.stringify(body);
    return apiFetch<T>(endpoint, {
      ...config,
      method: "POST",
      body: payload,
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
    const payload =
      body === undefined ? undefined : JSON.stringify(body);
    return apiFetch<T>(endpoint, {
      ...config,
      method: "PUT",
      body: payload,
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
    const payload =
      body === undefined ? undefined : JSON.stringify(body);
    return apiFetch<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: payload,
    });
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, config?: RequestConfig): Promise<T> => {
    return apiFetch<T>(endpoint, { ...config, method: "DELETE" });
  },
};
