# JAMRA Backend Overview

The JAMRA backend (see `server/src/`) is an Express + TypeScript service that ships inside the Electron app and can also run standalone (`pnpm dev:server`). The entrypoint is `server/src/index.ts`, which wires the HTTP server, WebSocket server, database, and shared application context. Routes are registered in `server/src/app/routes.ts` and draw their dependencies from feature modules under `server/src/modules/*`.

## Runtime Highlights
- **App bootstrap** – `createApp` in `server/src/app/app.ts` attaches logging, JSON parsing, CORS, `/health`, and the global error handler before delegating to module routers.
- **Database** – A single SQLite database (`better-sqlite3`) is opened via `server/src/core/database/index.ts`; schema changes live in `server/src/database/migrations.ts` (currently v1–v4 covering catalog, extensions, library, downloads, and settings).
- **Context** – Every router receives an `AppContext` (config, DB handle, HTTP client, logger) so module code stays testable and composable.
- **WebSocket server** – `initializeWebSocketServer` in `server/src/websocket/handlers.ts` sits beside Express on the same port to broadcast library/download events.
- **File system data** – Download payloads and installed extensions default to `resources/<feature>` but honor `EXTENSIONS_INSTALL_DIR`, `DOWNLOADS_DIR`, and related env overrides via `server/src/core/config/app-config.ts`.

## Module Index
| Feature / Module | Primary Routes | Description |
| --- | --- | --- |
| [Settings](./settings.md) | `GET/PUT/DELETE /api/settings` | Persist arbitrary JSON settings scoped by module and exposed to the renderer. |
| [Catalog](./catalog.md) | `GET /api/catalog`, `POST /api/catalog/sync` | Syncs Mihon-style extension indexes from HTTP or filesystem sources. |
| [Extensions](./extensions.md) | `/api/extensions/*` | Registry, loader, and runtime facade for executing installed extensions. |
| [Installer](./installer.md) | `/api/installer/*`, `/api/extensions/install*` | Fetches, compiles, validates, and registers extensions from Git repositories. |
| [Library & Progress](./library.md) | `/api/library/*` | Manages the user library, reading states, and emits WebSocket updates. |
| [Downloads](./downloads.md) | `/api/downloads/*` | Queues chapter downloads, persists files, and streams progress events. |
| [Reader APIs](./reader.md) | `/api/reader/*` | Serves chapter metadata and page binaries, falling back to remote sources when not downloaded. |
| [WebSocket Events](./websocket.md) | `ws://<host>:3000` | Documents the realtime channel and subscription protocol shared by downloads/library. |

Each feature doc above cross-references the implementation files, schema objects, and APIs that replaced the items tracked in `docs/backend-implementation-action-plan.md`. Use them as the canonical reference when extending the backend.

## Request Flow Cheatsheet
1. Electron (or `pnpm dev:server`) calls `initializeServer` → `createApp`.
2. Incoming HTTP requests hit shared middleware (`requestLogger`, CORS/JSON parser).
3. Feature routers service requests with controller → service → repository layering.
4. Errors bubble into `middleware/error-handler.ts`, returning consistent JSON envelopes.
5. Long-running work (downloads, installs) emits WebSocket events via `server/src/websocket/handlers.ts` for the UI to track progress.

## Operational Notes
- **Health check** – `GET /health` responds with `{ status: "ok", timestamp }`; frontends use it to block until migrations complete.
- **Graceful shutdown** – `shutdownServer` destroys sockets, closes `ws`, and releases the SQLite handle so Electron can restart cleanly.
- **Adding migrations** – Extend the `migrations` array in `server/src/database/migrations.ts` with a new version and rerun `pnpm dev:server` to apply.
- **Configuration** – All tunables (catalog repo, installer concurrency, runtime timeouts, sandbox host allowlist, etc.) are defined in `server/src/core/config/app-config.ts` and may be overridden by env vars when packaging.

Refer to the module docs for feature-specific testing steps, WebSocket payloads, and schema diagrams.
