# Catalog Module

The catalog module (`server/src/modules/catalog`) ingests Mihon-compatible extension indexes and keeps the local SQLite cache in sync. Controllers expose lightweight endpoints so the renderer can list entries and trigger resynchronisation without reimplementing repo logic.

## Responsibilities
- Persist catalog repositories and entries in SQLite tables `catalog_repos` and `catalog_entries` (see migration v1 in `server/src/database/migrations.ts`).
- Support **HTTP** and **filesystem** sources through driver classes.
- Expose `GET /api/catalog` for listing cached entries and `POST /api/catalog/sync` for refreshing either the default repo or a specific `repoId`.
- Ensure checksum + timestamp metadata stays accurate so the UI can show when a repo was last synced.

## Key Files
| File | Purpose |
| --- | --- |
| `catalog.repository.ts` | Maps database rows to `CatalogRepoSource` / `CatalogEntry`, handles upserts + deletion of stale entries. |
| `catalog.service.ts` | Validates repo IDs, selects the right driver, normalizes payloads, and writes results via the repository. |
| `drivers/http-driver.ts` | Downloads `index.json` over HTTP (using the shared HTTP client) and validates the payload shape. |
| `drivers/filesystem-driver.ts` | Reads an `index.json` from disk (or directory) and rewrites relative asset URLs to absolute paths. |
| `catalog.routes.ts` | Builds the router with driver instances defined by `AppConfig.catalog.drivers`. |

## Data Model Snapshot
```
catalog_repos
  id TEXT PRIMARY KEY
  name TEXT
  url TEXT
  type TEXT ('http' | 'filesystem')
  checksum TEXT NULL
  last_synced_at INTEGER NULL
  created_at / updated_at INTEGER

catalog_entries
  id TEXT PRIMARY KEY
  repo_id TEXT REFERENCES catalog_repos(id)
  slug TEXT
  name TEXT
  version TEXT
  icon_url TEXT NULL
  archive_url TEXT
  checksum TEXT NULL
  language TEXT NULL
  description TEXT NULL
  created_at / updated_at INTEGER
```

## Sync Flow (`POST /api/catalog/sync`)
1. **Repo selection** – `CatalogService.ensureRepo` resolves the provided `repoId` or lazily bootstraps the default repo defined in `AppConfig.catalog`.
2. **Driver lookup** – The service finds a driver whose `canHandle` matches the repo type; both drivers satisfy the `CatalogDriver` interface (`catalog.types.ts`).
3. **Fetch & normalize** – Drivers turn raw payloads into `CatalogEntry` objects, stamping `createdAt/updatedAt` and injecting the repo ID.
4. **Upsert** – The service updates `catalog_repos`, upserts all entries via a transaction, and deletes entries that disappeared upstream.
5. **Response** – Returns `{ repo, entriesUpdated, entriesRemoved, checksum }`; the controller wraps it in `{ status: 'sync queued', ... }` with HTTP 202 so the UI can poll.

## Listing Entries (`GET /api/catalog`)
- Accepts optional `repoId` query parameter to filter entries.
- Returns `{ entries }` sorted alphabetically (per repository) so the renderer does minimal work.

## Configuration Hooks
- **Default repo** – `CATALOG_REPO_ID`, `CATALOG_REPO_NAME`, and `CATALOG_REPO_URL` env vars override the built-in `resources/catalog/default/index.json` reference.
- **Driver selection** – `AppConfig.catalog.drivers` lists driver keys; change this to disable filesystem syncing in production.
- **Cache TTL** – `cacheTtlSeconds` is defined today but caching is handled at the DB level; if you add an in-memory cache, reuse this setting.

## Extending the Module
- Add new drivers by implementing `CatalogDriver` and registering them inside `catalog.routes.ts`.
- Include additional metadata columns by editing migration v1 and updating `mapEntryRow` / `mapRepoRow` so API responses stay consistent.
- Whenever schemas or driver outputs change, update this doc and `docs/backend/index.md` so the catalog contract stays discoverable.
