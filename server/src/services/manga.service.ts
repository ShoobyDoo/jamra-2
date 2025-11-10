import type { CreateMangaInput, Manga } from "../types/manga.types.js";

export const mangaService = {
  getAll: async (): Promise<Manga[]> => {
    // TODO: Query database
    return [];
  },

  getById: async (_id: string): Promise<Manga | null> => {
    // TODO: Query database
    return null;
  },

  create: async (_data: CreateMangaInput): Promise<Manga> => {
    // TODO: Insert into database
    throw new Error("Not implemented");
  },

  update: async (_id: string, _data: Partial<Manga>): Promise<Manga> => {
    // TODO: Update database
    throw new Error("Not implemented");
  },

  delete: async (_id: string): Promise<void> => {
    // TODO: Delete from database
    throw new Error("Not implemented");
  },
};
