# WebSocket Layer

JAMRA's backend exposes a WebSocket server on the same port as the REST API (`ws://localhost:3000` in development). It lives in `server/src/websocket` and is initialised by `initializeWebSocketServer` inside `server/src/index.ts`.

## Connection Lifecycle
1. When a client connects, the server:
   - Stores the socket in an in-memory map with an empty subscription set.
   - Sends a `connect` event confirming the session.
2. Clients may send JSON messages with `{ "event": "subscribe:download", "data": { "downloadId": "..." } }` to limit future events to specific downloads. `unsubscribe:download` removes the filter.
3. On `close` or `error`, the socket is removed and pending subscriptions are discarded.

If a client never subscribes, it still receives all broadcasts (backwards compatibility).

## Event Names & Payloads
Event constants live in `server/src/websocket/events.ts`:

| Event | Emitted From | Payload |
| --- | --- | --- |
| `download:started` | `DownloadsService.runDownload` via `emitDownloadStarted` | `{ downloadId, mangaId, chapterId, timestamp }` |
| `download:progress` | Downloader loop | `{ downloadId, chapterId, currentPage, totalPages, percentage, timestamp }` |
| `download:page:complete` | Downloader loop | `{ downloadId, chapterId, pageNumber, timestamp }` |
| `download:chapter:complete` | Downloader loop | `{ downloadId, chapterId, totalPages, timestamp }` |
| `download:failed` | Downloader loop | `{ downloadId, chapterId, error, timestamp }` |
| `download:cancelled` | `DownloadsService.cancelDownload` | `{ downloadId, chapterId, timestamp }` |
| `library:item:added` | `LibraryService.addToLibrary` | Snapshot payload describing the new item |
| `library:item:updated` | `LibraryService.update*` | Snapshot + `changes` object |
| `library:item:removed` | `LibraryService.removeFromLibrary` | `{ libraryId, mangaId, extensionId, title, timestamp }` |
| `subscription:ack` | WebSocket handler | `{ action: 'subscribed' | 'unsubscribed', type: 'download', downloadId }` |
| `error` | WebSocket handler | `{ message }` |

Use these payloads directly in the renderer; they already include timestamps so the UI can order updates deterministically.

## Broadcasting Rules
`broadcast` in `handlers.ts` iterates over all sockets, optionally filtering by download subscription. That means:
- Library events always reach every connected client.
- Download events only go to clients that subscribed to the download ID **when** they have active subscriptions; if a client keeps the default empty subscription set, it still receives everything.

## Client Message Schema
```
{
  "event": "subscribe:download" | "unsubscribe:download",
  "data": {
    "downloadId": "string"
  }
}
```
Invalid messages result in an `error` event containing the validation failure.

## Operational Notes
- The WebSocket server reuses the HTTP server's lifecycle; `shutdownServer` closes all sockets, so packaging/graceful restarts leave no dangling connections.
- Because the implementation stores connections in-memory only, reconnect logic must live in the renderer (retry with backoff when `close` fires).
- If you add new event types (e.g., reader progress), define payload interfaces in `events.ts`, emit through helper functions in `handlers.ts`, and document them here to keep parity between backend and frontend expectations.
