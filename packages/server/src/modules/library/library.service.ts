import type { LibraryRepository } from "./library.repository.js";
import type { ProgressRepository } from "./progress.repository.js";
import type {
  LibraryItem,
  CreateLibraryItemInput,
  UpdateLibraryItemInput,
  LibraryFilters,
  LibrarySort,
  PaginationOptions,
  ReadingProgress,
  UpsertProgressInput,
} from "./library.types.js";
import { ValidationError } from "../../shared/errors.js";
import {
  emitLibraryItemAdded,
  emitLibraryItemRemoved,
  emitLibraryItemUpdated,
} from "../../websocket/handlers.js";

const createSnapshotPayload = (item: LibraryItem) => ({
  libraryId: item.id,
  mangaId: item.mangaId,
  extensionId: item.extensionId,
  title: item.title,
  coverUrl: item.coverUrl,
  status: item.status,
  favorite: item.favorite,
  timestamp: Date.now(),
});

const createRemovedPayload = (item: LibraryItem) => ({
  libraryId: item.id,
  mangaId: item.mangaId,
  extensionId: item.extensionId,
  title: item.title,
  timestamp: Date.now(),
});

export class LibraryService {
  constructor(
    private readonly libraryRepository: LibraryRepository,
    private readonly progressRepository: ProgressRepository,
  ) {}

  // Library item operations
  async addToLibrary(input: CreateLibraryItemInput): Promise<LibraryItem> {
    // Check if manga already exists in library
    const existing = await this.libraryRepository.getByMangaId(
      input.mangaId,
      input.extensionId,
    );

    if (existing) {
      throw new ValidationError(
        "This manga is already in your library",
      );
    }

    const created = await this.libraryRepository.add(input);
    emitLibraryItemAdded(createSnapshotPayload(created));
    return created;
  }

  async removeFromLibrary(id: string): Promise<void> {
    const item = await this.libraryRepository.get(id);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    // Delete all reading progress for this item (cascade should handle this, but explicit is better)
    await this.progressRepository.deleteByLibraryId(id);

    await this.libraryRepository.remove(id);
    emitLibraryItemRemoved(createRemovedPayload(item));
  }

  async getLibraryItem(id: string): Promise<LibraryItem> {
    const item = await this.libraryRepository.get(id);
    if (!item) {
      throw new ValidationError("Library item not found");
    }
    return item;
  }

  async getLibraryItemByMangaId(
    mangaId: string,
    extensionId: string,
  ): Promise<LibraryItem | null> {
    return this.libraryRepository.getByMangaId(mangaId, extensionId);
  }

  async listLibraryItems(
    filters?: LibraryFilters,
    sort?: LibrarySort,
    pagination?: PaginationOptions,
  ): Promise<{ items: LibraryItem[]; total: number }> {
    const items = await this.libraryRepository.list(filters, sort, pagination);
    const total = await this.libraryRepository.count(filters);

    return { items, total };
  }

  async updateLibraryItem(
    id: string,
    input: UpdateLibraryItemInput,
  ): Promise<LibraryItem> {
    const item = await this.libraryRepository.get(id);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    await this.libraryRepository.update(id, input);

    const updated = await this.getLibraryItem(id);
    const changes: Record<string, unknown> = {};
    if (input.status !== undefined) {
      changes.status = updated.status;
    }
    if (input.favorite !== undefined) {
      changes.favorite = updated.favorite;
    }

    if (Object.keys(changes).length > 0) {
      emitLibraryItemUpdated({
        ...createSnapshotPayload(updated),
        changes: changes as {
          status?: LibraryItem["status"];
          favorite?: boolean;
        },
      });
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: LibraryItem["status"],
  ): Promise<LibraryItem> {
    const item = await this.libraryRepository.get(id);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    await this.libraryRepository.updateStatus(id, status);

    const updated = await this.getLibraryItem(id);
    emitLibraryItemUpdated({
      ...createSnapshotPayload(updated),
      changes: { status: updated.status },
    });
    return updated;
  }

  async toggleFavorite(id: string): Promise<LibraryItem> {
    const item = await this.libraryRepository.get(id);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    await this.libraryRepository.toggleFavorite(id);

    const updated = await this.getLibraryItem(id);
    emitLibraryItemUpdated({
      ...createSnapshotPayload(updated),
      changes: { favorite: updated.favorite },
    });
    return updated;
  }

  // Reading progress operations
  async getProgress(
    libraryId: string,
    chapterId?: string,
  ): Promise<ReadingProgress | ReadingProgress[] | null> {
    // Verify library item exists
    const item = await this.libraryRepository.get(libraryId);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    if (chapterId) {
      return this.progressRepository.get(libraryId, chapterId);
    }

    return this.progressRepository.getByLibraryId(libraryId);
  }

  async getAllProgress(libraryId: string): Promise<ReadingProgress[]> {
    // Verify library item exists
    const item = await this.libraryRepository.get(libraryId);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    return this.progressRepository.getByLibraryId(libraryId);
  }

  async updateProgress(
    input: UpsertProgressInput,
  ): Promise<ReadingProgress> {
    // Verify library item exists
    const item = await this.libraryRepository.get(input.libraryId);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    // Validate page number
    if (input.pageNumber < 0) {
      throw new ValidationError("Page number cannot be negative");
    }

    if (
      input.totalPages !== undefined &&
      input.pageNumber > input.totalPages
    ) {
      throw new ValidationError(
        "Page number cannot exceed total pages",
      );
    }

    // Update progress
    const progress = await this.progressRepository.upsert(input);

    // Update library item's lastUpdated timestamp
    await this.libraryRepository.update(input.libraryId, {});

    return progress;
  }

  async markChapterComplete(
    libraryId: string,
    chapterId: string,
  ): Promise<void> {
    // Verify library item exists
    const item = await this.libraryRepository.get(libraryId);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    await this.progressRepository.markChapterComplete(libraryId, chapterId);

    // Update library item's lastUpdated timestamp
    await this.libraryRepository.update(libraryId, {});
  }

  async getLastRead(libraryId: string): Promise<ReadingProgress | null> {
    // Verify library item exists
    const item = await this.libraryRepository.get(libraryId);
    if (!item) {
      throw new ValidationError("Library item not found");
    }

    return this.progressRepository.getLastRead(libraryId);
  }

  // Utility methods
  async getLibraryStats(): Promise<{
    total: number;
    reading: number;
    completed: number;
    planToRead: number;
    dropped: number;
    onHold: number;
  }> {
    const [total, reading, completed, planToRead, dropped, onHold] =
      await Promise.all([
        this.libraryRepository.count(),
        this.libraryRepository.count({ status: "reading" }),
        this.libraryRepository.count({ status: "completed" }),
        this.libraryRepository.count({ status: "plan_to_read" }),
        this.libraryRepository.count({ status: "dropped" }),
        this.libraryRepository.count({ status: "on_hold" }),
      ]);

    return {
      total,
      reading,
      completed,
      planToRead,
      dropped,
      onHold,
    };
  }
}
