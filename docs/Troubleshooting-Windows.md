# Troubleshooting (Windows)

Quick fixes for errors we actually hit packaging and running on Windows.

## ENOENT: schema.sql not found

- Symptom: `Migration failed: ENOENT ... server/src/database/schema.sql` in main.log.
- Fixes:
  - Package the schema: `electron-builder.yml` → `extraResources: server/src/database/schema.sql -> server/schema.sql`.
  - At runtime set env vars in `electron/main.ts`: `RESOURCES_PATH=process.resourcesPath`, `ELECTRON_PACKAGED=true`.
  - In `server/src/database/migrations.ts` load `${process.resourcesPath}/server/schema.sql` when packaged.

## “require('electron')” not available

- Symptom: Dialog: “Calling 'require' for 'electron' in an environment that doesn't expose require”.
- Fix: Remove/avoid modules that `require('electron')` in ESM before app init (we removed electron-log) and use a simple file logger in main.

## Squirrel “Unable to set icon” / spawn errors

- Symptom: Squirrel fails making the installer, icon errors or missing tool.
- Fix: Use Electron Builder for Windows. If you must use Squirrel, provide a `.ico` for `setupIcon`.

## Native module ABI mismatch (better-sqlite3)

- Symptom: Module not found / invalid ELF/PE / binding error at runtime.
- Fixes:
  - Rebuild on install: `postinstall: electron-rebuild -f -w better-sqlite3`.
  - Let Electron Builder run @electron/rebuild during packaging.
  - Ensure `.node` files are unpacked: `asarUnpack: '**/*.node'`.

## Logs do not appear

- Symptom: No log file.
- Fix: Main ensures `%APPDATA%/Jamra Manga Reader/logs/main.log` exists. On antivirus-locked systems, re-run the app or whitelist the log path.

## Health check failing

- Symptom: App exits early; main.log shows health check retries failing.
- Fix: Inspect preceding errors (DB, port binding). Server must print “Server running at http://localhost:3000”.
