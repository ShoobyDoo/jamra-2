import type { Chapter, CreateChapterInput } from "../types/chapter.types.js";

export const chapterService = {
  getAll: async (): Promise<Chapter[]> => {
    // TODO: Query database
    return [];
  },

  getByMangaId: async (_mangaId: string): Promise<Chapter[]> => {
    // TODO: Query database for chapters by manga ID
    return [];
  },

  getById: async (_id: string): Promise<Chapter | null> => {
    // TODO: Query database
    return null;
  },

  create: async (_data: CreateChapterInput): Promise<Chapter> => {
    // TODO: Insert into database
    throw new Error("Not implemented");
  },

  delete: async (_id: string): Promise<void> => {
    // TODO: Delete from database
    throw new Error("Not implemented");
  },
};
