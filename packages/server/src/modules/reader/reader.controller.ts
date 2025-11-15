import type { Request, Response } from "express";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { DownloadedPageSource } from "./reader.types.js";
import { ReaderService } from "./reader.service.js";
import { ImageProxyService } from "./image-proxy.service.js";

const IMAGE_MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export class ReaderController {
  constructor(
    private readonly readerService: ReaderService,
    private readonly imageProxy: ImageProxyService,
  ) {}

  getChapter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { libraryId, chapterId } = req.params;
      if (!libraryId) {
        res.status(400).json({ message: "libraryId is required" });
        return;
      }
      if (!chapterId) {
        res.status(400).json({ message: "chapterId is required" });
        return;
      }

      const chapter = await this.readerService.getChapter(
        libraryId,
        chapterId,
      );
      res.json(chapter);
    } catch (error) {
      console.error("Failed to load reader chapter", error);
      throw error;
    }
  };

  getNextChapter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { libraryId, chapterId } = req.params;
      if (!libraryId || !chapterId) {
        res.status(400).json({
          message: "libraryId and chapterId are required",
        });
        return;
      }

      const chapter = await this.readerService.getNextChapter(
        libraryId,
        chapterId,
      );
      res.json(chapter);
    } catch (error) {
      console.error("Failed to load next reader chapter", error);
      throw error;
    }
  };

  getPreviousChapter = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { libraryId, chapterId } = req.params;
      if (!libraryId || !chapterId) {
        res.status(400).json({
          message: "libraryId and chapterId are required",
        });
        return;
      }

      const chapter = await this.readerService.getPreviousChapter(
        libraryId,
        chapterId,
      );
      res.json(chapter);
    } catch (error) {
      console.error("Failed to load previous reader chapter", error);
      throw error;
    }
  };

  getPageImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { libraryId, chapterId, pageNumber } = req.params;
      if (!libraryId || !chapterId) {
        res.status(400).json({
          message: "libraryId and chapterId are required",
        });
        return;
      }

      const parsedPage = Number.parseInt(pageNumber ?? "", 10);
      if (!Number.isFinite(parsedPage) || parsedPage <= 0) {
        res.status(400).json({ message: "pageNumber must be a positive integer" });
        return;
      }

      const source = await this.readerService.getPageSource(
        libraryId,
        chapterId,
        parsedPage,
      );

      if (source.type === "downloaded") {
        const streamed = await this.streamLocalPage(source, res);
        if (!streamed) {
          return;
        }
      } else {
        await this.imageProxy.streamRemoteImage(res, {
          url: source.url,
          headers: source.headers,
          cacheKey: `${libraryId}:${chapterId}:${parsedPage}:${source.url}`,
        });
      }

      await this.readerService.recordPageView(
        libraryId,
        chapterId,
        parsedPage,
      );
    } catch (error) {
      console.error("Failed to stream reader page", error);
      throw error;
    }
  };

  private async streamLocalPage(
    source: DownloadedPageSource,
    res: Response,
  ): Promise<boolean> {
    try {
      const fileStat = await stat(source.filePath);
      res.setHeader("Content-Type", this.resolveContentType(source.filePath));
      res.setHeader("Content-Length", fileStat.size.toString());
      res.setHeader("Cache-Control", "private, max-age=604800");

      await pipeline(createReadStream(source.filePath), res);
      return true;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        res.status(404).json({ message: "Requested page is unavailable" });
        return false;
      }
      throw error;
    }
  }

  private resolveContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    return IMAGE_MIME_MAP[ext] ?? "application/octet-stream";
  }
}
