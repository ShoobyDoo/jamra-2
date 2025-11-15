export interface LibraryItem {
  id: string;
  mangaId: string;
  isFavorite: boolean;
  addedAt: number;
}

export interface ReadingProgress {
  id: string;
  mangaId: string;
  chapterId: string;
  currentPage: number;
  lastReadAt: number;
}
