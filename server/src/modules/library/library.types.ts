// Library status types
export type LibraryStatus =
  | "reading"
  | "plan_to_read"
  | "completed"
  | "dropped"
  | "on_hold";

// Library item interface
export interface LibraryItem {
  id: string;
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  status: LibraryStatus;
  favorite: boolean;
  dateAdded: Date;
  lastUpdated: Date;
}

// Input type for creating library items
export interface CreateLibraryItemInput {
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  status: LibraryStatus;
}

// Input type for updating library items
export interface UpdateLibraryItemInput {
  status?: LibraryStatus;
  favorite?: boolean;
}

// Filters for library queries
export interface LibraryFilters {
  status?: LibraryStatus;
  favorite?: boolean;
  search?: string;
}

// Sort options
export interface LibrarySort {
  field: "dateAdded" | "lastUpdated" | "title";
  direction: "asc" | "desc";
}

// Pagination options
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

// Reading progress interface
export interface ReadingProgress {
  id: string;
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
  lastRead: Date;
  completed: boolean;
}

// Input type for upserting progress
export interface UpsertProgressInput {
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
}

// Database row types (internal)
export interface LibraryRow {
  id: string;
  manga_id: string;
  extension_id: string;
  title: string;
  cover_url: string | null;
  status: string;
  favorite: number;
  date_added: string;
  last_updated: string;
}

export interface ReadingProgressRow {
  id: string;
  library_id: string;
  chapter_id: string;
  chapter_number: string | null;
  page_number: number;
  total_pages: number | null;
  last_read: string;
  completed: number;
}
