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
