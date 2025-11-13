# Backend API Reference

The JAMRA backend exposes a REST API (plus a WebSocket channel) served by `server/src/index.ts`. Unless noted otherwise, all examples below assume a development server running at `http://localhost:3000` with JSON request/response bodies.

---

## Health & Diagnostics

### `GET /health`
Simple liveness probe used by the Electron shell.

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "timestamp": 1736545554631,
  "modules": []
}
```

---

## Settings API (`/api/settings`)
Manages arbitrary key/value configuration scoped per feature.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/settings` | List settings, optionally filtered by scope. |
| GET | `/api/settings/:key` | Retrieve a single setting. |
| PUT | `/api/settings` | Create/update a setting. |
| DELETE | `/api/settings/:key` | Delete a setting. |

### List Settings
```bash
curl "http://localhost:3000/api/settings?scope=extensions"
```

```json
{
  "settings": [
    {
      "key": "sandbox.allowNetworkHosts",
      "scope": "extensions",
      "value": ["mangadex.org", "api.mihon.dev"],
      "updatedAt": "2025-01-09T18:01:23.123Z"
    }
  ]
}
```

### Get Setting
```bash
curl http://localhost:3000/api/settings/theme
```

```json
{
  "setting": {
    "key": "theme",
    "scope": "app",
    "value": "dark",
    "updatedAt": "2025-01-09T18:01:23.123Z"
  }
}
```

### Upsert Setting
```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{
    "key": "reader.pageTurn",
    "value": "vertical",
    "scope": "app"
  }'
```

_Response_: `204 No Content`

### Delete Setting
```bash
curl -X DELETE http://localhost:3000/api/settings/reader.pageTurn
```

_Response_: `204 No Content`

---

## Catalog API (`/api/catalog`)
Synchronises Mihon-style extension indexes.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/catalog` | List cached catalog entries; filter by `repoId` query param. |
| POST | `/api/catalog/sync` | Trigger a driver sync (default repo or explicit `repoId`). |

### List Catalog Entries
```bash
curl "http://localhost:3000/api/catalog?repoId=local-catalog"
```

```json
{
  "entries": [
    {
      "id": "manga-garden",
      "repoId": "local-catalog",
      "slug": "manga-garden",
      "name": "Manga Garden",
      "version": "1.3.0",
      "iconUrl": "https://cdn.jamra.dev/catalog/manga-garden/icon.png",
      "archiveUrl": "https://cdn.jamra.dev/catalog/manga-garden/archive.zip",
      "language": "en",
      "description": "Popular English sources",
      "checksum": "1c8f48...",
      "createdAt": "2025-01-05T10:28:11.000Z",
      "updatedAt": "2025-01-08T13:02:44.000Z"
    }
  ]
}
```

### Sync Catalog
```bash
curl -X POST http://localhost:3000/api/catalog/sync \
  -H "Content-Type: application/json" \
  -d '{ "repoId": "local-catalog" }'
```

```json
{
  "status": "sync queued",
  "repoId": "local-catalog",
  "result": {
    "repo": {
      "id": "local-catalog",
      "name": "Local Catalog",
      "url": "/resources/catalog/default/index.json",
      "type": "filesystem",
      "lastSyncedAt": "2025-01-09T17:58:00.000Z",
      "checksum": "d41d8c..."
    },
    "entriesUpdated": 42,
    "entriesRemoved": 1,
    "checksum": "d41d8c..."
  }
}
```

---

## Extensions API (`/api/extensions`)
Wraps installed extensions and proxies their lifecycle methods.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/extensions` | List installed extensions. |
| GET | `/api/extensions/:extensionId` | Fetch manifest + install metadata. |
| GET | `/api/extensions/:extensionId/search` | Execute an extension search (query params: `query`, `page`, filters). |
| GET | `/api/extensions/:extensionId/manga/:mangaId` | Retrieve manga details (optionally include chapters with `includeChapters=false`). |
| GET | `/api/extensions/:extensionId/manga/:mangaId/chapters` | Slim chapter list helper. |
| GET | `/api/extensions/:extensionId/manga/:mangaId/chapters/:chapterId/pages` | Fetch remote page descriptors. |
| POST | `/api/extensions/install` | Queue installs straight from the extensions router. |
| GET | `/api/extensions/install/:jobId` | Inspect install job status. |

### List Extensions
```bash
curl http://localhost:3000/api/extensions
```

```json
{
  "extensions": [
    {
      "id": "manga-garden",
      "slug": "manga-garden",
      "name": "Manga Garden",
      "version": "1.3.0",
      "repoSource": "local",
      "installPath": "resources/extensions/manga-garden",
      "enabled": true,
      "installedAt": "2025-01-06T09:14:00.000Z",
      "manifest": {
        "id": "manga-garden",
        "name": "Manga Garden",
        "version": "1.3.0",
        "entry": "dist/index.js"
      }
    }
  ]
}
```

### Search Manga via Extension
```bash
curl "http://localhost:3000/api/extensions/manga-garden/search?query=berserk&page=1"
```

```json
{
  "results": [
    {
      "id": "berserk",
      "title": "Berserk",
      "coverUrl": "https://.../covers/berserk.jpg",
      "status": "ONGOING",
      "lang": "en"
    }
  ],
  "hasMore": false
}
```

### Manga Details
```bash
curl http://localhost:3000/api/extensions/manga-garden/manga/berserk
```

```json
{
  "manga": {
    "id": "berserk",
    "title": "Berserk",
    "description": "Midland's darkest tale...",
    "coverUrl": "https://.../covers/berserk.jpg",
    "chapters": [
      { "id": "berserk-001", "chapterNumber": 1, "title": "Black Swordsman" }
    ]
  }
}
```

### Chapter List
```bash
curl http://localhost:3000/api/extensions/manga-garden/manga/berserk/chapters
```

```json
{
  "chapters": [
    { "id": "berserk-001", "chapterNumber": 1, "title": "Black Swordsman" },
    { "id": "berserk-002", "chapterNumber": 2, "title": "The Brand" }
  ],
  "metrics": { "totalChapters": 2 }
}
```

### Page Descriptors
```bash
curl http://localhost:3000/api/extensions/manga-garden/manga/berserk/chapters/berserk-001/pages
```

```json
{
  "pages": [
    { "index": 0, "imageUrl": "https://.../berserk/001/01.jpg" },
    { "index": 1, "imageUrl": "https://.../berserk/001/02.jpg" }
  ]
}
```

### Queue Extension Install
```bash
curl -X POST http://localhost:3000/api/extensions/install \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/shoobydoo/jamra-extensions",
    "extensionIds": ["manga-garden"],
    "branch": "main"
  }'
```

```json
{
  "message": "Installation queued",
  "status": "queued",
  "jobIds": ["job_78jk12"]
}
```

### Check Install Job
```bash
curl http://localhost:3000/api/extensions/install/job_78jk12
```

```json
{
  "jobId": "job_78jk12",
  "extensionId": "manga-garden",
  "status": "completed",
  "repositoryUrl": "https://github.com/shoobydoo/jamra-extensions",
  "requestedAt": 1736441105123,
  "completedAt": 1736441118456,
  "error": null
}
```

---

## Installer API (`/api/installer`)
A thin wrapper around the same service used by the extensions router. Call these endpoints if you want installer-specific URLs.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/installer` | Queue install jobs. |
| GET | `/api/installer/install/:jobId` | Fetch job status. |

Requests/responses mirror the examples shown above for `/api/extensions/install`.

---

## Library API (`/api/library`)
Owns the user's manga library, favorites, statuses, and reading progress.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/library` | List library items (supports `status`, `favorite`, `search`, `sort`, `direction`, `limit`, `offset`). |
| POST | `/api/library` | Add a manga to the library. |
| GET | `/api/library/:id` | Fetch a single library item. |
| PATCH | `/api/library/:id` | Update status/favorite flags. |
| DELETE | `/api/library/:id` | Remove a library item (and its progress). |
| PATCH | `/api/library/:id/favorite` | Toggle favorite flag server-side. |
| GET | `/api/library/:id/progress` | List progress rows for a manga. |
| PUT | `/api/library/:id/progress` | Upsert progress for a chapter. |
| GET | `/api/library/:id/chapters/:chapterId/progress` | Fetch specific chapter progress. |
| GET | `/api/library/:id/last-read` | Fetch the most recent progress row. |
| GET | `/api/library/stats` | Aggregate counts per status. |

### List Library Items
```bash
curl "http://localhost:3000/api/library?status=reading&limit=10"
```

```json
{
  "items": [
    {
      "id": "lib_01",
      "mangaId": "berserk",
      "extensionId": "manga-garden",
      "title": "Berserk",
      "status": "reading",
      "favorite": true,
      "coverUrl": "https://...",
      "dateAdded": "2025-01-02T12:00:00.000Z",
      "lastUpdated": "2025-01-08T18:45:11.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

### Add to Library
```bash
curl -X POST http://localhost:3000/api/library \
  -H "Content-Type: application/json" \
  -d '{
    "mangaId": "berserk",
    "extensionId": "manga-garden",
    "title": "Berserk",
    "status": "reading",
    "coverUrl": "https://.../berserk.jpg"
  }'
```

```json
{
  "id": "lib_01",
  "mangaId": "berserk",
  "extensionId": "manga-garden",
  "title": "Berserk",
  "status": "reading",
  "favorite": false,
  "coverUrl": "https://.../berserk.jpg",
  "dateAdded": "2025-01-09T18:10:00.000Z",
  "lastUpdated": "2025-01-09T18:10:00.000Z"
}
```

### Update Status
```bash
curl -X PATCH http://localhost:3000/api/library/lib_01 \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed", "favorite": true }'
```

```json
{
  "id": "lib_01",
  "mangaId": "berserk",
  "extensionId": "manga-garden",
  "title": "Berserk",
  "status": "completed",
  "favorite": true,
  "coverUrl": "https://.../berserk.jpg",
  "dateAdded": "2025-01-09T18:10:00.000Z",
  "lastUpdated": "2025-01-10T09:22:13.000Z"
}
```

### Record Progress
```bash
curl -X PUT http://localhost:3000/api/library/lib_01/progress \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "berserk-001",
    "chapterNumber": "1",
    "pageNumber": 12,
    "totalPages": 48
  }'
```

```json
{
  "id": "prog_01",
  "libraryId": "lib_01",
  "chapterId": "berserk-001",
  "chapterNumber": "1",
  "pageNumber": 12,
  "totalPages": 48,
  "lastRead": "2025-01-10T09:25:00.000Z",
  "completed": false
}
```

### Library Stats
```bash
curl http://localhost:3000/api/library/stats
```

```json
{
  "total": 5,
  "reading": 2,
  "completed": 1,
  "planToRead": 1,
  "dropped": 0,
  "onHold": 1
}
```

---

## Downloads API (`/api/downloads`)
Queues and manages offline chapter downloads.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/downloads` | List downloads (filters: `status`, `libraryId`, `extensionId`). |
| POST | `/api/downloads` | Queue one or more chapters for download. |
| GET | `/api/downloads/:id` | Fetch a download plus its saved pages. |
| DELETE | `/api/downloads/:id` | Cancel a download (and delete stored files). |
| GET | `/api/downloads/stats` | Storage stats + download count. |

### Queue Downloads
```bash
curl -X POST http://localhost:3000/api/downloads \
  -H "Content-Type: application/json" \
  -d '{
    "libraryId": "lib_01",
    "extensionId": "manga-garden",
    "chapterIds": ["berserk-001", "berserk-002"],
    "chapterNumbers": { "berserk-001": "1", "berserk-002": "2" }
  }'
```

```json
{
  "downloads": [
    {
      "id": "dl_01",
      "libraryId": "lib_01",
      "chapterId": "berserk-001",
      "chapterNumber": "1",
      "extensionId": "manga-garden",
      "status": "queued",
      "progress": 0,
      "createdAt": "2025-01-10T09:30:00.000Z"
    }
  ]
}
```

### List Downloads
```bash
curl "http://localhost:3000/api/downloads?status=downloading"
```

```json
{
  "downloads": [
    {
      "id": "dl_01",
      "libraryId": "lib_01",
      "chapterId": "berserk-001",
      "chapterNumber": "1",
      "extensionId": "manga-garden",
      "status": "downloading",
      "progress": 62,
      "totalPages": 48,
      "startedAt": "2025-01-10T09:31:10.000Z"
    }
  ]
}
```

### Download Details
```bash
curl http://localhost:3000/api/downloads/dl_01
```

```json
{
  "download": {
    "id": "dl_01",
    "libraryId": "lib_01",
    "chapterId": "berserk-001",
    "status": "completed",
    "progress": 100,
    "totalPages": 48,
    "completedAt": "2025-01-10T09:33:00.000Z"
  },
  "pages": [
    {
      "id": "dlpage_01",
      "downloadId": "dl_01",
      "pageNumber": 1,
      "pageUrl": "https://.../berserk/001/01.jpg",
      "filePath": "data/downloads/dl_01/page_001.jpg",
      "fileSize": 143522,
      "downloadedAt": "2025-01-10T09:31:15.000Z"
    }
  ]
}
```

### Cancel Download
```bash
curl -X DELETE http://localhost:3000/api/downloads/dl_02
```

_Response_: `204 No Content`

### Download Stats
```bash
curl http://localhost:3000/api/downloads/stats
```

```json
{
  "downloadCount": 7,
  "totalSize": 824593210
}
```

---

## Reader API (`/api/reader`)
Serves chapter metadata and binary page streams for the in-app reader.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/reader/:libraryId/chapters/:chapterId` | Fetch a chapter (includes page URLs, navigation pointers, `isDownloaded`). |
| GET | `/api/reader/:libraryId/chapters/:chapterId/next` | Convenience wrapper returning the next chapter. |
| GET | `/api/reader/:libraryId/chapters/:chapterId/previous` | Fetch the previous chapter. |
| GET | `/api/reader/:libraryId/chapters/:chapterId/pages/:pageNumber` | Stream a specific page image (local file or proxied remote image). |

### Fetch Chapter Metadata
```bash
curl http://localhost:3000/api/reader/lib_01/chapters/berserk-001
```

```json
{
  "id": "berserk-001",
  "number": "1",
  "title": "Black Swordsman",
  "pages": [
    { "number": 1, "url": "/api/reader/lib_01/chapters/berserk-001/pages/1" }
  ],
  "isDownloaded": true,
  "previousChapterId": null,
  "nextChapterId": "berserk-002"
}
```

### Stream Page Image
```bash
curl -L http://localhost:3000/api/reader/lib_01/chapters/berserk-001/pages/1 \
  -o page_001.jpg
```

_Response_: binary image data (`Content-Type` reflects file extension; `Cache-Control: private`).

---

## Downloads & Library WebSocket (`ws://localhost:3000`)
Real-time updates are delivered over a WebSocket channel defined in `server/src/websocket/handlers.ts`.

- Connect to `ws://localhost:3000`.
- Optionally limit download broadcasts by sending:
  ```json
  { "event": "subscribe:download", "data": { "downloadId": "dl_01" } }
  ```
- Events include `download:started`, `download:progress`, `download:page:complete`, `download:chapter:complete`, `download:failed`, `download:cancelled`, `library:item:added`, `library:item:updated`, and `library:item:removed`. Payload shapes match the TypeScript interfaces in `server/src/websocket/events.ts`.

Example client (Node):
```js
import WebSocket from "ws";
const ws = new WebSocket("ws://localhost:3000");
ws.on("open", () => {
  ws.send(JSON.stringify({ event: "subscribe:download", data: { downloadId: "dl_01" } }));
});
ws.on("message", (msg) => {
  console.log("WS event", JSON.parse(msg.toString()));
});
```

---

## Installer/Extensions Job Status Codes
Installation jobs (`/api/installer` or `/api/extensions/install`) emit these statuses:

- `pending` – queued but not yet started
- `downloading` – repository files are being fetched
- `compiling` – TypeScript is being bundled
- `installing` – files are written to disk + DB rows updated
- `completed` – install verified successfully
- `failed` – see `error` field for reason

Use the job-status endpoint to poll until `completed` or `failed`.

---

## Error Handling
All controllers share `middleware/error-handler.ts`, returning JSON like:

```json
{
  "message": "Validation failed",
  "details": {
    "field": "chapterId"
  }
}
```

HTTP status codes follow standard semantics (`400` validation/domain errors, `404` not found, `500` unexpected server failures, `202` for queued async work, `204` for successful deletions).
