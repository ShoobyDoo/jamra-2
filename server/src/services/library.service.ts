import type { LibraryItem, ReadingProgress } from "../types/library.types.js";

export const libraryService = {
  getAll: async (): Promise<LibraryItem[]> => {
    // TODO: Query database
    return [];
  },

  addManga: async (_mangaId: string): Promise<LibraryItem> => {
    // TODO: Insert into library
    throw new Error("Not implemented");
  },

  removeManga: async (_mangaId: string): Promise<void> => {
    // TODO: Remove from library
    throw new Error("Not implemented");
  },

  getProgress: async (_mangaId: string): Promise<ReadingProgress | null> => {
    // TODO: Get reading progress
    return null;
  },

  updateProgress: async (
    _mangaId: string,
    _chapterId: string,
    _page: number,
  ): Promise<ReadingProgress> => {
    // TODO: Update reading progress
    throw new Error("Not implemented");
  },
};
