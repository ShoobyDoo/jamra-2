# Settings Module

The settings module (`server/src/modules/settings`) exposes a thin CRUD façade over the `settings` table so the renderer and Electron main process can persist structured configuration without shipping a bespoke schema migration each time.

## Responsibilities
- Provide scoped key/value storage for application, catalog, extension, or sandbox settings.
- Enforce JSON serialisation/parsing and consistent timestamps.
- Surface a minimal REST API for the UI and other services to consume.

## Data Model
`settings` table (created in migration v1):
```
key TEXT PRIMARY KEY
scope TEXT NOT NULL -- 'app' | 'catalog' | 'extensions' | 'sandbox'
value_json TEXT NOT NULL
updated_at INTEGER NOT NULL (epoch ms)
```

## Implementation Stack
| File | Description |
| --- | --- |
| `settings.repository.ts` | `SqliteSettingsRepository` performs the actual queries (using `better-sqlite3` prepared statements) and maps rows to the strongly typed `Setting<T>` model. |
| `settings.service.ts` | Wraps the repository so controllers remain trim and future business logic (validation, defaults) lives in one place. |
| `settings.controller.ts` | Handles HTTP validation and response shapes (`list`, `get`, `update`, `remove`). |
| `settings.routes.ts` | Instantiates the repository/service/controller trio and registers them under `/api/settings`. |

## API Surface
- `GET /api/settings?scope=extensions` → `{ settings: Setting[] }` (scope optional).
- `GET /api/settings/:key` → `{ setting }` or 404.
- `PUT /api/settings` body `{ key, value, scope? }` → 204 on success.
- `DELETE /api/settings/:key` → 204.

Each endpoint returns JSON errors with meaningful codes/messages via the shared error handler when validation fails.

## Usage Tips
- Use the `scope` column to avoid key collisions between app-wide toggles and per-module state; the service defaults to `app` when omitted.
- The repository stores `value` as arbitrary JSON—callers should keep payloads small (<1 KB) to avoid bloating the SQLite file.
- Because the router operates synchronously (no long polling), bulk writes should be done client-side by `Promise.all` calls rather than a new batch API.

## Future Work Hooks
- If we later need structured validation (e.g., schema per scope), add it inside `SettingsService.set` before the repository call.
- For more granular change notifications, emit WebSocket events from the controller similar to the library module.
