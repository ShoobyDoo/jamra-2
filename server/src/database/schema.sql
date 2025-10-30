-- Manga table
CREATE TABLE IF NOT EXISTS manga (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_url TEXT,
  genres TEXT,
  status TEXT CHECK(status IN ('ongoing', 'completed', 'hiatus')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL,
  title TEXT NOT NULL,
  chapter_number REAL NOT NULL,
  page_count INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
);

-- Library table
CREATE TABLE IF NOT EXISTS library (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL UNIQUE,
  is_favorite BOOLEAN DEFAULT 0,
  added_at INTEGER NOT NULL,
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
);

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  current_page INTEGER DEFAULT 0,
  last_read_at INTEGER NOT NULL,
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_library_added_at ON library(added_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_manga_id ON reading_progress(manga_id);
