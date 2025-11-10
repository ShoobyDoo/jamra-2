import type Database from "better-sqlite3";
import type {
  CatalogEntry,
  CatalogRepoSource,
  CatalogRepository,
} from "./catalog.types.js";

const mapRepoRow = (row: Record<string, unknown>): CatalogRepoSource => {
  return {
    id: row.id as string,
    name: row.name as string,
    url: row.url as string,
    type: row.type as "http" | "filesystem",
    checksum: row.checksum === null ? undefined : (row.checksum as string),
    lastSyncedAt:
      typeof row.last_synced_at === "number"
        ? new Date(row.last_synced_at)
        : undefined,
  };
};

const mapEntryRow = (row: Record<string, unknown>): CatalogEntry => {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    version: row.version as string,
    iconUrl: row.icon_url === null ? undefined : (row.icon_url as string),
    archiveUrl: row.archive_url as string,
    checksum: row.checksum === null ? undefined : (row.checksum as string),
    language: row.language === null ? undefined : (row.language as string),
    description:
      row.description === null ? undefined : (row.description as string),
    repoId: row.repo_id as string,
    createdAt: new Date(row.created_at as number),
    updatedAt: new Date(row.updated_at as number),
  };
};

export class SqliteCatalogRepository implements CatalogRepository {
  constructor(private readonly db: Database.Database) {}

  listEntries(repoId?: string): CatalogEntry[] {
    if (repoId) {
      const stmt = this.db.prepare(
        `SELECT * FROM catalog_entries WHERE repo_id = ? ORDER BY name ASC`,
      );
      const rows = stmt.all(repoId) as Record<string, unknown>[];
      return rows.map(mapEntryRow);
    }

    const stmt = this.db.prepare(
      `SELECT * FROM catalog_entries ORDER BY repo_id ASC, name ASC`,
    );
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map(mapEntryRow);
  }

  listRepos(): CatalogRepoSource[] {
    const stmt = this.db.prepare(`SELECT * FROM catalog_repos ORDER BY name`);
    const rows = stmt.all() as Record<string, unknown>[];
    return rows.map(mapRepoRow);
  }

  getRepo(repoId: string): CatalogRepoSource | null {
    const stmt = this.db.prepare(`SELECT * FROM catalog_repos WHERE id = ?`);
    const row = stmt.get(repoId) as Record<string, unknown> | undefined;
    return row ? mapRepoRow(row) : null;
  }

  upsertRepo(repo: CatalogRepoSource): void {
    const now = Date.now();
    const stmt = this.db.prepare(
      `INSERT INTO catalog_repos (
        id, name, url, type, checksum, last_synced_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        url = excluded.url,
        type = excluded.type,
        checksum = excluded.checksum,
        last_synced_at = excluded.last_synced_at,
        updated_at = excluded.updated_at`,
    );

    stmt.run(
      repo.id,
      repo.name,
      repo.url,
      repo.type,
      repo.checksum ?? null,
      repo.lastSyncedAt ? repo.lastSyncedAt.getTime() : null,
      now,
      now,
    );
  }

  upsertEntries(repoId: string, entries: CatalogEntry[]): void {
    const insert = this.db.prepare(
      `INSERT INTO catalog_entries (
        id, repo_id, slug, name, version, icon_url,
        archive_url, checksum, language, description,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        slug = excluded.slug,
        name = excluded.name,
        version = excluded.version,
        icon_url = excluded.icon_url,
        archive_url = excluded.archive_url,
        checksum = excluded.checksum,
        language = excluded.language,
        description = excluded.description,
        updated_at = excluded.updated_at`,
    );

    const transaction = this.db.transaction((items: CatalogEntry[]) => {
      for (const entry of items) {
        insert.run(
          entry.id,
          repoId,
          entry.slug,
          entry.name,
          entry.version,
          entry.iconUrl ?? null,
          entry.archiveUrl,
          entry.checksum ?? null,
          entry.language ?? null,
          entry.description ?? null,
          entry.createdAt.getTime(),
          entry.updatedAt.getTime(),
        );
      }
    });

    transaction(entries);
  }

  deleteMissingEntries(repoId: string, keepIds: string[]): void {
    if (keepIds.length === 0) {
      const stmt = this.db.prepare(
        `DELETE FROM catalog_entries WHERE repo_id = ?`,
      );
      stmt.run(repoId);
      return;
    }

    const placeholders = keepIds.map(() => "?").join(",");
    const stmt = this.db.prepare(
      `DELETE FROM catalog_entries WHERE repo_id = ? AND id NOT IN (${placeholders})`,
    );
    stmt.run(repoId, ...keepIds);
  }
}

export const createCatalogRepository = (
  db: Database.Database,
): CatalogRepository => {
  return new SqliteCatalogRepository(db);
};
