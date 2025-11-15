# JAMRA Codebase Recon

## Table of Contents
- [Overview](#overview)
- [Directory & Module Inventory](#directory--module-inventory)
  - [Root Layout](#root-layout)
  - [Frontend `src/`](#frontend-src)
  - [Backend `server/`](#backend-server)
  - [Desktop shell `src-tauri/`](#desktop-shell-src-tauri)
  - [Shared Assets & Data](#shared-assets--data)
  - [Build Outputs](#build-outputs)
  - [Documentation & Utility Folders](#documentation--utility-folders)
- [Tooling & Config Snapshot](#tooling--config-snapshot)
- [Shared Types & Schema Catalog](#shared-types--schema-catalog)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Desktop Shell (Tauri)](#desktop-shell-tauri)
- [Build/Test/Dev Automation](#buildtestdev-automation)
- [Outstanding TODOs & Risk Notes](#outstanding-todos--risk-notes)
- [Severity Rubric](#severity-rubric)
- [Issue Inventory](#issue-inventory)
- [Remediation Ordering](#remediation-ordering)
- [Preventative Guardrails](#preventative-guardrails)

## Overview
- _Note: This document is being updated to reflect the new Tauri-based desktop shell. Sections that still mention Electron/`dist-electron` refer to the legacy implementation._
- Cross-platform desktop manga reader/manager combining a Vite/React frontend, a Tauri shell, and an Express + better-sqlite3 backend. Packaging is handled by the Rust-based Tauri bundler.
- Monorepo structure managed by `pnpm` with a dedicated `server/` workspace; shared scripts run from the repo root.

## Directory & Module Inventory

### Root Layout
- `src/` – primary frontend SPA source (React + Vite). Entry: `src/main.tsx`, root component `src/App.tsx`.
- `src-tauri/` – Rust desktop shell (Tauri builder, config, and server launcher).
- `server/` – Express/better-sqlite3 backend (TypeScript) compiled to `server/dist/`.
- `docs/` – extensive documentation (structure, packaging, testing, backend/frontend guides). Electron docs are legacy reference only.
- `resources/` – packaged assets bundled with the app (extension catalog + extension bundles).
- `data/` – development data directory (SQLite DB `manga.db`, `downloads/` directory). Not shipped.
- `public/` – static assets served by Vite during dev/build.
- Config roots: `tsconfig*.json`, `package.json`, `pnpm-workspace.yaml`, `vite.config.ts`, `src-tauri/tauri.conf.json`, `eslint.config.js`, Tailwind/PostCSS configs.
- Output/aux folders: `dist/`, `src-tauri/target/`, `server/dist/`, `node_modules/`.

### Frontend `src/`
- Entry files: `main.tsx` bootstraps React, `App.tsx` defines routes/layout.
- Subdirectories:
  - `api/` – client-side API layer for backend/Electron calls.
  - `assets/` – static assets referenced in app.
  - `components/` – UI building blocks (layouts, shared cards, Installer/Audit views).
  - `constants/`, `lib/`, `hooks/`, `store/` – config data, utilities, React hooks, global state.
  - `pages/`, `routes/` – page-level components and router definitions.
  - `test/` – frontend mocks/utilities for testing.
  - `types/` – shared TypeScript types consumed by the frontend.
  - `docs/` (inside `src`) – likely dev-focused documentation or story-like content referenced by UI.

### Backend `server/`
- `src/index.ts` initializes Express, WebSocket server, migrations, and exposes `initializeServer`/`shutdownServer`.
- Structure:
  - `app/` – Express setup, including routers/middleware wiring.
  - `core/` – configuration, logging, feature flags, and foundational utilities.
  - `database/` – better-sqlite3 initialization, schema, migrations.
  - `middleware/` – Express middleware definitions.
  - `modules/` – domain-specific logic (extensions, library, downloads, etc.).
  - `routes/` – REST route handlers mounted onto the Express app.
  - `sdk/` – shared contracts (e.g., `ExtensionManifest`) intended for consumption outside the backend.
  - `shared/` – reusable helpers (HTTP client, logger).
  - `types/` – backend-specific TypeScript definitions.
  - `websocket/` – WebSocket handlers and events.
- Build output: `server/dist/` (CommonJS) plus supporting assets referenced by `electron-builder`.

### Desktop Shell `src-tauri/`
- `src/main.rs` – Tauri app entry. Spawns the compiled Express server (in production builds), wires window lifecycle, and will eventually host tray/menu logic.
- `tauri.conf.json` – build/deployment configuration that points to Vite dev server (`pnpm dev`) and copies `dist/`, `server/dist/`, `resources/`, and `node_modules/` into the final bundle.
- `Cargo.toml` / `build.rs` – Rust manifest + build script used by `tauri-build`.

### Shared Assets & Data
- `resources/catalog/` – curated metadata used to populate extension marketplace/catalog at runtime.
- `resources/extensions/` – bundled extensions shipped with the app (likely zipped or directories).
- `data/manga.db` – local SQLite database for development.
- `data/downloads/` – sandbox for downloaded chapters/assets while testing.
- `public/` & `src/assets/` – frontend asset pipelines handled by Vite.

### Build Outputs
- `dist/` – Vite production build for the renderer.
- `dist-electron/` – compiled Electron main/preload bundles ready for packaging.
- `server/dist/` – built backend server consumed by Electron and distributed via `extraResources`.
- `release/` – `electron-builder` artifacts (installers/portable builds per OS).

### Documentation & Utility Folders
- `docs/` – canonical docs (Project-Structure, Windows Packaging/Troubleshooting, backend/frontend/testing guides, extensions authoring references).
- `README.md`, `README.testing.md`, `AGENTS.md`, `CLAUDE.md` – root references for contributors/agents.
- `scripts/` – currently empty scaffold for future automation.
- `.github/workflows/` – CI definitions (e.g., `tests.yml`).

## Tooling & Config Snapshot
- **Package management (`package.json`, `pnpm-workspace.yaml`)**
  - Root uses `pnpm@10.22.0` with workspace entry for `server/`.
  - `type: module`, `main: dist-electron/main.cjs`; `pnpm.overrides` pins Vite to `rolldown-vite@7.1.14`.
  - `pnpm.onlyBuiltDependencies` ensures native deps (`better-sqlite3`, `electron`, `sharp`, etc.) rebuild during install.
- **Root scripts**
  - Dev: `pnpm dev` runs `vite` + `tsx watch server/src/index.ts` via `concurrently`.
  - Build: `pnpm build` -> `tsc -b` (app) + `vite build`, then `pnpm run build:server` which compiles extensions (`tsconfig.extensions.json`) and invokes `pnpm --filter jamra-server run build`.
  - Tests: `pnpm test` runs Vitest in CI mode; use `pnpm vitest` (or `pnpm vitest -- --ui`) for watch/UI loops. Integration runs via `pnpm test:integration` with `pnpm vitest -- --config vitest.integration.config.ts --watch|--ui` for interactive sessions. Coverage gating uses `pnpm test -- --coverage`. `pnpm test:extensions` builds the backend and runs the extension harness (manifest validation, compiler smoke tests, and repository index linting when present).
  - Packaging: `pnpm dist` chains `pnpm build`, `electron-rebuild -f -w better-sqlite3`, then `electron-builder`; platform helpers `dist:win|mac|linux`.
  - Utilities: `rebuild:native` triggers the `better-sqlite3` rebuild; `clean` wipes `dist`, `dist-electron`, `out`, `server/dist`.
- **Server workspace (`server/package.json`)**
  - Scripts: `build` runs `tsc -p tsconfig.json`; `test:extensions` executes the compiled harness in `dist/tests/extension-harness.js` to lint manifests and compile sample extensions.
  - Outputs CommonJS bundle into `server/dist` (referenced by Electron builder as extraResource).
- **TypeScript project structure**
  - Root `tsconfig.json` uses project references → `tsconfig.app.json` (frontend), `tsconfig.node.json` (tooling configs), `tsconfig.extensions.json` (extension runtime checks). All enforce strict mode, bundler resolution, `noEmit`.
  - `electron/tsconfig.json` targets ES2022 CommonJS with outDir `dist-electron`.
  - `server/tsconfig.json` compiles NodeNext modules from `src/` to `server/dist/` with declarations + maps.
- **Linting & formatting**
  - `eslint.config.js` (flat config) extends `@eslint/js` + `typescript-eslint`, adds `react-hooks` + `react-refresh` plugins; enforces `_`-prefixed unused vars allowance and ignores `dist` artifacts. Run via `pnpm lint`.
  - Prettier configured via plugins (`prettier`, `prettier-plugin-organize-imports`, `prettier-plugin-tailwindcss`) though no explicit `.prettierrc`.
- **Vite & Electron bundling (`vite.config.ts`)**
  - Plugins: Tailwind (v4), React, `vite-plugin-electron` (dual entry for `electron/main.ts` and `electron/preload.ts`).
  - Main build outputs `dist-electron/main.cjs`, externalizes Electron + backend deps, and guards startup errors.
  - Preload compiled to CommonJS `preload.js` with `options.reload()` hot refresh.
- **Styling pipeline**
  - `tailwind.config.js` scans `index.html` + `src/**/*.{js,ts,jsx,tsx,mdx}`; extends height tokens for 100dvh.
  - `postcss.config.cjs` layers `postcss-preset-mantine` and `postcss-simple-vars` for Mantine breakpoint variables.
- **Testing configs**
  - `vitest.config.ts` runs with `happy-dom`, global assertions, setup file `src/test/setup.ts`, coverage targeted at hooks/api/lib directories.
  - `vitest.integration.config.ts` mirrors plugins but uses `src/test/integration-setup.ts`, includes `*.integration.test.*`, and raises timeouts to 10s.
- **Electron Builder (`electron-builder.yml`)**
  - Outputs to `release/`, packages `dist`, `dist-electron`, `server/dist`, and `server/src/database/schema.sql` (as extraResource `server/schema.sql`).
  - Asar enabled with preload unpacked; Windows builds NSIS installer + portable, mac builds DMG/ZIP, Linux builds DEB. Icons pulled from `public/`.
- **Runtime configuration (`server/src/core/config/app-config.ts`)**
  - Environment defaults: `NODE_ENV` (development fallback), backend listens on `PORT` (default `3000` per `server/src/index.ts:147`).
  - Supports catalog/env overrides (`CATALOG_REPO_*`, `CATALOG_CACHE_TTL`), extension dirs (`EXTENSIONS_INSTALL_DIR`, `EXTENSIONS_BUNDLE_DIR`), runtime limits (`EXT_RUNTIME_TIMEOUT`, `EXT_RUNTIME_HEAP`), installer knobs (`INSTALLER_CONCURRENCY`, `INSTALLER_TEMP_DIR`, `INSTALLER_VERIFY_SIGNATURES`), sandbox allow-list (`SANDBOX_NET_ALLOWLIST`).

## Shared Types & Schema Catalog
Documented contracts focus on anything moving across layers (server ↔ renderer ↔ docs) plus native schemas.

- **Settings**
  - Backend canonical definitions live in `server/src/modules/settings/settings.types.ts` with `SettingScope = "app" | "catalog" | "extensions" | "sandbox"`, `Setting<T>` storing `Date` timestamps, and repository helpers for CRUD + scoping.
  - Frontend mirror exists in `src/types/index.ts` (`SettingScope` also includes `"reader"` + `"downloads"`, dates stored as ISO `string`). Drift noted: renderer scopes have no backend support; timestamp types differ.
  - Additional legacy types in `server/src/sdk/extensions/settings-binder.ts` (e.g., `SettingsAccessors`, `NumberSettingOptions`) implement runtime validation but are not exported to the renderer.
- **Catalog entries**
  - Backend `CatalogEntry`/`CatalogRepoSource`/`CatalogSyncResult` defined in `server/src/modules/catalog/catalog.types.ts` using `Date` fields and repo metadata.
  - Frontend equivalents in `src/types/index.ts` (`CatalogEntry`, `CatalogListResponse`, `CatalogSyncResponse`) shape REST payloads with `string` timestamps and nested `repo` objects.
  - Duplication risk: property lists mostly align but field ordering and types (Date vs string) differ; no shared import path.
- **Extensions SDK + runtime**
  - `server/src/sdk/index.ts` holds the authoritative `ExtensionManifest`, `ExtensionCapabilities`, `ExtensionSettingsSchema`, `ExtensionModule`, payload/result DTOs (`SearchPayload`, `MangaDetailsResult`, etc.).
  - Renderer-only copy of `ExtensionManifest`, `ExtensionRecord`, `ExtensionSearchResult`, etc. sits inside `src/types/index.ts` with fewer fields (no `description`, `language` optional, no `capabilities`). Consumers include hooks under `src/hooks/queries` and UI components.
  - `server/src/modules/extensions/extensions.types.ts` defines `ExtensionRecord`, registry/runtime contracts, and loader abstractions. Diff vs renderer: backend allows optional `repoSource`, `checksum`, `installedAt?: Date`, but frontend treats them as required `string`/`string timestamps`.
- **Installer / repository schema**
  - `server/src/modules/installer/types/repository-schema.types.ts` codifies the extension repository index structure (`ExtensionMetadata`, `ExtensionRepositoryIndex`, `SUPPORTED_SCHEMA_VERSIONS`, etc.).
  - No renderer counterpart; catalog UI hardcodes expectations via `CatalogEntry` rather than referencing repository schema, so validation changes must be manually mirrored.
- **Library + reading progress**
  - Backend canonical types: `server/src/modules/library/library.types.ts` (status enum, `LibraryItem`, `ReadingProgress`, `UpsertProgressInput`, DB row mappers). Additional legacy lightweight definitions remain in `server/src/types/library.types.ts`.
  - Frontend definitions in `src/types/index.ts` include `LibraryStatus`, `LibraryItem`, `LibraryListResponse`, `LibraryStats`, `ReadingProgress`, `ContinueReadingEntry`. Differences: renderer `LibraryItem` exposes `dateAdded`/`lastUpdated` as ISO strings plus `favorite` flag, while backend uses `Date`. Backend lacks `LibraryStats` DTO even though frontend expects aggregated counts.
- **Downloads**
  - Backend types: `server/src/modules/downloads/downloads.types.ts` and repository equivalents describing `DownloadStatus`, `Download`, `DownloadedPage`, `DownloadStats`, filter/input DTOs with `Date` fields and snake_case DB rows.
  - Renderer types: `src/types/index.ts` (`DownloadQueueItem`, `DownloadListResponse`, `DownloadedPage`, `DownloadStats`, `ReaderChapter`). Differences: renderer models include `progressPercent`, `pageUrl`, `filePath` as strings, and treat timestamps as ISO strings; backend lacks some renderer-only helpers like `ReaderChapter`.
- **WebSocket payloads**
  - Canonical definitions plus enum map live in `server/src/websocket/events.ts` (`WS_EVENTS`, `DownloadStartedPayload`, `LibraryItemSnapshotPayload`, etc.).
  - Renderer duplicates them in `src/types/websocket.ts` and re-exports via `src/types/index.ts`. Currently identical, but manual sync is required—there is no shared import.
- **Docs vs runtime**
  - `docs/frontend-api-contracts.md`, `docs/backend/*.md`, and `src/types/index.ts` each describe API DTOs. None are generated from the TypeScript sources, so every change requires touching all three sources manually.
- **Resource schemas**
  - SQLite schema tracked in `server/src/database/migrations.ts` and shipped as `server/src/database/schema.sql` (copied via `electron-builder.yml` `extraResources`). Any migration altering table columns (downloads, library, history) must stay in sync with DTOs above.
- **Gap highlights**
  - No shared package exports types for consumption by both `server` and `src`. Every “shared” interface is duplicated (with drift) or redeclared (e.g., `server/src/types/library.types.ts` vs `server/src/modules/library/library.types.ts` vs `src/types/index.ts`).
  - Renderer makes generous `[key: string]: unknown` allowances (e.g., `ExtensionManifest`) to paper over backend changes, masking actual schema mismatches.
  - WebSocket + SDK payloads are prime candidates for a shared `packages/types` workspace or generated `d.ts` file referenced via path aliases to eliminate manual syncing.

## Frontend Architecture
- **Stack & entry point**
  - React 19 + React Router 7 + Vite renderer housed in `src/`.
  - `src/main.tsx` boots the app: wraps `<App />` with `QueryClientProvider` (`src/lib/query-client.ts`), Mantine theme provider, global notifications, and React Query Devtools.
  - Styling mixes Mantine components with Tailwind utility classes (global styles from `src/index.css`, theme in `tailwind.config.js` + Mantine CSS imports).
- **Routing**
  - `src/routes/index.tsx` builds a `createBrowserRouter` instance with `AppLayout` wrapper and lazy-loaded pages for Home, Discover, Library, Downloads, History, Extensions, Settings, MangaDetails, Reader, plus NotFound/Error boundaries.
  - Route constants exported from `src/routes/routes.config.ts` (not shown here) keep path usage centralized.
  - Layout uses `AppShell` (`src/components/AppLayout.tsx`) providing shared `Header`/`Navbar` components under `src/components/layout`.
- **Data layer**
  - REST interactions flow through `src/api/client.ts`, a fetch wrapper layering `API_PATHS` + `API_BASE_URL` (defaults to `http://localhost:3000`, override via `VITE_API_URL`).
  - Queries live under `src/hooks/queries/*`, each exporting query keys + TanStack Query hooks. Example: `useHomeQueries.ts` fetches `/api/library` then per-item `/api/library/:id/last-read` to build continue-reading cards; `useExtensionsQueries.ts`, `useLibraryQueries.ts`, etc. follow same structure.
  - React Query config (`src/lib/query-client.ts`, `src/constants/query.ts`) tunes stale time (5m), GC (15m), retry policies (skip 4xx), and disables refetch on focus.
- **State management**
  - Lightweight persisted UI settings managed via Zustand stores (`src/store/useSettingsStore.ts`, `useUIStore.ts`, `useLibraryStore.ts`). Stores hold reader preferences, UI toggles, and local library filters to avoid prop drilling.
- **Real-time updates**
  - `src/lib/websocket-client.ts` manages a reconnecting WS connection to `WS_URL` (`ws://localhost:3000` unless `VITE_WS_URL` present), exposing `on/off/send` helpers and download subscription commands.
  - `useWebSocketBridge.ts` mounts once in `App.tsx` to subscribe to download/library events, invalidate React Query caches, and display Mantine notifications. Event typings pulled from duplicated `src/types/websocket.ts`.
- **UI composition**
  - Components under `src/components/` split by domain: `extensions/InstallerForm`, `history/AuditLogView`, `library/LibraryCard`, shared cards (`shared/UnifiedMangaCard`) and layout primitives (Navbar/Header).
  - Mantine-based forms + Tailwind utility classes provide styling; `src/constants/ui.ts` centralizes layout sizes, pagination defaults, debounce timings, etc.
  - Pages under `src/pages/` orchestrate hooks + components; e.g., `HomePage` consumes `useHomeQueries`, `ExtensionsPage` wires installer form + extension lists, `ReaderPage` handles reading controls using Zustand store preferences.
- **Testing aids**
  - `src/test/mocks/data.ts` hosts mock DTOs referenced by hook tests (`src/test/queries/*.test.ts`). Setup lives in `src/test/setup.ts` and `integration-setup.ts` (Used by Vitest configs).

## Backend Architecture
- **Runtime + entry point**
  - Server bootstrapped from `server/src/index.ts`: loads config (`core/config/app-config.ts`), shared logger + HTTP client, opens better-sqlite3 connection (`server/src/database/connection.ts`), runs migrations, builds the Express app via `createApp`, and attaches both HTTP + WebSocket servers (ws). Default port `process.env.PORT ?? 3000`.
- **Express application (`server/src/app`)**
  - `createApp` wires logging middleware, CORS, JSON parsing, `/health`, then defers to `registerAppRoutes` which mounts `/api/*` routers for catalog, extensions, installer, library, downloads, settings, and reader modules.
  - Global `errorHandler` + `requestLogger` middlewares centralize response formatting and observability (files under `server/src/middleware`).
  - `AppContext` carries config, DB handle, HTTP client, and logger to every module factory.
- **Database layer**
  - Persistent storage uses better-sqlite3. Connection helper ensures `data/` path exists (overridden by Electron via `DB_PATH`) and flips `PRAGMA foreign_keys=ON`.
  - Schema defined in `server/src/database/migrations.ts` (mirrored to `server/src/database/schema.sql` for packaging). Tables cover catalog repos/entries, extensions, installer jobs, library items, reading progress, downloads + downloaded_pages, history/audit tables, and app settings.
- **Modules**
  - **Catalog (`server/src/modules/catalog`)**: drivers (filesystem, HTTP) fetch extension repos into the database, repository API exposes `listEntries/listRepos/upsert`, controller exposes `/api/catalog`, `/api/catalog/sync`, plus repo metadata. Uses `AppContext` logger + HTTP client for remote fetches.
  - **Extensions (`server/src/modules/extensions`)**: `extensions.module.ts` composes registry (SQLite-backed), loader (esbuild-based bundler + sandbox), and runtime (executes extension lifecycle with timeouts/network restrictions). Routes cover listing installed extensions, enabling/disabling, invoking extension search/manga endpoints, etc. Bootstrap hooks register bundled extensions from `resources/extensions` and start a dev watcher in development.
  - **Installer (`server/src/modules/installer`)**: validates repository manifests against `types/repository-schema.types.ts`, orchestrates download/unpack jobs, and exposes `/api/installer` endpoints for kicking off installs + polling job status. Leverages `extensions` module to register successfully installed bundles.
  - **Library (`server/src/modules/library`)**: handles CRUD for user library items, favorite toggles, status updates, stats aggregation, and reading progress. Routes expose `/api/library`, `/api/library/:id`, `/api/library/:id/progress`, stats endpoints, and last-read lookups.
  - **Reader (`server/src/modules/reader`)**: surfaces chapter/page access by joining library entries, downloads, and extension runtime (for streaming). Routes allow navigation (`next`/`previous`), fetching specific pages, and returning preloaded descriptors for the reader UI.
  - **Downloads (`server/src/modules/downloads`)**: repository + services manage queueing, progress tracking, and persistence of downloaded pages. `downloader.service.ts` coordinates concurrency limits, uses extension runtime to fetch pages, stores files under `data/downloads`, and emits WebSocket events via `websocket/handlers.ts`.
  - **Settings (`server/src/modules/settings`)**: simple key-value repository backed by the `settings` table, used by installer/runtime to persist app-level toggles. Exposed at `/api/settings`.
  - **Shared modules**: `server/src/shared/http/http-client.ts` wraps global fetch with timeouts; `server/src/shared/logger.ts` standardizes logging; `server/src/core/config` handles env var parsing.
- **WebSocket subsystem**
  - `server/src/websocket/handlers.ts` builds a singleton `WebSocketServer`, tracks subscriptions (currently download-specific), and exposes helper emitters (`emitDownloadProgress`, etc.). Events + payload types defined next to it (`websocket/events.ts`) and reused by frontend copies.
- **SDK + external surface**
  - `server/src/sdk` exports the Extension SDK consumed by external extension authors (manifest, runtime context, search/reader payload contracts) plus helpers like `extensions/filter-normalizer`.
  - Extensions are expected to load via `createExtension` factory; runtime enforces sandbox timeouts and allowed network hosts from config.

## Electron Architecture
- **Main process (`electron/main.ts`)**
  - Detects dev vs packaged: in dev, assumes `pnpm dev:server` already running on `http://localhost:3000`; in production it sets `DB_PATH`, `RESOURCES_PATH`, and calls `initializeServer()` from `server/dist/index.js`, binding to `PORT` (default 3000) and exposing WebSocket + REST endpoints.
  - Sets up resilient logging (writes to `%APPDATA%/JAMRA/logs/main.log`), catches uncaught exceptions early, and funnels logs to file + console.
  - Manages a single `BrowserWindow` (contextIsolation on, preload script), tray icon/menu, and preference-driven behavior (e.g., close-to-tray). Loads `http://localhost:5173` in dev or `dist/index.html` in production.
  - Provides app controls via IPC: showing window, opening the backend in an external browser, clean exits. Integrates with OS (`app.setAppUserModelId`, custom tray icons).
  - Graceful shutdown: listens for `before-quit`, destroys tray, invokes `shutdownServer()` with timeout fallback to prevent dangling sockets.
- **Preload (`electron/preload.ts`)**
  - Bridges a typed `ElectronAPI` into `window.electron`, exposing `preferences.get/set/subscribe` and app controls (`showWindow`, `openInBrowser`, `exit`). Enforces context isolation and uses `contextBridge`.
  - Listens for `preferences:changed` IPC broadcasts to push updates into renderer subscribers.
- **IPC contracts (`electron/ipc-channels.ts`, `src/types/electron-api.d.ts`)**
  - String constants ensure main/preload/renderer stay aligned. Preference DTOs limited to `closeButtonMinimizesToTray` and `startMinimizedToTray`; changes require updating both Electron and renderer type declarations manually.
- **Preferences store (`electron/preferences-store.ts`)**
  - Persists JSON under `app.getPath("userData")/preferences.json`, merges defaults, and exposes synchronous `get/set`. Main process broadcasts updates to all `BrowserWindow` instances.
- **Tooling**
  - Built via `vite-plugin-electron` entries defined in `vite.config.ts`: main bundle outputs CommonJS `dist-electron/main.cjs`, preload outputs CommonJS `preload.js` (unpacked in ASAR per `electron-builder.yml`).
  - Packaging orchestrated by `electron-builder.yml` (NSIS installer, portable, DMG, ZIP, DEB) with `server/dist/**` bundled as `extraResources` alongside schema/sql assets.

## Build/Test/Dev Automation
- **Local development**
  - `pnpm dev` (root) launches Vite (`pnpm dev:frontend`) and `tsx watch server/src/index.ts` (`pnpm dev:server`) via `concurrently`.
  - Environment defaults assume backend on `http://localhost:3000` and frontend on `http://localhost:5173`. Override renderer endpoints with `VITE_API_URL` / `VITE_WS_URL`.
  - Electron main process in dev defers to the separately running server; no hot reload for main process beyond `vite-plugin-electron` rebuilds.
  - `pnpm rebuild:native` forces a `better-sqlite3` rebuild after Node/Electron upgrades.
- **Build pipeline**
  - `pnpm build`: runs project references (`tsc -b`) for frontend + `vite build`, then `pnpm build:server` which first compiles extension TypeScript (`tsconfig.extensions.json`) and finally `pnpm --filter jamra-server run build` to emit `server/dist`.
  - `pnpm dist`: orchestrates prod build, reruns `electron-rebuild -f -w better-sqlite3`, then invokes `electron-builder` (config in `electron-builder.yml`). Platform-specific wrappers (`dist:win`, `dist:mac`, `dist:linux`) append CLI flags; `make` is an alias for Windows packaging.
- **Testing**
  - Unit suite (`pnpm test` for CI, `pnpm vitest` for watch, `pnpm vitest -- --ui` for UI debugging, `pnpm test -- --coverage` for reports) uses Vitest + MSW + Testing Library per `vitest.config.ts` and `src/test/setup.ts`. Coverage targets hooks/API/lib modules (V8 provider, JSON + HTML reports).
  - Integration suite (`pnpm test:integration` for single runs with `pnpm vitest -- --config vitest.integration.config.ts --watch|--ui` for dev loops) relies on a running backend; config in `vitest.integration.config.ts` with 10s timeouts and `src/test/integration-setup.ts`. `README.testing.md` details workflows, watch modes, scoping tests, debugging tips, and coverage status.
  - Extension harness (`pnpm test:extensions`) builds the backend, validates every `resources/extensions/*/manifest.json`, compiles TypeScript entrypoints via the installer compiler, and checks repository-style `index.json` files (when present) for schema drift.
- **Linting/formatting**
  - `pnpm lint` runs ESLint flat config across repo (TS + React). Prettier plugins listed in devDependencies handle import order + Tailwind sorting via editor/tooling, but no CLI script defined.
- **Continuous integration (`.github/workflows/tests.yml`)**
  - `unit-tests` job (Ubuntu) installs deps via pnpm, runs `pnpm test` + `pnpm test -- --coverage`, uploads coverage JSON to Codecov (token required).
  - `integration-tests` job builds the server, starts `pnpm dev:server` in background, polls `/health`, executes `pnpm test:integration`, then tears down the process and uploads logs/artifacts (server stdout, *.log, sqlite db snapshots).
- **Manual + platform docs**
  - `README.testing.md` plus files under `docs/testing-*.md` cover setup, quick start, integration strategies, and gap plans.
  - `docs/Windows-Electron-Packaging.md` + `docs/Troubleshooting-Windows.md` outline signing/prereqs, verifying native modules, and log locations (`%APPDATA%/JAMRA/logs/main.log`).
  - `docs/Project-Structure.md`, `docs/backend/*`, `docs/extensions/*`, etc., expand on build scripts, packaging steps, and expected manual QA (e.g., verifying `GET /health`, checking DB path `app.getPath('userData')`, ensuring migrations run on first launch).

## Outstanding TODOs & Risk Notes
- **Shared-type drift:** Duplicate definitions for `ExtensionManifest`, `ExtensionRecord`, `CatalogEntry`, `SettingScope`, etc., live in both `server/src/**` and `src/types/index.ts` with conflicting required fields/timestamp formats. No shared package enforces parity, so runtime payloads can silently diverge.
- **Docs vs scripts mismatch:** `README.md:252` instructs developers to run `pnpm dev:all`, but no such script exists (only `pnpm dev`). AGENTS.md repeats the stale command. Onboarding instructions will fail without manual correction.
- **InstallerForm hook warning:** `src/components/extensions/InstallerForm.tsx:241` still carries a TODO about calling `setNotifiedCompletion` inside `useEffect`. The current implementation wraps `setTimeout` but the TODO indicates unresolved review feedback.
- **Library store TODOs:** `src/store/useLibraryStore.ts:18-31` includes “// TODO: Implement” comments even though the logic mutates the Zustand set. Indicates either incomplete multi-select behaviors or leftover scaffolding that may confuse contributors.
- **Extension compiler limitations:** `server/src/modules/installer/compiler/extension-compiler.ts:108` explicitly TODOs multi-file compilation (only entrypoint supported). Complex extensions requiring imports will fail until bundling is implemented.
- **Testing risk:** Integration workflow depends on manually starting `pnpm dev:server`; README/testing docs stress this, but there’s no smoke test covering Electron packaging or installer flows (Windows packaging docs insist on manual verification).

## Severity Rubric
- **CRITICAL**
  - Definition: Bugs or structural flaws that can corrupt data, prevent the app from launching/building, open security holes, or ship broken installers. Requires immediate remediation before any release.
  - Examples: Divergent schemas between backend and renderer that break API parsing, migrations that drop data, Electron failing to start backend, unsigned/native module packaging regressions.
  - Verification: Automated regression test + manual reproduction steps (e.g., Vitest integration + packaged build smoke test) plus log capture.
- **HIGH**
  - Definition: Cross-module defects that don’t crash outright but yield incorrect behavior for core flows (library, downloads, extensions) or guarantee future breakage (type drift, missing sync). Not as catastrophic as CRITICAL but blocks releases until fixed.
  - Examples: Duplicate `ExtensionManifest` contracts, docs instructing nonexistent dev scripts, lack of shared type package, installer not validating manifests across renderer/server.
  - Verification: Unit/integration coverage in affected module + documentation updates describing prevention.
- **MEDIUM**
  - Definition: Localized issues affecting a single component or feature without broader fallout, or missing automation that slows development (e.g., TODO comments in stores, missing smoke tests for ancillary tooling).
  - Verification: Unit tests or storybook/manual checks, plus lint/config updates if applicable.
- **LOW**
  - Definition: Minor correctness/stability nits such as inconsistent UI states, redundant code, or logging gaps. Doesn’t block release but worth tracking.
  - Verification: Optional targeted tests; focus on code cleanup/consistency.
- **QOL / NICE-TO-HAVE**
  - Definition: Developer experience, documentation, or tooling improvements (shared packages, generation scripts, DX automation) that reduce maintenance risk long-term.
  - Verification: Documented plan/checklist; optional tests if code changes accompany the improvement.

## Issue Inventory
> Remediation will land in severities-first slices so we can focus context on one category at a time.  
> Phase 1 (this pass): CRITICAL contracts. Next passes will cover HIGH → MEDIUM → LOW/QOL.
- **CRITICAL**
  - **Duplicated `ExtensionManifest` / shared DTOs** – Frontend (`src/types/index.ts:61`) and backend SDK (`server/src/sdk/index.ts:8`) define differently shaped manifests (frontend omits description/author/capabilities, treats languages array vs backend single `language`). Same problem extends to `ExtensionRecord`, `CatalogEntry`, `SettingScope`, etc., as documented in [Shared Types & Schema Catalog](#shared-types--schema-catalog). Severity: breaking schema drift between renderer, server, extensions, and docs.
    - **Status (2025-02-15):** ✅ Fixed via a dedicated workspace package `@jamra/contracts` (`packages/contracts/`) that now sources all cross-layer DTOs. Frontend and server import the shared declarations, new `build:contracts` script is wired into both `build:frontend` and `build:server`, and `pnpm exec tsc -p tsconfig.app.json --noEmit` plus `pnpm --filter jamra-server run build` were run to verify both TypeScript pipelines.

- **HIGH**
  - **Lack of shared type package** – There is no generated/types package consumed by both workspaces; every interface is manually copied. Even if the manifest drift is fixed once, nothing prevents regression (see [Shared Types & Schema Catalog](#shared-types--schema-catalog)).
    - **Status (2025-02-16):** ✅ `packages/contracts` now exports the library/download DTOs, with both the renderer (`src/types`) and backend modules importing from the shared source.
  - **Stale developer instructions** – `README.md:252` and `AGENTS.md` instruct running `pnpm dev:all`, a script that does not exist (only `pnpm dev`). New contributors following docs will fail to start the app, blocking onboarding.
    - **Status (2025-02-16):** ✅ README/AGENTS scripts now document `pnpm dev` for dual-run plus `pnpm dev:frontend`/`pnpm dev:server` for single targets.
  - **Server/library type duplication** – `server/src/types/library.types.ts` (legacy) conflicts with `server/src/modules/library/library.types.ts` and renderer definitions, creating three opinions of library DTOs with different fields (`isFavorite` vs `favorite`, epoch numbers vs ISO strings).
    - **Status (2025-02-16):** ✅ Legacy types removed; library/download repositories emit ISO strings and align with `@jamra/contracts`, eliminating drift.
  - **Catalog DTO drift** – Backend uses `Date` objects in `server/src/modules/catalog/catalog.types.ts`, while renderer expects ISO strings + nested repo metadata; serializers aren’t enforcing consistent casing or types.
    - **Status (2025-02-17):** ✅ Shared `@jamra/contracts` catalog DTOs now expose ISO string timestamps, drivers/repositories normalize payloads to those strings, and the server build path (`pnpm run build:server`) verifies the new serialization pipeline end-to-end.

- **MEDIUM**
  - **No automated extension tests** – `pnpm test:extensions` in both root `package.json` and `server/package.json` is a stub; docs (`docs/extensions-authoring.md:297`) explicitly call testing “TODO.” Extension runtime/regression bugs will go unnoticed until manual audits.
    - **Status (2025-02-18):** ✅ Added `server/src/tests/extension-harness.ts` plus a real `pnpm test:extensions` script that builds the backend, validates every `resources/extensions/*` manifest, compiles TypeScript entrypoints via `ExtensionCompiler`, and lint-checks catalog indexes so schema drift fails CI.
  - **Extension compiler limitations** – `server/src/modules/installer/compiler/extension-compiler.ts:108` only compiles the entrypoint file and TODOs support for imports. Any extension that splits logic across files will fail.
    - **Status (2025-02-18):** ✅ `ExtensionCompiler.compileFromFiles` now materializes source maps into a temp workspace and bundles via esbuild entry points, so multi-file TypeScript extensions (and manifest JSON imports) build identically to the loader path.
  - **Installer job effect warning** – `src/components/extensions/InstallerForm.tsx:241` still sets state inside `useEffect` (albeit via `setTimeout`) and carries a TODO note to fix it, hinting at unresolved React render-loop risk.
    - **Status (2025-11-13):** ✅ `JobProgressCard` now deduplicates completion notifications via a ref-based guard (no `setState` inside the effect) and `src/components/extensions/__tests__/JobProgressCard.test.tsx` covers success/failure notification flows.
  - **Zustand library store TODOs** – `src/store/useLibraryStore.ts:18-31` includes “TODO: Implement” comments despite partial logic, signaling incomplete multi-select UX (e.g., deselect/clear operations) with no tests referencing the store.
    - **Status (2025-11-13):** ✅ Store actions now short-circuit redundant updates, TODO scaffolding is removed, and `src/store/useLibraryStore.test.ts` asserts selection/clear/view-mode behaviors to guard future edits.

- **LOW**
  - **Docs/testing drift for manual checks** – Manual requirements (packaged health checks, `%APPDATA%/JAMRA/logs/main.log` review) exist only in docs; there’s no checklist or automation ensuring they’re followed, so instructions can rot unnoticed.
    - **Status (2025-11-13):** ✅ Added `docs/manual-verification-checklist.md`, linked it from `README.md`, and provided the `pnpm manual:health` helper so manual smoke runs share a consistent checklist plus scriptable verification.
  - **Legacy files** – Empty `scripts/` directory and unused helper types linger, increasing noise for new contributors.
    - **Status (2025-11-13):** ✅ Populated `scripts/` with `manual-health-check.mjs` and wired it to `pnpm manual:health`, giving the directory a concrete purpose instead of deleting it outright.

- **QOL / NICE-TO-HAVE**
  - **Automated packaging smoke test** – CI currently runs only Vitest suites; no job builds the Electron app or boots it in headless mode to ensure `initializeServer` works post-bundle.
    - **Status (2025-11-13):** ✅ Added `scripts/packaging-smoke.mjs` + `pnpm smoke:packaging`, and the GitHub Actions `packaging-smoke` job now builds the renderer/server bundles and verifies `server/dist/index.js` responds on `/health` after compilation.
  - **Doc/source sync tooling** – API docs (`docs/frontend-api-contracts.md`, `docs/backend/*`) and renderer types require manual sync. A doc generator or typed SDK export would prevent future drift.

## Remediation Ordering
1. **Unify shared types (CRITICAL/HIGH)**
   - Create a dedicated `packages/contracts` workspace that exports DTOs + Extension SDK types. Move `server/src/sdk/index.ts` + renderer DTOs into the package, emit `.d.ts` files, and wire path aliases so both `src/` and `server/` import from one place.
   - Add a build step (`pnpm build:types`) plus CI check (`tsc -b packages/contracts`) to ensure type drift fails fast. Update docs (frontend/backend/API contracts) to import snippets from the shared source.
2. **Align module contracts (HIGH)**
   - Once the shared package exists, reconcile mismatches: normalize `SettingScope` enums, convert catalog/library/download timestamps to ISO strings at the API boundary, and delete legacy `server/src/types/library.types.ts`.
   - Add serialization tests (Vitest integration) verifying that backend responses conform to the shared contract (e.g., `GET /api/library` returns the type exported to the renderer).
3. **Fix developer workflow docs (HIGH)**
   - Update `README.md` + `AGENTS.md` to reference `pnpm dev` (or add a `dev:all` alias if desired). Include explicit steps for running backend-only (`pnpm dev:server`) and frontend-only.
4. **Introduce extension validation harness (MEDIUM/HIGH)**
   - Implement real logic for `pnpm test:extensions`: compile sample extensions using the installer/compiler, run linting across manifests, and ensure analyzer catches missing fields.
   - Integrate the harness into CI (post-unit job) so regressions fail the pipeline; document usage in `docs/extensions-authoring.md`.
5. **Expand installer/compiler capabilities (MEDIUM)**
   - Teach `compileFromFiles` how to bundle dependencies (esbuild in-memory FS or temporary workspace) so multi-file extensions succeed. Add fixtures + tests that import shared helpers to guard against regressions.
6. **UI/state cleanup (MEDIUM/LOW)**
   - Resolve pending TODOs in `InstallerForm` and `useLibraryStore`, adding targeted unit tests to ensure selection state + notification flows behave correctly (or remove stale comments if the implementation is final).
7. **Automation/QOL (LOW/QOL)**
   - Add a lightweight packaging smoke test job that runs `pnpm build && pnpm --filter electron vite build` (or launches playwright smoke) to ensure Electron main/preload bundles continue to initialize.
   - Remove the empty `scripts/` directory or populate it with helper scripts (e.g., log tailing, DB reset) to reduce repository noise.

## Preventative Guardrails
- **Shared type governance**
  - Treat the new `packages/contracts` bundle as the single source of truth. Require PRs touching API DTOs or Extension SDK exports to include updates there plus snapshot diffs.
  - Add an ESLint rule or custom lint script that forbids importing from `src/types/index.ts` once the contract package exists; enforce via CI.
- **Automated schema validation**
  - Introduce contract tests that hit every REST endpoint and validate runtime payloads against Zod/io-ts schemas generated from the shared types. Fail the pipeline if serialization deviates.
  - During packaging, add a smoke script that boots the Electron app (or at least runs `initializeServer()` + `createWindow()` in CI) to ensure the compiled bundles remain loadable.
- **Documentation refresh cadence**
  - Track a quarterly task (or pre-release checklist) to sync `README`, `docs/frontend-api-contracts.md`, and `docs/backend/*` with actual scripts + DTOs. Automate portions using doc generation from TypeScript comments.
- **Extension QA pipeline**
  - Extend CI to run the extension harness (`pnpm test:extensions`) plus a signature of sample manifests before publishing releases. Optionally gate packaging jobs on harness success.
- **Observability & logging**
  - Standardize log schemas (JSON lines or structured logger) for both Electron main and backend, and add automated checks to ensure `%APPDATA%/JAMRA/logs/main.log` is writable during packaged smoke tests.
