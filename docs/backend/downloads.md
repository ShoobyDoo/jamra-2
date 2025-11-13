# Downloads Module

The downloads module (`server/src/modules/downloads`) queues chapter downloads, saves image files to disk, and relays real-time progress to the UI. It integrates tightly with the extensions runtime (to fetch page URLs), the library module (to validate items), and the WebSocket layer.

## Responsibilities
- Persist download jobs + individual page files in SQLite tables `downloads` and `downloaded_pages` (migration v4).
- Provide REST endpoints for queue management, inspection, cancellation, and storage stats.
- Stream chapter pages from extension sources, save them under `data/downloads/<downloadId>`, and emit WebSocket events at each milestone.
- Recover from crashes by re-queuing `downloading` jobs during service startup.

## Data Model
```
downloads
  id TEXT PRIMARY KEY
  library_id TEXT NOT NULL REFERENCES library(id)
  chapter_id TEXT NOT NULL
  chapter_number TEXT NULL
  extension_id TEXT NOT NULL
  status TEXT CHECK ('queued','downloading','completed','failed','cancelled')
  progress INTEGER DEFAULT 0 (percentage)
  total_pages INTEGER NULL
  error TEXT NULL
  created_at / started_at / completed_at TEXT (ISO)

downloaded_pages
  id TEXT PRIMARY KEY
  download_id TEXT NOT NULL REFERENCES downloads(id)
  page_number INTEGER
  page_url TEXT
  file_path TEXT
  file_size INTEGER NULL
  downloaded_at TEXT (ISO)
  UNIQUE(download_id, page_number)
```

## Implementation Stack
| Component | File(s) | Description |
| --- | --- | --- |
| Repository | `downloads.repository.ts` | All SQL access including queue polling, status transitions, and page CRUD. |
| File Manager | `storage/file-manager.ts` | Writes/reads/deletes downloaded images, computes directory stats, honours `DOWNLOADS_DIR`. |
| Downloader | `downloader.service.ts` | Executes the actual download loop for a chapter, fetching page blobs (with retries) and emitting `download:*` events. |
| Service | `downloads.service.ts` | Coordinates queueing, guards concurrency, tracks abort controllers, triggers WebSocket events, and exposes read APIs. |
| Controller + Routes | `downloads.controller.ts`, `downloads.routes.ts` | Validates HTTP payloads and binds the module under `/api/downloads`. |

## REST API Summary
- `GET /api/downloads?status=&libraryId=&extensionId=` → `{ downloads }`.
- `POST /api/downloads` body `{ libraryId, extensionId, chapterIds: string[], chapterNumbers?: Record }` queues downloads; returns `{ downloads: Download[] }` with HTTP 202.
- `GET /api/downloads/:id` → `{ download, pages }` or 404.
- `DELETE /api/downloads/:id` → Cancels an in-flight job (uses `DownloadsService.cancelDownload`).
- `GET /api/downloads/stats` → `{ downloadCount, totalSize }` derived from DB rows and file manager scan.

## Queue Processing Flow
1. `queueDownloads` validates the library item, dedupes existing jobs, and inserts new rows (one per chapter) with status `queued`.
2. `DownloadsService.initialize` runs during router creation to requeue stuck jobs and kick off the worker loop.
3. The service pulls up to `DEFAULT_CONCURRENCY` (3) queued items at a time and spawns `runDownload` tasks, each with its own `AbortController`.
4. `ChapterDownloader.downloadChapter` ensures the extension exists, loads it via the runtime, calls `getPages`, iterates through page URLs, streams binary data with retries, saves images, and updates `downloaded_pages`/`downloads` tables.
5. WebSocket events fired during the loop:
   - `download:started` when status switches to `downloading`.
   - `download:progress` each time `progress` is updated.
   - `download:page:complete` per saved page.
   - `download:chapter:complete` when all pages finish.
   - `download:failed` or `download:cancelled` when appropriate.
6. Completed downloads set `progress=100`, `status='completed'`, and keep their files on disk for offline reading.

## Cancellation & Recovery
- `DELETE /api/downloads/:id` marks the job `cancelled`, deletes its files, aborts the running fetch (if any), and emits `download:cancelled`.
- On startup, `requeueStuckDownloads` flips `downloading` jobs back to `queued` so they resume automatically.

## Working With Downloaded Pages
- Use `DownloadsService.getDownloadWithPages` (exposed through `GET /api/downloads/:id`) to render offline reading lists.
- The reader module prefers downloaded pages when `downloads.status === 'completed'` and falls back to remote proxies otherwise.
- Files are named `page_###.<ext>` (zero-padded) under `baseDir/downloadId`. `DownloadFileManager.getImagePath` is available if you need on-disk access outside the reader.

## Configuration Hooks
- `DOWNLOADS_DIR` (env) overrides the default `data/downloads` directory.
- Adjust concurrency by passing `{ concurrency }` when instantiating `DownloadsService` (defaults to 3); currently `downloads.routes.ts` uses the default.
- Future throttling/back-off logic can be inserted inside `DownloadsService.triggerQueueProcessing` without touching controllers.
