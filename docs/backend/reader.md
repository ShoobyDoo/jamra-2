# Reader Module

The reader module (`server/src/modules/reader`) merges data from the library, downloads, and extensions runtime to serve chapter metadata plus the binary page stream used by the Electron renderer. It also keeps an eye on reading progress so chapter turns update the user's history automatically.

## Responsibilities
- Provide JSON chapter payloads (`/api/reader/:libraryId/chapters/:chapterId`) that include navigation hints (prev/next IDs) and whether the chapter is fully downloaded.
- Stream page images either from disk (`downloaded_pages` via the downloads module) or by proxying remote URLs through `ImageProxyService`.
- Cache chapter metadata and chapter lists for short periods to reduce repeated extension calls.
- Record page views to the `reading_progress` table on every image request.

## Implementation Stack
| Component | File(s) | Description |
| --- | --- | --- |
| ReaderService | `reader.service.ts` | Core orchestration: validates library items, inspects download state, consults the extensions runtime, caches chapters/page sources, resolves navigation, and writes progress updates. |
| ImageProxyService | `image-proxy.service.ts` | Fetches remote images with a small in-memory cache (50 entries, 5 min TTL by default) and streams them to the HTTP response. |
| Controller + Routes | `reader.controller.ts`, `reader.routes.ts` | HTTP wrappers around the service and proxy; registers routes under `/api/reader`. |

## Endpoints
- `GET /api/reader/:libraryId/chapters/:chapterId` → Returns a `ReaderChapter`:
  ```json
  {
    "id": "chapter-id",
    "number": "42",
    "title": "My Chapter",
    "pages": [ { "number": 1, "url": "/api/reader/.../pages/1" }, ... ],
    "isDownloaded": true,
    "nextChapterId": "chapter-id+1",
    "previousChapterId": "chapter-id-1"
  }
  ```
- `GET /api/reader/:libraryId/chapters/:chapterId/next` / `previous` → Convenience wrappers that call `ReaderService.getNextChapter` / `getPreviousChapter`.
- `GET /api/reader/:libraryId/chapters/:chapterId/pages/:pageNumber` → Streams the actual image; selects the storage backend based on download status.

HTTP responses include cache headers: local files use one-week private caching, proxied images use 5-minute caching so the renderer can reuse them within a session.

## Download vs Remote Resolution
1. ReaderService checks `downloadsRepository.findByLibraryAndChapter`.
2. If a completed download exists, it loads page metadata from `downloaded_pages` and returns URLs pointing back to `/api/reader/.../pages/:n`.
3. When no download is available, it executes the extension's `getPages` lifecycle method (through the runtime) to build remote page descriptors and proxies them on-demand via `ImageProxyService`.
4. If a download exists but is missing files (e.g., deleted from disk), the service logs a warning and falls back to remote pages transparently.

## Caching Strategy
- **Chapter cache** – Stores `ReaderChapter` + page sources per `libraryId:chapterId` for 5 minutes (configurable via constructor arguments). The cache automatically invalidates when download state changes (completed → not completed, or new download ID).
- **Chapter list cache** – Stores arrays returned by `extension.getChapters(mangaId)` for 10 minutes so repeated navigations don't re-query the extension.
- **Image proxy cache** – 50 entries × 5 minutes by default, controlled by `ImageProxyOptions`.

## Progress Tracking
Every page request calls `ReaderService.recordPageView`, which upserts `reading_progress` rows and ensures `totalPages` is stored whenever the extension provided it. This is how the renderer gets accurate "continue reading" markers without additional API calls.

## Error Handling
- Missing `libraryId`/`chapterId`/`pageNumber` results in HTTP 400 responses.
- Requests for non-existent pages return 404 with `{ message: "Requested page is unavailable" }`.
- Extension failures propagate through the shared error middleware, so the renderer can surface a toast and optionally retry.

## Extensibility Notes
- To add derived metadata (e.g., page dimensions from downloads), extend `ReaderService.toReaderPages` and update the type definitions in `reader.types.ts`.
- If we introduce DRM or encryption, `ImageProxyService` is the right layer to hook into before bytes hit the client.
- Keep this document updated when adjusting cache TTLs or adding new reader routes.
