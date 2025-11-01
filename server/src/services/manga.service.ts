import type { CreateMangaInput, Manga } from "../types/manga.types.js";

export const mangaService = {
  getAll: async (): Promise<Manga[]> => {
    // TODO: Query database
    return [];
  },

  getById: async (id: string): Promise<Manga | null> => {
    // TODO: Query database
    return null;
  },

  create: async (data: CreateMangaInput): Promise<Manga> => {
    // TODO: Insert into database
    throw new Error("Not implemented");
  },

  update: async (id: string, data: Partial<Manga>): Promise<Manga> => {
    // TODO: Update database
    throw new Error("Not implemented");
  },

  delete: async (id: string): Promise<void> => {
    // TODO: Delete from database
    throw new Error("Not implemented");
  },
};
