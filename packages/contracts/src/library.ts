export type LibraryStatus =
  | "reading"
  | "plan_to_read"
  | "completed"
  | "dropped"
  | "on_hold";

export interface LibraryItem {
  id: string;
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  status: LibraryStatus;
  favorite: boolean;
  dateAdded: string;
  lastUpdated: string;
}

export interface LibraryListResponse {
  items: LibraryItem[];
  total: number;
  limit?: number;
  offset: number;
}

export interface LibraryStats {
  total: number;
  reading: number;
  completed: number;
  planToRead: number;
  dropped: number;
  onHold: number;
}

export interface ReadingProgress {
  id: string;
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
  lastRead: string;
  completed: boolean;
}
