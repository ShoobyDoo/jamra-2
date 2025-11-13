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
  {
    version: 3,
    description: "Add library and reading progress tables",
    up: (db) => {
      db.exec(`
        -- Library items
        CREATE TABLE IF NOT EXISTS library (
          id TEXT PRIMARY KEY,
          manga_id TEXT NOT NULL,
          extension_id TEXT NOT NULL,
          title TEXT NOT NULL,
          cover_url TEXT,
          status TEXT NOT NULL CHECK(status IN ('reading', 'plan_to_read', 'completed', 'dropped', 'on_hold')),
          favorite INTEGER NOT NULL DEFAULT 0,
          date_added TEXT NOT NULL,
          last_updated TEXT NOT NULL,
          UNIQUE(manga_id, extension_id)
        );

        CREATE INDEX IF NOT EXISTS idx_library_status ON library(status);
        CREATE INDEX IF NOT EXISTS idx_library_favorite ON library(favorite);
        CREATE INDEX IF NOT EXISTS idx_library_date_added ON library(date_added);
        CREATE INDEX IF NOT EXISTS idx_library_extension ON library(extension_id);

        -- Reading progress per chapter
        CREATE TABLE IF NOT EXISTS reading_progress (
          id TEXT PRIMARY KEY,
          library_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          chapter_number TEXT,
          page_number INTEGER NOT NULL DEFAULT 0,
          total_pages INTEGER,
          last_read TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          FOREIGN KEY(library_id) REFERENCES library(id) ON DELETE CASCADE,
          UNIQUE(library_id, chapter_id)
        );

        CREATE INDEX IF NOT EXISTS idx_reading_progress_library ON reading_progress(library_id);
        CREATE INDEX IF NOT EXISTS idx_reading_progress_chapter ON reading_progress(chapter_id);
        CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(last_read);
      `);
    },
  },
  {
    version: 4,
    description: "Add downloads and downloaded pages tables",
    up: (db) => {
      db.exec(`
        -- Download queue table
        CREATE TABLE IF NOT EXISTS downloads (
          id TEXT PRIMARY KEY,
          library_id TEXT NOT NULL,
          chapter_id TEXT NOT NULL,
          chapter_number TEXT,
          extension_id TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('queued', 'downloading', 'completed', 'failed', 'cancelled')),
          progress INTEGER NOT NULL DEFAULT 0,
          total_pages INTEGER,
          error TEXT,
          created_at TEXT NOT NULL,
          started_at TEXT,
          completed_at TEXT,
          FOREIGN KEY(library_id) REFERENCES library(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
        CREATE INDEX IF NOT EXISTS idx_downloads_library ON downloads(library_id);

        -- Downloaded pages table
        CREATE TABLE IF NOT EXISTS downloaded_pages (
          id TEXT PRIMARY KEY,
          download_id TEXT NOT NULL,
          page_number INTEGER NOT NULL,
          page_url TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          downloaded_at TEXT NOT NULL,
          FOREIGN KEY(download_id) REFERENCES downloads(id) ON DELETE CASCADE,
          UNIQUE(download_id, page_number)
        );

        CREATE INDEX IF NOT EXISTS idx_downloaded_pages_download ON downloaded_pages(download_id);
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
