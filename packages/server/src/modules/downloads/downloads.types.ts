export type DownloadStatus =
  | "queued"
  | "downloading"
  | "completed"
  | "failed"
  | "cancelled";

export interface Download {
  id: string;
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  extensionId: string;
  status: DownloadStatus;
  progress: number;
  totalPages?: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface DownloadedPage {
  id: string;
  downloadId: string;
  pageNumber: number;
  pageUrl: string;
  filePath: string;
  fileSize?: number;
  downloadedAt: Date;
}

export interface CreateDownloadInput {
  libraryId: string;
  extensionId: string;
  chapterIds: string[];
  chapterNumbers?: Record<string, string>;
}

export interface DownloadFilters {
  status?: DownloadStatus;
  libraryId?: string;
  extensionId?: string;
}

export interface DownloadStats {
  downloadCount: number;
  totalSize: number;
}

export interface DownloadRow {
  id: string;
  library_id: string;
  chapter_id: string;
  chapter_number: string | null;
  extension_id: string;
  status: string;
  progress: number;
  total_pages: number | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface DownloadedPageRow {
  id: string;
  download_id: string;
  page_number: number;
  page_url: string;
  file_path: string;
  file_size: number | null;
  downloaded_at: string;
}

export interface CreateDownloadRecordInput {
  libraryId: string;
  chapterId: string;
  extensionId: string;
  chapterNumber?: string;
}

export interface CreateDownloadedPageInput {
  downloadId: string;
  pageNumber: number;
  pageUrl: string;
  filePath: string;
  fileSize?: number;
}

