import type Database from "better-sqlite3";
import type { ExtensionRecord, ExtensionRegistry } from "../extensions.types.js";
import { ValidationError } from "../../../shared/errors.js";

interface ExtensionRow {
  id: string;
  slug: string;
  name: string;
  version: string;
  repo_source: string | null;
  install_path: string;
  manifest_json: string;
  enabled: number;
  installed_at: number;
  updated_at: number;
  checksum: string | null;
}

export class SqliteExtensionRegistry implements ExtensionRegistry {
  constructor(private readonly db: Database.Database) {}

  async list(): Promise<ExtensionRecord[]> {
    const stmt = this.db.prepare(
      `SELECT id, slug, name, version, repo_source, install_path,
              manifest_json, enabled, installed_at, updated_at, checksum
         FROM extensions
         ORDER BY name ASC`,
    );
    const rows = stmt.all() as ExtensionRow[];
    return rows.map((row) => this.mapRowToRecord(row));
  }

  async findById(_id: string): Promise<ExtensionRecord | null> {
    const stmt = this.db.prepare(
      `SELECT id, slug, name, version, repo_source, install_path,
              manifest_json, enabled, installed_at, updated_at, checksum
         FROM extensions
         WHERE id = ?`,
    );
    const row = stmt.get(_id) as ExtensionRow | undefined;
    return row ? this.mapRowToRecord(row) : null;
  }

  async upsert(_record: ExtensionRecord): Promise<void> {
    const record = _record;
    const manifestJson = JSON.stringify(record.manifest);
    const installedAt = record.installedAt?.getTime() ?? Date.now();
    const updatedAt = Date.now();

    const stmt = this.db.prepare(
      `INSERT INTO extensions (
          id, slug, name, version, repo_source, install_path,
          manifest_json, enabled, installed_at, updated_at, checksum
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          slug = excluded.slug,
          name = excluded.name,
          version = excluded.version,
          repo_source = excluded.repo_source,
          install_path = excluded.install_path,
          manifest_json = excluded.manifest_json,
          enabled = excluded.enabled,
          installed_at = excluded.installed_at,
          updated_at = excluded.updated_at,
          checksum = excluded.checksum`,
    );

    stmt.run(
      record.id,
      record.slug,
      record.name,
      record.version,
      record.repoSource ?? null,
      record.installPath,
      manifestJson,
      record.enabled ? 1 : 0,
      installedAt,
      updatedAt,
      record.checksum ?? null,
    );
  }

  async setEnabled(_id: string, _enabled: boolean): Promise<void> {
    const stmt = this.db.prepare(
      `UPDATE extensions SET enabled = ?, updated_at = ? WHERE id = ?`,
    );
    const result = stmt.run(
      _enabled ? 1 : 0,
      Date.now(),
      _id,
    );
    if (result.changes === 0) {
      throw new ValidationError(`Extension ${_id} does not exist`);
    }
  }

  async remove(_id: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM extensions WHERE id = ?`);
    stmt.run(_id);
  }

  private mapRowToRecord(row: ExtensionRow): ExtensionRecord {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      version: row.version,
      repoSource: row.repo_source ?? undefined,
      installPath: row.install_path,
      manifest: JSON.parse(row.manifest_json),
      enabled: row.enabled === 1,
      installedAt: new Date(row.installed_at),
      checksum: row.checksum ?? undefined,
    };
  }
}

export const createExtensionRegistry = (
  db: Database.Database,
): ExtensionRegistry => {
  return new SqliteExtensionRegistry(db);
};
