import type Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type {
  LibraryItem,
  CreateLibraryItemInput,
  UpdateLibraryItemInput,
  LibraryFilters,
  LibrarySort,
  PaginationOptions,
  LibraryRow,
} from "./library.types.js";

// Map database row to LibraryItem
const mapLibraryRow = (row: LibraryRow): LibraryItem => {
  return {
    id: row.id,
    mangaId: row.manga_id,
    extensionId: row.extension_id,
    title: row.title,
    coverUrl: row.cover_url ?? undefined,
    status: row.status as LibraryItem["status"],
    favorite: row.favorite === 1,
    dateAdded: new Date(row.date_added),
    lastUpdated: new Date(row.last_updated),
  };
};

// Library repository interface
export interface LibraryRepository {
  add(item: CreateLibraryItemInput): Promise<LibraryItem>;
  remove(id: string): Promise<void>;
  get(id: string): Promise<LibraryItem | null>;
  getByMangaId(
    mangaId: string,
    extensionId: string,
  ): Promise<LibraryItem | null>;
  list(
    filters?: LibraryFilters,
    sort?: LibrarySort,
    pagination?: PaginationOptions,
  ): Promise<LibraryItem[]>;
  updateStatus(id: string, status: LibraryItem["status"]): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  update(id: string, input: UpdateLibraryItemInput): Promise<void>;
  count(filters?: LibraryFilters): Promise<number>;
}

// SQLite implementation
class SqliteLibraryRepository implements LibraryRepository {
  constructor(private readonly db: Database.Database) {}

  async add(input: CreateLibraryItemInput): Promise<LibraryItem> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO library (
        id, manga_id, extension_id, title, cover_url, status, favorite, date_added, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.mangaId,
      input.extensionId,
      input.title,
      input.coverUrl ?? null,
      input.status,
      0, // favorite defaults to false
      now,
      now,
    );

    const item = await this.get(id);
    if (!item) {
      throw new Error("Failed to create library item");
    }

    return item;
  }

  async remove(id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM library WHERE id = ?`);
    stmt.run(id);
  }

  async get(id: string): Promise<LibraryItem | null> {
    const stmt = this.db.prepare(`SELECT * FROM library WHERE id = ?`);
    const row = stmt.get(id) as LibraryRow | undefined;

    if (!row) {
      return null;
    }

    return mapLibraryRow(row);
  }

  async getByMangaId(
    mangaId: string,
    extensionId: string,
  ): Promise<LibraryItem | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM library
      WHERE manga_id = ? AND extension_id = ?
    `);
    const row = stmt.get(mangaId, extensionId) as LibraryRow | undefined;

    if (!row) {
      return null;
    }

    return mapLibraryRow(row);
  }

  async list(
    filters?: LibraryFilters,
    sort?: LibrarySort,
    pagination?: PaginationOptions,
  ): Promise<LibraryItem[]> {
    let query = `SELECT * FROM library WHERE 1=1`;
    const params: unknown[] = [];

    // Apply filters
    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.favorite !== undefined) {
      query += ` AND favorite = ?`;
      params.push(filters.favorite ? 1 : 0);
    }

    if (filters?.search) {
      query += ` AND title LIKE ?`;
      params.push(`%${filters.search}%`);
    }

    // Apply sorting
    if (sort) {
      const fieldMap: Record<LibrarySort["field"], string> = {
        dateAdded: "date_added",
        lastUpdated: "last_updated",
        title: "title",
      };
      const dbField = fieldMap[sort.field];
      query += ` ORDER BY ${dbField} ${sort.direction.toUpperCase()}`;
    } else {
      // Default sort by last updated descending
      query += ` ORDER BY last_updated DESC`;
    }

    // Apply pagination
    if (pagination?.limit) {
      query += ` LIMIT ?`;
      params.push(pagination.limit);
    }

    if (pagination?.offset) {
      query += ` OFFSET ?`;
      params.push(pagination.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as LibraryRow[];

    return rows.map(mapLibraryRow);
  }

  async updateStatus(id: string, status: LibraryItem["status"]): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE library
      SET status = ?, last_updated = ?
      WHERE id = ?
    `);
    stmt.run(status, now, id);
  }

  async toggleFavorite(id: string): Promise<void> {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE library
      SET favorite = CASE WHEN favorite = 1 THEN 0 ELSE 1 END,
          last_updated = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
  }

  async update(id: string, input: UpdateLibraryItemInput): Promise<void> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.status !== undefined) {
      updates.push("status = ?");
      params.push(input.status);
    }

    if (input.favorite !== undefined) {
      updates.push("favorite = ?");
      params.push(input.favorite ? 1 : 0);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push("last_updated = ?");
    params.push(now);
    params.push(id);

    const query = `UPDATE library SET ${updates.join(", ")} WHERE id = ?`;
    const stmt = this.db.prepare(query);
    stmt.run(...params);
  }

  async count(filters?: LibraryFilters): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM library WHERE 1=1`;
    const params: unknown[] = [];

    if (filters?.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters?.favorite !== undefined) {
      query += ` AND favorite = ?`;
      params.push(filters.favorite ? 1 : 0);
    }

    if (filters?.search) {
      query += ` AND title LIKE ?`;
      params.push(`%${filters.search}%`);
    }

    const stmt = this.db.prepare(query);
    const result = stmt.get(...params) as { count: number };

    return result.count;
  }
}

// Factory function
export const createLibraryRepository = (
  db: Database.Database,
): LibraryRepository => {
  return new SqliteLibraryRepository(db);
};
