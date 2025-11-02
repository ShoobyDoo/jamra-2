export interface DownloadQueueItem {
  id: string;
  mangaId: string;
  chapterId: string;
  status: "pending" | "downloading" | "completed" | "failed";
  progress: number;
  createdAt: number;
}

export interface CreateDownloadInput {
  mangaId: string;
  chapterId: string;
}
