export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface HttpClient {
  get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T>;
  head(url: string, options?: HttpRequestOptions): Promise<void>;
}

interface FetchHeaders {
  get(name: string): string | null;
}

interface FetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: FetchHeaders;
  json(): Promise<unknown>;
}

type FetchFn = (url: string, init?: unknown) => Promise<FetchResponse>;

class HttpRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly url: string,
  ) {
    super(`Request to ${url} failed with status ${status} ${statusText}`);
  }
}

const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  if (!timeoutMs) {
    return promise;
  }

  const timeout = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      clearTimeout(timer);
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]);
};

const getFetch = (): FetchFn => {
  const fetchImpl = (globalThis.fetch as FetchFn | undefined)?.bind(
    globalThis,
  );
  if (!fetchImpl) {
    throw new Error("Global fetch API is not available in this environment");
  }
  return fetchImpl;
};

const fetchJson = async (
  url: string,
  init: unknown,
  timeoutMs: number,
): Promise<unknown> => {
  const response = await withTimeout(getFetch()(url, init), timeoutMs);
  if (!response.ok) {
    throw new HttpRequestError(response.status, response.statusText, url);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON response from ${url}`);
  }
  return response.json();
};

export const createHttpClient = (defaults?: HttpRequestOptions): HttpClient => {
  const timeout = defaults?.timeoutMs ?? 15_000;
  return {
    async get<T = unknown>(url: string, options?: HttpRequestOptions): Promise<T> {
      const headers = { ...defaults?.headers, ...options?.headers };
      const payload = await fetchJson(
        url,
        { method: "GET", headers },
        options?.timeoutMs ?? timeout,
      );
      return payload as T;
    },
    async head(url: string, options?: HttpRequestOptions): Promise<void> {
      const fetchImpl = getFetch();
      await withTimeout(
        fetchImpl(url, {
          method: "HEAD",
          headers: { ...defaults?.headers, ...options?.headers },
        }),
        options?.timeoutMs ?? timeout,
      );
    },
  };
};

export { HttpRequestError };
