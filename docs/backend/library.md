# Library & Reading Progress Module

The library module (`server/src/modules/library`) tracks which manga the user follows, their status/favorites, and per-chapter progress. It also emits WebSocket notifications so the UI can stay in sync without polling.

## Responsibilities
- CRUD for library entries stored in the `library` table.
- CRUD for per-chapter reading progress stored in `reading_progress`.
- Aggregate stats (`/api/library/stats`).
- Expose REST endpoints that the renderer and reader use for bookshelf management.
- Emit WebSocket events whenever items are added, updated, or removed.

## Data Model
```
library
  id TEXT PRIMARY KEY
  manga_id TEXT NOT NULL
  extension_id TEXT NOT NULL
  title TEXT NOT NULL
  cover_url TEXT NULL
  status TEXT CHECK (...)
  favorite INTEGER DEFAULT 0
  date_added TEXT (ISO)
  last_updated TEXT (ISO)
  UNIQUE(manga_id, extension_id)

reading_progress
  id TEXT PRIMARY KEY
  library_id TEXT REFERENCES library(id) ON DELETE CASCADE
  chapter_id TEXT NOT NULL
  chapter_number TEXT NULL
  page_number INTEGER DEFAULT 0
  total_pages INTEGER NULL
  last_read TEXT (ISO)
  completed INTEGER DEFAULT 0
  UNIQUE(library_id, chapter_id)
```
(Schema defined in migration v3.)

## Implementation Stack
| File | Description |
| --- | --- |
| `library.repository.ts` | Handles CRUD on `library` rows, filtering, sorting, pagination, and counts. |
| `progress.repository.ts` | Manages per-chapter progress and ensures uniqueness per library item/chapter. |
| `library.service.ts` | Orchestrates validation, dedupe, cascading deletes, stats, and WebSocket emissions (`emitLibraryItem*`). |
| `library.controller.ts` | Parses query params/body payloads, maps HTTP verbs to service calls, and returns JSON responses. |
| `library.routes.ts` | Wires repositories + service + controller under `/api/library`. |

## REST API Summary
- `GET /api/library?status=&favorite=&search=&sort=&direction=&limit=&offset=` → `{ items, total }`.
- `POST /api/library` body `{ mangaId, extensionId, title, status, coverUrl? }` → 201 + new item.
- `GET /api/library/:id` → single item.
- `PATCH /api/library/:id` body `{ status?, favorite? }` → updated item (+ WebSocket update when state changes).
- `DELETE /api/library/:id` → removes the item and its progress rows.
- `PATCH /api/library/:id/favorite` → toggles favorite flag server-side.
- `GET /api/library/:id/progress` → array of progress rows for that manga.
- `PUT /api/library/:id/progress` body `{ chapterId, chapterNumber?, pageNumber, totalPages? }` → upserts progress.
- `GET /api/library/:id/chapters/:chapterId/progress` → single chapter progress.
- `GET /api/library/:id/last-read` → latest progress row (404 when none).
- `GET /api/library/stats` → `{ total, reading, completed, planToRead, dropped, onHold }`.

## WebSocket Events
Defined in `server/src/websocket/events.ts` and emitted from the service:
- `library:item:added` – snapshot payload with the new item.
- `library:item:updated` – snapshot + `changes` object (status/favorite toggles).
- `library:item:removed` – minimal payload (ids/title).

These broadcasts allow the renderer to update views immediately when a second window or background process mutates the library.

## Notable Business Rules
- Duplicate prevention: `addToLibrary` rejects inserts when an item already exists for a `mangaId + extensionId` pair.
- Progress updates validate that `pageNumber >= 0` and `pageNumber <= totalPages` (when provided).
- Removing a library item manually deletes progress rows before deleting the parent record even though the FK is `ON DELETE CASCADE`; this keeps the service idempotent across SQLite versions.

## Working With the Module
- Use the repository/service classes directly inside new backend modules (e.g., future recommendations) instead of re-querying the DB.
- Emit additional WebSocket events by importing `emitLibraryItem*` helpers if new mutations are added.
- Update this doc when you introduce new library statuses or response fields so the renderer and docs stay aligned.
