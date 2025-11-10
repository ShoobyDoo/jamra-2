import { create } from "zustand";

interface ReaderStore {
  currentPage: number;
  totalPages: number;
  isFullscreen: boolean;

  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleFullscreen: () => void;
}

export const useReaderStore = create<ReaderStore>((set) => ({
  currentPage: 0,
  totalPages: 0,
  isFullscreen: false,

  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),

  nextPage: () =>
    set((state) => ({
      currentPage:
        state.currentPage < state.totalPages - 1
          ? state.currentPage + 1
          : state.currentPage,
    })),

  prevPage: () =>
    set((state) => ({
      currentPage: state.currentPage > 0 ? state.currentPage - 1 : 0,
    })),

  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
