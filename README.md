# Jamra Manga Reader

A feature-rich manga reader desktop application built with Electron, React, and Express.

## Tech Stack

### Frontend
- **React 19.1.1** - UI library
- **Mantine 8.3.5** - Component library
- **TailwindCSS 4.1.16** - Styling
- **Zustand 5.0.8** - Client state management
- **TanStack Query 5.90.5** - Server state management
- **React Router 7.9.4** - Routing

### Backend
- **Express 5.1.0** - REST API server
- **Better-SQLite3 12.2.0** - Database (with cross-platform support)
- **Node.js 20+** - Runtime (required)

### Desktop
- **Electron 38.3.0** - Desktop wrapper
- **Electron Builder 26.1.0** - Build tooling

## Architecture

The app uses a **REST API architecture** instead of Electron IPC:
- **Backend Server**: Express REST API on `http://localhost:3000`
- **Frontend**: React SPA accessible in Electron OR browser
- **Database**: SQLite for local storage
- **Cross-Platform**: Windows, macOS, Linux

## Project Structure

```
jamra-2/
├── server/                 # Express backend
│   ├── src/
│   │   ├── database/      # SQLite schema & connection
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── types/         # TypeScript types
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
│   └── routes/           # React Router config
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

# Build Electron app
pnpm build:electron
```

## State Management

### Zustand Stores (Client State)
- **useLibraryStore** - Library UI state (view mode, selection, sorting)
- **useReaderStore** - Reader state (current page, fullscreen)
- **useSettingsStore** - App settings (persisted to localStorage)
- **useDownloadStore** - Download queue state
- **useUIStore** - Global UI state (modals, sidebars)

### TanStack Query (Server State)
- **useMangaQueries** - Manga CRUD operations
- **useChapterQueries** - Chapter queries
- **useLibraryQueries** - Library & reading progress
- **useDownloadQueries** - Download queue management

## API Endpoints

All endpoints accessible at `http://localhost:3000/api`

### Manga
- `GET /api/manga` - List all manga
- `GET /api/manga/:id` - Get manga by ID
- `POST /api/manga` - Create manga
- `PUT /api/manga/:id` - Update manga
- `DELETE /api/manga/:id` - Delete manga

### Chapters
- `GET /api/chapters?mangaId=:id` - Get chapters by manga ID
- `GET /api/chapters/:id` - Get chapter by ID
- `POST /api/chapters` - Create chapter
- `DELETE /api/chapters/:id` - Delete chapter

### Library
- `GET /api/library` - Get library items
- `POST /api/library` - Add manga to library
- `DELETE /api/library/:mangaId` - Remove from library
- `GET /api/library/progress/:mangaId` - Get reading progress
- `PUT /api/library/progress` - Update reading progress

### Downloads
- `GET /api/downloads` - Get download queue
- `POST /api/downloads` - Add to download queue
- `DELETE /api/downloads/:id` - Remove from queue

## Cross-Platform Notes

### Better-SQLite3 Considerations

Better-SQLite3 uses **native bindings** which require special handling:

1. **Prebuilt Binaries**: The `postinstall` script runs `electron-builder install-app-deps` to ensure correct binaries for your platform

2. **Testing**: Build and test on each target platform:
   - Windows x64/arm64
   - macOS Intel/Apple Silicon
   - Linux x64/arm64

3. **Troubleshooting**: If native bindings fail:
   - Ensure Node.js 20+ is installed
   - Run `pnpm rebuild better-sqlite3`
   - Check electron-builder logs

## Scripts

- `pnpm dev` - Start Vite dev server + compile & launch Electron (auto)
- `pnpm dev:server` - Start Express backend with watch mode
- `pnpm build` - Build frontend for production
- `pnpm build:server` - Build backend for production
- `pnpm build:electron` - Package Electron app for distribution
- `pnpm lint` - Run ESLint

## Routes

- `/` - Library (home)
- `/library` - Library view
- `/manga/:id` - Manga details
- `/reader/:chapterId` - Full-screen reader
- `/downloads` - Download queue
- `/settings` - App settings

## Next Steps

1. **Implement Database Queries** - Connect services to SQLite
2. **File Management** - Implement manga/chapter file operations
3. **Download Manager** - Build download queue worker
4. **Reader Features** - Add page preloading, keyboard shortcuts
5. **Search & Filters** - Library search and filtering
6. **Manga Sources** - Add web scraping for manga sources

## License

Private project
