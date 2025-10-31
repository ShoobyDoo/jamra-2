# Project Structure (Windows build relevant)

- `src/` – React app (Vite) → bundled to `dist/`.
- `electron/` – Main and preload scripts built to `dist-electron/`.
- `server/` – Express backend (TypeScript) compiled to `server/dist/`.
- `server/src/database/schema.sql` – Database schema; packaged to `${process.resourcesPath}/server/schema.sql`.
- `electron-builder.yml` – Windows packaging config (NSIS + portable).
- `release/` – Build outputs (installer and portable EXE).

Key runtime paths (Windows packaged):
- Logs: `%APPDATA%/Jamra Manga Reader/logs/main.log`
- DB file: `%APPDATA%/Jamra Manga Reader/manga.db`
- Preload: `${resources}/app.asar.unpacked/dist-electron/preload.js`
- Schema: `${resources}/server/schema.sql`

