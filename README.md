# JAMRA

A feature-rich manga reader desktop application built with Electron, React, and Express.

## Tech Stack

### Frontend

- **React 19** - UI library
- **Mantine 8** - Component library
- **TailwindCSS 4** - Styling
- **Zustand 5** - Client state management
- **TanStack Query 5** - Server state management
- **React Router 7** - Routing

### Backend

- **Express 5** - REST API server
- **Better-SQLite3 12** - Database (with cross-platform support)
- **Node.js 20+** - Runtime (required)

### Desktop

- **Electron 38+** - Desktop wrapper
- **Electron Builder** - Packaging (NSIS/Portable/DMG/DEB)

### Background Mode & Tray Controls

- Closing the Electron window now hides JAMRA to the system tray (default behavior) so the bundled server keeps running.
- Use the tray menu to show the window again, open the app in your browser at `http://localhost:<configured-port>`, or exit completely.
- Toggle “Close button minimizes to tray” from **Settings → Window Behavior** if you prefer the classic quit-on-close workflow.

> **Note**: Version numbers listed above represent major versions. For exact dependency versions, refer to `package.json`.

## Architecture

The app uses a **modular REST API architecture** with an extension system:

- **Backend Server**: Express REST API on `http://localhost:3000`
- **Frontend**: React SPA accessible in Electron OR browser
- **Database**: SQLite for local storage
- **Extensions**: Modular system for manga sources (weebcentral, batoto, etc.)
- **WebSocket**: Real-time updates for downloads and progress
- **Cross-Platform**: Windows, macOS, Linux

## Project Structure

```
JAMRA/
├── server/                 # Express backend
│   ├── src/
│   │   ├── app/           # Express app & route registration
│   │   ├── core/          # Configuration, database, infrastructure
│   │   ├── database/      # SQLite schema & migrations (legacy)
│   │   ├── modules/       # Modular architecture
│   │   │   ├── catalog/   # Catalog service + drivers
│   │   │   ├── extensions/# Extension registry, loader, runtime
│   │   │   ├── installer/ # Extension installation workflow
│   │   │   └── settings/  # Server/client configuration
│   │   ├── sdk/           # Extension SDK for developers
│   │   ├── shared/        # Cross-cutting utilities (HTTP, logger)
│   │   ├── types/         # Legacy TypeScript types
│   │   └── websocket/     # WebSocket handlers for real-time updates
│   └── tsconfig.json
├── electron/              # Electron main process
│   ├── main.ts           # Window management & server launcher
│   └── preload.ts        # Minimal preload script
├── src/                   # React frontend
│   ├── components/       # UI components
│   ├── hooks/queries/    # TanStack Query hooks
│   ├── pages/            # Route pages
│   ├── store/            # Zustand stores
│   ├── api/              # API client
│   ├── routes/           # React Router config
│   └── constants/        # API endpoints, WebSocket events, UI constants
├── resources/             # Extension bundles & assets
│   └── extensions/       # Local extensions (weebcentral, batoto, etc.)
└── data/                  # User data (created at runtime)
    ├── database/         # SQLite database
    └── downloads/        # Downloaded manga
```

## Getting Started

### Prerequisites

- **Node.js 20+** (required for better-sqlite3 v12)
- **pnpm** (recommended)

### Installation

```bash
# Install dependencies (will trigger postinstall for native deps)
pnpm install
```

### Development

**Option 1: Run in Browser (Faster for UI Development)**

```bash
# Terminal 1: Start backend server
pnpm dev:server

# Terminal 2: Start Vite dev server
pnpm dev

# Open http://localhost:5173 in your browser
```

**Option 2: Run in Electron (Full Desktop App)**

```bash
# Terminal 1: Start backend server
pnpm dev:server

# Terminal 2: Start Vite + Electron
pnpm dev

# Electron window will open automatically!
# vite-plugin-electron compiles main.ts/preload.ts and launches the app
```

> **Note**: `pnpm dev` automatically compiles Electron TypeScript files and launches the Electron window. You no longer need a separate `dev:electron` command!

### Building

```bash
# Build frontend
pnpm build

# Build backend
pnpm build:server

# Package distributables for current OS
pnpm make
```

### Platform-Specific Builds (Electron Builder)

Build distributables for each platform:

```bash
# Windows installer (NSIS) and portable EXE
pnpm dist:win

# macOS dmg/zip
pnpm dist:mac

# Linux deb
pnpm dist:linux
```

Electron Builder is configured in `electron-builder.yml` and includes:

- Files: `dist/**`, `dist-electron/**`, `server/dist/**`
- ASAR unpack for native modules: `**/*.node`
- Windows targets: NSIS installer + Portable EXE
- macOS targets: DMG + ZIP
- Linux targets: DEB

### Windows Prerequisites (better-sqlite3)

- Install Visual Studio 2022 Build Tools with “Desktop development with C++” and Windows 10/11 SDK.
- Install Python 3 and ensure `python` is on PATH.
- After `pnpm install`, native modules are rebuilt automatically via `postinstall`:
  - `electron-rebuild -f -w better-sqlite3`

### Log Files (for debugging packaged exe)

- Main/server logs: `%APPDATA%/JAMRA/logs/main.log`
- On macOS: `~/Library/Application Support/JAMRA/logs/main.log`
- On Linux: `~/.config/JAMRA/logs/main.log`

## State Management

### Zustand Stores (Client State)

- **useLibraryStore** - Library UI state (view mode, selection, sorting)
- **useReaderStore** - Reader state (current page, fullscreen)
- **useSettingsStore** - App settings (persisted to localStorage)
- **useUIStore** - Global UI state (modals, sidebars)

### TanStack Query (Server State)

- **useLibraryQueries** – Library list/detail, stats, and reading progress sync
- **useDownloadQueries** – Download queue, stats, and queue/cancel mutations
- **useExtensionsQueries** – Extension registry, search, manga, chapters, and page descriptors

## API Endpoints

All endpoints accessible at `http://localhost:3000/api`

### Catalog

- `GET /api/catalog` - Get cached catalog entries
- `POST /api/catalog/sync` - Refresh catalog from remote repository

### Extensions

- `GET /api/extensions` - List installed extensions
- `GET /api/extensions/:id` - Get extension details
- `GET /api/extensions/:id/search` - Search manga via extension
- `GET /api/extensions/:id/manga/:mangaId` - Get manga details + chapters
- `GET /api/extensions/:id/manga/:mangaId/chapters` - Get chapters only
- `GET /api/extensions/:id/manga/:mangaId/chapters/:chapterId/pages` - Get page URLs
- `POST /api/extensions/install` - Install extension (in progress)

### Installer

- Extension installation endpoints (in development)

### Settings

- Server and client configuration endpoints

### WebSocket Events

Real-time updates via WebSocket:

- `download:started` - Download started
- `download:progress` - Download progress update
- `download:page:complete` - Page download completed
- `download:chapter:complete` - Chapter download completed
- `download:failed` - Download failed
- `download:cancelled` - Download cancelled

## Cross-Platform Notes

### Better-SQLite3 Considerations

Better-SQLite3 uses **native bindings** which require special handling:

1. **Native Bindings**: Rebuilt on install (`postinstall`) for the active Electron version.

2. **Packaging targets**: Electron Builder configured for Windows (NSIS + Portable), macOS (DMG/ZIP), Linux (DEB). Build per-OS on native runners (no cross‑OS signing/building).

3. **Testing**: Build and test on each target platform:
   - Windows x64/arm64
   - macOS Intel/Apple Silicon
   - Linux x64/arm64

4. **Troubleshooting**: If native bindings fail:
   - Ensure Node.js 20+ is installed
   - Run `pnpm exec electron-rebuild -f -w better-sqlite3`
   - Check `logs/main.log` for errors

## Scripts

- `pnpm dev` - Start Vite dev server + compile & launch Electron (auto)
- `pnpm dev:server` - Start Express backend with watch mode
- `pnpm dev:all` - Run both frontend and backend concurrently
- `pnpm build` - Build frontend for production
- `pnpm build:server` - Build backend for production
- `pnpm make` - Package Electron app for current OS
- `pnpm dist:win` - Build Windows installer + portable EXE
- `pnpm dist:mac` - Build macOS DMG + ZIP
- `pnpm dist:linux` - Build Linux DEB
- `pnpm lint` - Run ESLint
- `pnpm test:extensions` - Test extensions (in development)

## Routes

- `/` - Home page
- `/discover` - Discover new manga
- `/library` - Library view
- `/downloads` - Download queue
- `/history` - Reading history
- `/extensions` - Browse and manage extensions
- `/settings` - App settings
- `/manga/:id` - Manga details
- `/reader/:chapterId` - Full-screen reader

## Features & Roadmap

### Implemented

- ✅ Extension system for manga sources
- ✅ Local extension support (weebcentral, batoto)
- ✅ WebSocket real-time updates
- ✅ Download progress tracking
- ✅ Modular backend architecture
- ✅ Cross-platform builds (Windows, macOS, Linux)

### In Progress

- 🚧 Extension installer API
- 🚧 Catalog sync from remote repositories
- 🚧 Extension settings UI

### Planned

- 📋 Download queue worker with retry logic
- 📋 Reader enhancements (page preloading, keyboard shortcuts)
- 📋 Library search and advanced filtering
- 📋 Reading history tracking
- 📋 Manga recommendations

## License

Private project
