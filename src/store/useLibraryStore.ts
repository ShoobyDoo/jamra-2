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
    set((state) => {
      if (state.selectedMangaIds.has(id)) {
        return state;
      }
      const newSet = new Set(state.selectedMangaIds);
      newSet.add(id);
      return { selectedMangaIds: newSet };
    });
  },

  deselectManga: (id) => {
    set((state) => {
      if (!state.selectedMangaIds.has(id)) {
        return state;
      }
      const newSet = new Set(state.selectedMangaIds);
      newSet.delete(id);
      return { selectedMangaIds: newSet };
    });
  },

  clearSelection: () =>
    set((state) => {
      if (state.selectedMangaIds.size === 0) {
        return state;
      }
      return { selectedMangaIds: new Set() };
    }),
  setViewMode: (mode) =>
    set((state) => {
      if (state.viewMode === mode) {
        return state;
      }
      return { viewMode: mode };
    }),
  setSortBy: (sort) =>
    set((state) => {
      if (state.sortBy === sort) {
        return state;
      }
      return { sortBy: sort };
    }),
}));
