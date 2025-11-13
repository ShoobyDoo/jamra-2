import type { Logger } from "../../shared/logger.js";
import { ValidationError } from "../../shared/errors.js";
import type { LibraryRepository } from "../library/library.repository.js";
import type { LibraryItem } from "../library/library.types.js";
import {
  emitDownloadCancelled,
  emitDownloadFailed,
  emitDownloadStarted,
} from "../../websocket/handlers.js";
import type { DownloadsRepository } from "./downloads.repository.js";
import type { DownloadFileManager } from "./storage/file-manager.js";
import type {
  CreateDownloadInput,
  Download,
  DownloadFilters,
  DownloadedPage,
  DownloadStats,
} from "./downloads.types.js";
import {
  ChapterDownloader,
  DownloadCancelledError,
} from "./downloader.service.js";
import type {
  ExtensionRegistry,
  ExtensionRuntime,
} from "../extensions/extensions.types.js";

const DEFAULT_CONCURRENCY = 3;

interface DownloadsServiceDeps {
  repository: DownloadsRepository;
  libraryRepository: LibraryRepository;
  fileManager: DownloadFileManager;
  registry: ExtensionRegistry;
  runtime: ExtensionRuntime;
  logger: Logger;
  concurrency?: number;
}

export class DownloadsService {
  private readonly downloader: ChapterDownloader;
  private readonly maxConcurrency: number;
  private readonly activeDownloads = new Map<string, Promise<void>>();
  private readonly abortControllers = new Map<string, AbortController>();
  private readonly cancelledDownloads = new Set<string>();
  private processingQueue = false;
  private queueRequested = false;

  constructor(private readonly deps: DownloadsServiceDeps) {
    this.maxConcurrency = deps.concurrency ?? DEFAULT_CONCURRENCY;
    this.downloader = new ChapterDownloader({
      registry: deps.registry,
      runtime: deps.runtime,
      repository: deps.repository,
      fileManager: deps.fileManager,
      logger: deps.logger,
    });
  }

  async initialize(): Promise<void> {
    await this.deps.repository.requeueStuckDownloads();
    await this.triggerQueueProcessing();
  }

  async listDownloads(filters?: DownloadFilters): Promise<Download[]> {
    return this.deps.repository.list(filters);
  }

  async getDownload(id: string): Promise<Download | null> {
    return this.deps.repository.findById(id);
  }

  async getDownloadWithPages(
    id: string,
  ): Promise<{ download: Download; pages: DownloadedPage[] } | null> {
    const download = await this.deps.repository.findById(id);
    if (!download) {
      return null;
    }
    const pages = await this.deps.repository.listPages(id);
    return { download, pages };
  }

  async getStats(): Promise<DownloadStats> {
    const storage = await this.deps.fileManager.getStorageStats();
    const downloadCount = await this.deps.repository.count();
    return {
      totalSize: storage.totalBytes,
      downloadCount,
    };
  }

  async queueDownloads(input: CreateDownloadInput): Promise<Download[]> {
    if (!input.chapterIds?.length) {
      throw new ValidationError("At least one chapterId is required");
    }

    const libraryItem = await this.getLibraryItem(input.libraryId);

    if (libraryItem.extensionId !== input.extensionId) {
      throw new ValidationError(
        "Extension ID does not match the library item",
      );
    }

    const created: Download[] = [];

    for (const chapterId of input.chapterIds) {
      const existing = await this.deps.repository.findByLibraryAndChapter(
        input.libraryId,
        chapterId,
      );

      if (existing && existing.status !== "failed" && existing.status !== "cancelled") {
        continue;
      }

      if (existing) {
        await this.deps.repository.delete(existing.id);
        await this.deps.fileManager.deleteDownload(existing.id);
      }

      const download = await this.deps.repository.create({
        libraryId: input.libraryId,
        extensionId: input.extensionId,
        chapterId,
        chapterNumber: input.chapterNumbers?.[chapterId],
      });

      created.push(download);
    }

    if (created.length > 0) {
      await this.triggerQueueProcessing();
    }

    return created;
  }

  async cancelDownload(id: string): Promise<void> {
    const download = await this.deps.repository.findById(id);
    if (!download) {
      throw new ValidationError("Download not found");
    }

    if (download.status === "completed" || download.status === "failed") {
      throw new ValidationError(
        "Cannot cancel a completed or failed download",
      );
    }

    if (download.status === "cancelled") {
      return;
    }

    this.cancelledDownloads.add(id);
    await this.deps.repository.markCancelled(id);
    await this.deps.repository.removePages(id);
    await this.deps.fileManager.deleteDownload(id);

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
    }

    emitDownloadCancelled({
      downloadId: download.id,
      chapterId: download.chapterId,
      timestamp: Date.now(),
    });
  }

  private async triggerQueueProcessing(): Promise<void> {
    if (this.processingQueue) {
      this.queueRequested = true;
      return;
    }

    this.processingQueue = true;
    try {
      do {
        this.queueRequested = false;

        while (this.activeDownloads.size < this.maxConcurrency) {
          const availableSlots = this.maxConcurrency - this.activeDownloads.size;
          const queued = await this.deps.repository.getQueued(availableSlots);
          if (queued.length === 0) {
            break;
          }

          for (const download of queued) {
            const libraryItem = await this.getLibraryItem(download.libraryId);
            this.startDownload(download, libraryItem);
            if (this.activeDownloads.size >= this.maxConcurrency) {
              break;
            }
          }
        }
      } while (this.queueRequested);
    } finally {
      this.processingQueue = false;
    }
  }

  private startDownload(download: Download, libraryItem: LibraryItem): void {
    const controller = new AbortController();
    this.abortControllers.set(download.id, controller);

    const task = this.runDownload(download, libraryItem, controller)
      .catch((error) => {
        if (error instanceof DownloadCancelledError) {
          return;
        }
        this.deps.logger.error("Download failed", {
          downloadId: download.id,
          error,
        });
      })
      .finally(() => {
        this.activeDownloads.delete(download.id);
        this.abortControllers.delete(download.id);
        this.cancelledDownloads.delete(download.id);
        void this.triggerQueueProcessing();
      });

    this.activeDownloads.set(download.id, task);
  }

  private async runDownload(
    download: Download,
    libraryItem: LibraryItem,
    controller: AbortController,
  ): Promise<void> {
    try {
      await this.deps.repository.markAsDownloading(download.id);
      await this.deps.repository.removePages(download.id);
      await this.deps.fileManager.deleteDownload(download.id);

      emitDownloadStarted({
        downloadId: download.id,
        mangaId: libraryItem.mangaId,
        chapterId: download.chapterId,
        timestamp: Date.now(),
      });

      await this.downloader.downloadChapter(download, libraryItem, {
        signal: controller.signal,
        isCancelled: () => this.cancelledDownloads.has(download.id),
      });

      if (this.cancelledDownloads.has(download.id)) {
        throw new DownloadCancelledError();
      }

      await this.deps.repository.markCompleted(download.id);
    } catch (error) {
      if (error instanceof DownloadCancelledError) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.deps.repository.markFailed(download.id, errorMessage);
      emitDownloadFailed({
        downloadId: download.id,
        chapterId: download.chapterId,
        error: errorMessage,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  private async getLibraryItem(libraryId: string): Promise<LibraryItem> {
    const libraryItem = await this.deps.libraryRepository.get(libraryId);
    if (!libraryItem) {
      throw new ValidationError("Library item not found");
    }
    return libraryItem;
  }
}
