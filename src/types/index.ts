/**
 * Shared frontend types mirroring backend contracts.
 * Until we share types directly from the server, keep these in sync with
 * `docs/backend/endpoints.md` and server-side DTOs.
 */

export type SettingScope = "app" | "catalog" | "extensions" | "sandbox";

export interface Setting<T = unknown> {
  key: string;
  scope: SettingScope;
  value: T;
  updatedAt: string;
}

export interface CatalogEntry {
  id: string;
  repoId: string;
  slug: string;
  name: string;
  version: string;
  iconUrl?: string;
  archiveUrl: string;
  language?: string;
  description?: string;
  checksum?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogListResponse {
  entries: CatalogEntry[];
}

export interface CatalogSyncResult {
  repo: {
    id: string;
    name: string;
    url: string;
    type: string;
    lastSyncedAt?: string;
    checksum?: string;
  };
  entriesUpdated: number;
  entriesRemoved: number;
  checksum?: string;
}

export interface CatalogSyncResponse {
  status: string;
  repoId: string;
  result: CatalogSyncResult;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  entry: string;
  languages?: string[];
  [key: string]: unknown;
}

export interface ExtensionRecord {
  id: string;
  slug: string;
  name: string;
  version: string;
  repoSource: string;
  installPath: string;
  enabled: boolean;
  installedAt: string;
  manifest: ExtensionManifest;
}

export interface ExtensionsListResponse {
  extensions: ExtensionRecord[];
}

export interface ExtensionSearchResult {
  id: string;
  title: string;
  coverUrl?: string;
  description?: string;
  status?: string;
  lang?: string;
}

export interface ExtensionSearchResponse {
  results: ExtensionSearchResult[];
  hasMore: boolean;
}

export interface ExtensionChapter {
  id: string;
  chapterNumber?: string | number;
  title?: string;
  translatedLanguage?: string;
  updatedAt?: string;
}

export interface ExtensionChaptersResponse {
  chapters: ExtensionChapter[];
  metrics?: { totalChapters?: number };
}

export interface MangaDetails {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  tags?: string[];
  chapters?: ExtensionChapter[];
}

export interface MangaDetailsResponse {
  manga: MangaDetails;
}

export interface ExtensionPageDescriptor {
  index: number;
  imageUrl: string;
}

export interface ExtensionPagesResponse {
  pages: ExtensionPageDescriptor[];
}

export type InstallJobStatus =
  | "pending"
  | "downloading"
  | "compiling"
  | "installing"
  | "completed"
  | "failed";

export interface InstallJob {
  jobId: string;
  extensionId: string;
  status: InstallJobStatus;
  repositoryUrl: string;
  requestedAt: number;
  completedAt?: number | null;
  error?: string | null;
}

export type LibraryStatus =
  | "reading"
  | "completed"
  | "plan_to_read"
  | "dropped"
  | "on_hold";

export interface LibraryItem {
  id: string;
  mangaId: string;
  extensionId: string;
  title: string;
  status: LibraryStatus;
  favorite: boolean;
  coverUrl?: string;
  dateAdded: string;
  lastUpdated: string;
}

export interface LibraryListResponse {
  items: LibraryItem[];
  total: number;
  limit: number;
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

export interface ContinueReadingEntry {
  libraryId: string;
  mangaId: string;
  extensionId: string;
  title: string;
  coverUrl?: string;
  chapterId: string;
  chapterNumber?: string;
  pageNumber: number;
  totalPages?: number;
  progressPercent: number;
  lastReadAt: string;
  updatedAt: string;
}

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

export interface ReaderPageDescriptor {
  number: number;
  url: string;
}

export interface ReaderChapter {
  id: string;
  number?: string;
  title?: string;
  pages: ReaderPageDescriptor[];
  isDownloaded: boolean;
  previousChapterId: string | null;
  nextChapterId: string | null;
}

/**
 * WebSocket payload re-exports.
 */
export type {
  DownloadCancelledPayload,
  DownloadChapterCompletePayload,
  DownloadFailedPayload,
  DownloadPageCompletePayload,
  DownloadProgressPayload,
  DownloadStartedPayload,
  LibraryItemRemovedPayload,
  LibraryItemSnapshotPayload,
  LibraryItemUpdatedPayload,
  MangaUpdatedPayload,
} from "./websocket";
