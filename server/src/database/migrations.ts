import type Database from "better-sqlite3";

// Migration interface
interface Migration {
  version: number;
  description: string;
  up: (db: Database.Database) => void;
}

// Initialize migrations table
const initMigrationsTable = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    )
  `);
};

// Get list of applied migrations
const getAppliedMigrations = (db: Database.Database): number[] => {
  const stmt = db.prepare(`SELECT version FROM migrations ORDER BY version`);
  const rows = stmt.all() as Array<{ version: number }>;
  return rows.map((row) => row.version);
};

// Record migration as applied
const recordMigration = (
  db: Database.Database,
  version: number,
  description: string,
): void => {
  const stmt = db.prepare(
    `INSERT INTO migrations (version, description, applied_at) VALUES (?, ?, ?)`,
  );
  stmt.run(version, description, Date.now());
};

// Migration registry - add new migrations here
const migrations: Migration[] = [
  {
    version: 1,
    description: "Initial schema with catalog and extensions",
    up: (db) => {
      db.exec(`
        -- Legacy tables cleanup
        DROP TABLE IF EXISTS reading_progress;
        DROP TABLE IF EXISTS library;
        DROP TABLE IF EXISTS chapters;
        DROP TABLE IF EXISTS manga;

        -- Catalog repositories
        CREATE TABLE IF NOT EXISTS catalog_repos (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('http', 'filesystem')),
          checksum TEXT,
          last_synced_at INTEGER,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        -- Catalog entries
        CREATE TABLE IF NOT EXISTS catalog_entries (
          id TEXT PRIMARY KEY,
          repo_id TEXT NOT NULL,
          slug TEXT NOT NULL,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          icon_url TEXT,
          archive_url TEXT NOT NULL,
          checksum TEXT,
          language TEXT,
          description TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          FOREIGN KEY (repo_id) REFERENCES catalog_repos(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_catalog_entries_repo ON catalog_entries(repo_id, slug);

        -- Installed extensions
        CREATE TABLE IF NOT EXISTS extensions (
          id TEXT PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          version TEXT NOT NULL,
          repo_source TEXT,
          install_path TEXT NOT NULL,
          manifest_json TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          installed_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          checksum TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_extensions_slug ON extensions(slug);

        -- Extension install jobs
        CREATE TABLE IF NOT EXISTS extension_installs (
          id TEXT PRIMARY KEY,
          extension_id TEXT NOT NULL,
          status TEXT NOT NULL,
          requested_at INTEGER NOT NULL,
          completed_at INTEGER,
          error TEXT,
          FOREIGN KEY (extension_id) REFERENCES extensions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_extension_installs_status ON extension_installs(status);

        -- Application settings
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          scope TEXT NOT NULL,
          value_json TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
    },
  },
  {
    version: 2,
    description: "Add repo_url and extension_metadata to extension_installs",
    up: (db) => {
      db.exec(`
        -- Add columns to extension_installs table
        ALTER TABLE extension_installs ADD COLUMN repo_url TEXT;
        ALTER TABLE extension_installs ADD COLUMN extension_metadata TEXT;
      `);
    },
  },
];

// Run all pending migrations
export const runMigrations = (db: Database.Database): void => {
  try {
    console.log("Starting migration system...");

    // Initialize migrations table
    initMigrationsTable(db);

    // Get applied migrations
    const appliedVersions = getAppliedMigrations(db);
    console.log("Applied migrations:", appliedVersions);

    // Find pending migrations
    const pendingMigrations = migrations.filter(
      (m) => !appliedVersions.includes(m.version),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(
      `Found ${pendingMigrations.length} pending migration(s)`,
    );

    // Run each pending migration in a transaction
    for (const migration of pendingMigrations) {
      console.log(
        `Applying migration ${migration.version}: ${migration.description}`,
      );

      const applyMigration = db.transaction(() => {
        migration.up(db);
        recordMigration(db, migration.version, migration.description);
      });

      applyMigration();

      console.log(
        `Migration ${migration.version} applied successfully`,
      );
    }

    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};
