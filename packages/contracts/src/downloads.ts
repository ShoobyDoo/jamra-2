export type DownloadStatus =
  | "queued"
  | "downloading"
  | "completed"
  | "failed"
  | "cancelled";

export interface DownloadQueueItem {
  id: string;
  libraryId: string;
  chapterId: string;
  chapterNumber?: string;
  extensionId: string;
  status: DownloadStatus;
  progress: number;
  totalPages?: number;
  error?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface DownloadListResponse {
  downloads: DownloadQueueItem[];
}

export interface DownloadedPage {
  id: string;
  downloadId: string;
  pageNumber: number;
  pageUrl: string;
  filePath: string;
  fileSize?: number;
  downloadedAt: string;
}

export interface DownloadDetailsResponse {
  download: DownloadQueueItem;
  pages: DownloadedPage[];
}

export interface DownloadStats {
  downloadCount: number;
  totalSize: number;
}
