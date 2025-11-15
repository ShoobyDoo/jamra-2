import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type {
  CreateDownloadRecordInput,
  CreateDownloadedPageInput,
  Download,
  DownloadFilters,
  DownloadStatus,
  DownloadedPage,
  DownloadedPageRow,
  DownloadRow,
} from "./downloads.types.js";

const mapDownloadRow = (row: DownloadRow): Download => ({
  id: row.id,
  libraryId: row.library_id,
  chapterId: row.chapter_id,
  chapterNumber: row.chapter_number ?? undefined,
  extensionId: row.extension_id,
  status: row.status as DownloadStatus,
  progress: row.progress,
  totalPages: row.total_pages ?? undefined,
  error: row.error ?? undefined,
  createdAt: new Date(row.created_at),
  startedAt: row.started_at ? new Date(row.started_at) : undefined,
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
});

const mapDownloadedPageRow = (row: DownloadedPageRow): DownloadedPage => ({
  id: row.id,
  downloadId: row.download_id,
  pageNumber: row.page_number,
  pageUrl: row.page_url,
  filePath: row.file_path,
  fileSize: row.file_size ?? undefined,
  downloadedAt: new Date(row.downloaded_at),
});

export interface DownloadsRepository {
  create(input: CreateDownloadRecordInput): Promise<Download>;
  findById(id: string): Promise<Download | null>;
  findByLibraryAndChapter(
    libraryId: string,
    chapterId: string,
  ): Promise<Download | null>;
  list(filters?: DownloadFilters): Promise<Download[]>;
  count(filters?: DownloadFilters): Promise<number>;
  getQueued(limit: number): Promise<Download[]>;
  markAsDownloading(id: string): Promise<void>;
  updateProgress(id: string, progress: number): Promise<void>;
  updateTotalPages(id: string, totalPages: number): Promise<void>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  markCancelled(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  requeueStuckDownloads(): Promise<void>;
  addDownloadedPage(input: CreateDownloadedPageInput): Promise<DownloadedPage>;
  listPages(downloadId: string): Promise<DownloadedPage[]>;
  findPage(downloadId: string, pageNumber: number): Promise<DownloadedPage | null>;
  removePages(downloadId: string): Promise<void>;
}

class SqliteDownloadsRepository implements DownloadsRepository {
  constructor(private readonly db: Database.Database) {}

  async create(input: CreateDownloadRecordInput): Promise<Download> {
    const now = new Date().toISOString();
    const id = randomUUID();

    const stmt = this.db.prepare(`
      INSERT INTO downloads (
        id, library_id, chapter_id, chapter_number, extension_id,
        status, progress, created_at
      ) VALUES (?, ?, ?, ?, ?, 'queued', 0, ?)
    `);
    stmt.run(
      id,
      input.libraryId,
      input.chapterId,
      input.chapterNumber ?? null,
      input.extensionId,
      now,
    );

    const download = await this.findById(id);
    if (!download) {
      throw new Error("Failed to create download record");
    }
    return download;
  }

  async findById(id: string): Promise<Download | null> {
    const stmt = this.db.prepare(`SELECT * FROM downloads WHERE id = ?`);
    const row = stmt.get(id) as DownloadRow | undefined;
    return row ? mapDownloadRow(row) : null;
  }

  async findByLibraryAndChapter(
    libraryId: string,
    chapterId: string,
  ): Promise<Download | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM downloads WHERE library_id = ? AND chapter_id = ?`,
    );
    const row = stmt.get(libraryId, chapterId) as DownloadRow | undefined;
    return row ? mapDownloadRow(row) : null;
  }

  async list(filters?: DownloadFilters): Promise<Download[]> {
    let query = `SELECT * FROM downloads WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.libraryId) {
      query += ` AND library_id = ?`;
      params.push(filters.libraryId);
    }

    if (filters?.extensionId) {
      query += ` AND extension_id = ?`;
      params.push(filters.extensionId);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as DownloadRow[];
    return rows.map(mapDownloadRow);
  }

  async count(filters?: DownloadFilters): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM downloads WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.libraryId) {
      query += ` AND library_id = ?`;
      params.push(filters.libraryId);
    }

    if (filters?.extensionId) {
      query += ` AND extension_id = ?`;
      params.push(filters.extensionId);
    }

    const stmt = this.db.prepare(query);
    const row = stmt.get(...params) as { count: number };
    return row.count;
  }

  async getQueued(limit: number): Promise<Download[]> {
    const stmt = this.db.prepare(
      `
      SELECT * FROM downloads
      WHERE status = 'queued'
      ORDER BY created_at ASC
      LIMIT ?
    `,
    );
    const rows = stmt.all(limit) as DownloadRow[];
    return rows.map(mapDownloadRow);
  }

  async markAsDownloading(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET status = 'downloading',
          started_at = COALESCE(started_at, ?),
          error = NULL
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET progress = ?
      WHERE id = ?
    `);
    stmt.run(progress, id);
  }

  async updateTotalPages(id: string, totalPages: number): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET total_pages = ?
      WHERE id = ?
    `);
    stmt.run(totalPages, id);
  }

  async markCompleted(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET status = 'completed',
          progress = 100,
          completed_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  }

  async markFailed(id: string, error: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET status = 'failed',
          error = ?,
          completed_at = ?
      WHERE id = ?
    `);
    stmt.run(error, new Date().toISOString(), id);
  }

  async markCancelled(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET status = 'cancelled',
          completed_at = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), id);
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM downloads WHERE id = ?`);
    stmt.run(id);
  }

  async requeueStuckDownloads(): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE downloads
      SET status = 'queued',
          started_at = NULL
      WHERE status = 'downloading'
    `);
    stmt.run();
  }

  async addDownloadedPage(
    input: CreateDownloadedPageInput,
  ): Promise<DownloadedPage> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO downloaded_pages (
        id, download_id, page_number, page_url, file_path, file_size, downloaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      input.downloadId,
      input.pageNumber,
      input.pageUrl,
      input.filePath,
      input.fileSize ?? null,
      now,
    );

    const page = await this.getPageById(id);
    if (!page) {
      throw new Error("Failed to persist downloaded page");
    }
    return page;
  }

  async listPages(downloadId: string): Promise<DownloadedPage[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM downloaded_pages
      WHERE download_id = ?
      ORDER BY page_number ASC
    `);
    const rows = stmt.all(downloadId) as DownloadedPageRow[];
    return rows.map(mapDownloadedPageRow);
  }

  async findPage(
    downloadId: string,
    pageNumber: number,
  ): Promise<DownloadedPage | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM downloaded_pages
      WHERE download_id = ? AND page_number = ?
    `);
    const row = stmt.get(
      downloadId,
      pageNumber,
    ) as DownloadedPageRow | undefined;
    return row ? mapDownloadedPageRow(row) : null;
  }

  async removePages(downloadId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM downloaded_pages WHERE download_id = ?
    `);
    stmt.run(downloadId);
  }

  private async getPageById(id: string): Promise<DownloadedPage | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM downloaded_pages WHERE id = ?`,
    );
    const row = stmt.get(id) as DownloadedPageRow | undefined;
    return row ? mapDownloadedPageRow(row) : null;
  }
}

export const createDownloadsRepository = (
  db: Database.Database,
): DownloadsRepository => {
  return new SqliteDownloadsRepository(db);
};
