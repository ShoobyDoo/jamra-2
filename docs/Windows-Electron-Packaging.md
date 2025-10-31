# Windows Packaging Guide (Electron + Vite + Express + better-sqlite3)

This is the working recipe that produces a fast, functional Windows installer and a portable EXE for `jamra-2`.

## Prerequisites
- Node.js 20+
- Visual Studio 2022 Build Tools: Desktop development with C++ + Windows 10/11 SDK
- Python 3 on PATH
- pnpm 9+

## Architecture Overview
- Frontend: Vite + React bundled into `dist/`.
- Main process: Electron loads `dist-electron/main.js` and `preload.js`.
- Backend: Express app compiled to `server/dist/` and started inside the main process.
- Database: SQLite via `better-sqlite3` with DB at `app.getPath('userData')`.

## Key Config (what makes it work)
- `electron-builder.yml`
  - `asar: true`; `asarUnpack: ['**/*.node', 'dist-electron/preload.js']`
  - `extraResources`: `server/src/database/schema.sql` → `server/schema.sql`
  - Windows targets: `nsis`, `portable` (installer + single EXE)
- `electron/main.ts`
  - Sets runtime env: `DB_PATH`, `RESOURCES_PATH`, `ELECTRON_PACKAGED`
  - Minimal file logger (no dialogs), logs to `%APPDATA%/Jamra Manga Reader/logs/main.log`
  - Preload path outside ASAR in production
- `server/src/database/migrations.ts`
  - Packaged: read schema from `${process.resourcesPath}/server/schema.sql`
  - Dev: read from `server/src/database/schema.sql`
- `vite.config.ts`
  - Externalize native and server deps (e.g., `better-sqlite3`, `express`) for the Electron main build

## Commands
- Dev (2 terminals):
  - `pnpm dev:server` and `pnpm dev`
- Package for Windows (installer + portable):
  - `pnpm make`
- Outputs: `release/Jamra Manga Reader-<version>-Setup.exe` and `release/Jamra Manga Reader <version>.exe`

## Logging & Diagnostics
- File log only (no dialogs): `%APPDATA%/Jamra Manga Reader/logs/main.log`
- Successful startup shows:
  - “Database connected: …\manga.db”
  - “Migrations completed successfully”
  - “Server running at http://localhost:3000”

## Why Electron Builder (not Squirrel)
- Squirrel issues (icon format, tooling) caused fragile builds.
- Electron Builder gave a clean NSIS installer and portable EXE with native module rebuilds.

## Notes on better-sqlite3
- Rebuilt on install: package has `postinstall: electron-rebuild -f -w better-sqlite3` and builder also runs rebuild.
- Native addon loading: keep `.node` files outside ASAR (`asarUnpack`).
- Don’t bundle it in Vite: keep as external in the main process build.

