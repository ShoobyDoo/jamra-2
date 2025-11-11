import type Database from "better-sqlite3";
import type {
  Setting,
  SettingScope,
  SettingsRepository,
} from "./settings.types.js";

const mapSettingRow = <T = unknown>(
  row: Record<string, unknown>,
): Setting<T> => {
  return {
    key: row.key as string,
    scope: row.scope as SettingScope,
    value: JSON.parse(row.value_json as string) as T,
    updatedAt: new Date(row.updated_at as number),
  };
};

export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: Database.Database) {}

  async get<T>(
    key: string,
    scope: SettingScope = "app",
  ): Promise<Setting<T> | null> {
    const stmt = this.db.prepare(
      `SELECT * FROM settings WHERE key = ? AND scope = ?`,
    );
    const row = stmt.get(key, scope) as Record<string, unknown> | undefined;
    return row ? mapSettingRow<T>(row) : null;
  }

  async set<T>(
    key: string,
    value: T,
    scope: SettingScope = "app",
  ): Promise<void> {
    const now = Date.now();
    const valueJson = JSON.stringify(value);

    const stmt = this.db.prepare(
      `INSERT INTO settings (key, scope, value_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
    );

    stmt.run(key, scope, valueJson, now);
  }

  async list(scope?: SettingScope): Promise<Setting[]> {
    let stmt: Database.Statement;
    let rows: unknown[];

    if (scope) {
      stmt = this.db.prepare(`SELECT * FROM settings WHERE scope = ?`);
      rows = stmt.all(scope);
    } else {
      stmt = this.db.prepare(`SELECT * FROM settings`);
      rows = stmt.all();
    }

    return (rows as Record<string, unknown>[]).map(mapSettingRow);
  }

  async remove(key: string): Promise<void> {
    const stmt = this.db.prepare(`DELETE FROM settings WHERE key = ?`);
    stmt.run(key);
  }
}

export const createSettingsRepository = (
  db: Database.Database,
): SettingsRepository => {
  return new SqliteSettingsRepository(db);
};
