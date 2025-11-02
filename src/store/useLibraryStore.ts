import { create } from "zustand";

interface LibraryStore {
  selectedMangaIds: Set<string>;
  viewMode: "grid" | "list";
  sortBy: "title" | "lastRead" | "dateAdded";

  selectManga: (id: string) => void;
  deselectManga: (id: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: "grid" | "list") => void;
  setSortBy: (sort: "title" | "lastRead" | "dateAdded") => void;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  selectedMangaIds: new Set(),
  viewMode: "grid",
  sortBy: "title",

  selectManga: (id) => {
    // TODO: Implement
    set((state) => {
      const newSet = new Set(state.selectedMangaIds);
      newSet.add(id);
      return { selectedMangaIds: newSet };
    });
  },

  deselectManga: (id) => {
    // TODO: Implement
    set((state) => {
      const newSet = new Set(state.selectedMangaIds);
      newSet.delete(id);
      return { selectedMangaIds: newSet };
    });
  },

  clearSelection: () => set({ selectedMangaIds: new Set() }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sort) => set({ sortBy: sort }),
}));
