import type { Response } from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { Logger } from "../../shared/logger.js";

const DEFAULT_CACHE_CAPACITY = 50;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_USER_AGENT =
  "JAMRA Reader/1.0 (+https://github.com/shoobydoo/jamra)";

export interface ImageProxyOptions {
  cacheCapacity?: number;
  cacheTtlMs?: number;
  userAgent?: string;
}

export interface StreamRemoteImageOptions {
  url: string;
  headers?: Record<string, string>;
  cacheKey?: string;
}

interface CachedImage {
  buffer: Buffer;
  contentType: string;
  length: number;
  storedAt: number;
}

export class ImageProxyService {
  private readonly cache = new Map<string, CachedImage>();
  private readonly maxEntries: number;
  private readonly cacheTtl: number;
  private readonly userAgent: string;

  constructor(
    private readonly logger: Logger,
    options?: ImageProxyOptions,
  ) {
    this.maxEntries = options?.cacheCapacity ?? DEFAULT_CACHE_CAPACITY;
    this.cacheTtl = options?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.userAgent = options?.userAgent ?? DEFAULT_USER_AGENT;
  }

  async streamRemoteImage(
    res: Response,
    options: StreamRemoteImageOptions,
  ): Promise<void> {
    const cacheKey = options.cacheKey ?? options.url;
    const cached = this.getCachedImage(cacheKey);
    if (cached) {
      this.setResponseHeaders(res, cached.contentType, cached.length);
      res.end(cached.buffer);
      return;
    }

    const headers: Record<string, string> = {
      "User-Agent": this.userAgent,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      ...options.headers,
    };

    const referer =
      headers.Referer ??
      headers.referer ??
      options.headers?.Referer ??
      options.headers?.referer;

    delete headers.referer;
    if (referer) {
      headers.Referer = referer;
    } else {
      delete headers.Referer;
    }

    try {
      const response = await fetch(options.url, { headers });
      if (!response.ok || !response.body) {
        throw new Error(
          `Image proxy failed with status ${response.status} ${response.statusText}`,
        );
      }

      const contentType =
        response.headers.get("content-type") ?? "application/octet-stream";
      const contentLength =
        response.headers.get("content-length") ?? undefined;

      this.setResponseHeaders(res, contentType, contentLength);

      await this.streamAndCache(
        response.body,
        res,
        cacheKey,
        contentType,
      );
    } catch (error) {
      this.logger.error("Image proxy request failed", {
        url: options.url,
        error,
      });
      throw error;
    }
  }

  private async streamAndCache(
    body: ReadableStream<Uint8Array>,
    res: Response,
    cacheKey: string,
    contentType: string,
  ): Promise<void> {
    if (this.maxEntries <= 0 || typeof body.tee !== "function") {
      await pipeline(Readable.fromWeb(body), res);
      return;
    }

    const [cacheStream, responseStream] = body.tee();

    await Promise.all([
      pipeline(Readable.fromWeb(responseStream), res),
      this.captureStream(cacheStream)
        .then((buffer) => {
          if (buffer.length > 0) {
            this.saveToCache(cacheKey, {
              buffer,
              contentType,
              length: buffer.length,
              storedAt: Date.now(),
            });
          }
        })
        .catch((error) => {
          this.logger.warn("Failed to cache proxied image", { error });
        }),
    ]);
  }

  private async captureStream(
    stream: ReadableStream<Uint8Array>,
  ): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Buffer[] = [];

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        if (value) {
          chunks.push(
            Buffer.from(value.buffer, value.byteOffset, value.byteLength),
          );
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (chunks.length === 0) {
      return Buffer.alloc(0);
    }

    return Buffer.concat(chunks);
  }

  private getCachedImage(key: string): CachedImage | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }
    if (cached.storedAt + this.cacheTtl < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, cached);
    return cached;
  }

  private saveToCache(key: string, image: CachedImage): void {
    if (this.maxEntries <= 0) {
      return;
    }
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, image);

    while (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.cache.delete(oldestKey);
    }
  }

  private setResponseHeaders(
    res: Response,
    contentType: string,
    contentLength?: number | string,
  ): void {
    res.setHeader("Content-Type", contentType);
    if (contentLength !== undefined) {
      res.setHeader("Content-Length", contentLength.toString());
    }
    res.setHeader("Cache-Control", "private, max-age=300");
  }
}
