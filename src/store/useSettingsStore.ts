import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  readingDirection: 'ltr' | 'rtl' | 'vertical';
  pageFitMode: 'width' | 'height' | 'original';
  theme: 'light' | 'dark' | 'auto';
  downloadQuality: 'original' | 'high' | 'medium';

  setReadingDirection: (direction: 'ltr' | 'rtl' | 'vertical') => void;
  setPageFitMode: (mode: 'width' | 'height' | 'original') => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setDownloadQuality: (quality: 'original' | 'high' | 'medium') => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      readingDirection: 'ltr',
      pageFitMode: 'width',
      theme: 'auto',
      downloadQuality: 'original',

      setReadingDirection: (direction) => set({ readingDirection: direction }),
      setPageFitMode: (mode) => set({ pageFitMode: mode }),
      setTheme: (theme) => set({ theme }),
      setDownloadQuality: (quality) => set({ downloadQuality: quality }),
    }),
    {
      name: 'manga-reader-settings',
    }
  )
);
