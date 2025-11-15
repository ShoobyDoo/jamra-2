import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type {
  ReadingProgress,
  UpsertProgressInput,
  ReadingProgressRow,
} from "./library.types.js";

// Map database row to ReadingProgress
const mapProgressRow = (row: ReadingProgressRow): ReadingProgress => {
  return {
    id: row.id,
    libraryId: row.library_id,
    chapterId: row.chapter_id,
    chapterNumber: row.chapter_number ?? undefined,
    pageNumber: row.page_number,
    totalPages: row.total_pages ?? undefined,
    lastRead: new Date(row.last_read),
    completed: row.completed === 1,
  };
};

// Reading progress repository interface
export interface ProgressRepository {
  get(libraryId: string, chapterId: string): Promise<ReadingProgress | null>;
  getByLibraryId(libraryId: string): Promise<ReadingProgress[]>;
  upsert(progress: UpsertProgressInput): Promise<ReadingProgress>;
  markChapterComplete(libraryId: string, chapterId: string): Promise<void>;
  getLastRead(libraryId: string): Promise<ReadingProgress | null>;
  deleteByLibraryId(libraryId: string): Promise<void>;
}

// SQLite implementation
class SqliteProgressRepository implements ProgressRepository {
  constructor(private readonly db: Database.Database) {}

  async get(
    libraryId: string,
    chapterId: string,
  ): Promise<ReadingProgress | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM reading_progress
      WHERE library_id = ? AND chapter_id = ?
    `);
    const row = stmt.get(libraryId, chapterId) as
      | ReadingProgressRow
      | undefined;

    if (!row) {
      return null;
    }

    return mapProgressRow(row);
  }

  async getByLibraryId(libraryId: string): Promise<ReadingProgress[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM reading_progress
      WHERE library_id = ?
      ORDER BY last_read DESC
    `);
    const rows = stmt.all(libraryId) as ReadingProgressRow[];

    return rows.map(mapProgressRow);
  }

  async upsert(input: UpsertProgressInput): Promise<ReadingProgress> {
    const existingProgress = await this.get(input.libraryId, input.chapterId);
    const id = existingProgress?.id ?? randomUUID();
    const now = new Date().toISOString();

    // Determine if chapter is completed
    const completed =
      input.totalPages !== undefined &&
      input.pageNumber >= input.totalPages - 1
        ? 1
        : 0;

    const stmt = this.db.prepare(`
      INSERT INTO reading_progress (
        id, library_id, chapter_id, chapter_number, page_number, total_pages, last_read, completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(library_id, chapter_id) DO UPDATE SET
        page_number = excluded.page_number,
        total_pages = excluded.total_pages,
        chapter_number = excluded.chapter_number,
        last_read = excluded.last_read,
        completed = excluded.completed
    `);

    stmt.run(
      id,
      input.libraryId,
      input.chapterId,
      input.chapterNumber ?? null,
      input.pageNumber,
      input.totalPages ?? null,
      now,
      completed,
    );

    const progress = await this.get(input.libraryId, input.chapterId);
    if (!progress) {
      throw new Error("Failed to upsert reading progress");
    }

    return progress;
  }

  async markChapterComplete(
    libraryId: string,
    chapterId: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE reading_progress
      SET completed = 1, last_read = ?
      WHERE library_id = ? AND chapter_id = ?
    `);
    stmt.run(now, libraryId, chapterId);
  }

  async getLastRead(libraryId: string): Promise<ReadingProgress | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM reading_progress
      WHERE library_id = ?
      ORDER BY last_read DESC
      LIMIT 1
    `);
    const row = stmt.get(libraryId) as ReadingProgressRow | undefined;

    if (!row) {
      return null;
    }

    return mapProgressRow(row);
  }

  async deleteByLibraryId(libraryId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM reading_progress WHERE library_id = ?
    `);
    stmt.run(libraryId);
  }
}

// Factory function
export const createProgressRepository = (
  db: Database.Database,
): ProgressRepository => {
  return new SqliteProgressRepository(db);
};
