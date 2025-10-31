# Repository Guidelines

## Project Structure & Modules
- App root: `jamra-2/`
- Frontend (Vite + React): `src/`, entry `src/main.tsx`
- Electron (main/preload): `electron/main.ts`, `electron/preload.ts`
- Backend (Express + better-sqlite3): `server/src/` → builds to `server/dist/`
- Packaging config: `electron-builder.yml`; release output: `release/`
- Docs: `docs/` (packaging, troubleshooting, structure)

## Build, Test, Development
- Dev frontend: `pnpm dev`
- Dev backend: `pnpm dev:server`
- Dev both (concurrently): `pnpm dev:all`
- Production build (app + server): `pnpm build && pnpm build:server`
- Windows distributables (installer + portable): `pnpm dist:win`
- macOS/Linux (run on those OSes): `pnpm dist:mac`, `pnpm dist:linux`

## Coding Style & Naming
- TypeScript strict across app and server
- Prettier + ESLint; run `pnpm lint`
- Indentation: 2 spaces; use explicit return types for public APIs
- Filenames: kebab-case for files, PascalCase for React components, camelCase for functions/vars

## Testing Guidelines
- Manual packaged run is required for native module/packaging checks
- Health endpoint: `GET http://localhost:3000/health` returns `{ status: 'ok' }`
- Verify DB path under `app.getPath('userData')` and that migrations run on first launch
- Packaged launch logs: `%APPDATA%/jamra-2/logs/main.log`

## Commit & PR Guidelines
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `build:`, `chore:`
- Keep commits scoped; one logical change per commit
- PRs include: overview, screenshots (UI), linked issues, and test notes (how you verified build/run)
- Avoid noise; remove dead config (e.g., Forge artifacts) when migrating tooling

## Platform & Packaging Notes
- Electron Builder is used (NSIS installer + portable on Windows)
- Preload is built as CommonJS and unpacked: `dist-electron/preload.js`
- Server schema is bundled via `extraResources` at `resources/server/schema.sql`
- better-sqlite3 is external and rebuilt by `postinstall` (`electron-builder install-app-deps`)

## Support & Troubleshooting
- See `docs/Windows-Electron-Packaging.md` and `docs/Troubleshooting-Windows.md`
- If the app lingers after close, tail the log and file an issue with timestamps
