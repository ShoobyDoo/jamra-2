# Frontend Gap Implementation Plan

Comprehensive plan derived from the backend references in `docs/backend/*.md` (settings, catalog, extensions, installer, library, downloads, reader, websocket, endpoints, index) and the current React/Vite frontend under `src/`. The goal is to align the renderer with the implemented server capabilities.

---

## Backend Feature Sets Snapshot

| Feature | Responsibilities (per docs) | Key Endpoints / Events |
| --- | --- | --- |
| **Settings** | Scoped key/value store (`settings` table). | `GET/PUT/DELETE /api/settings`, `GET /api/settings/:key`. |
| **Catalog** | Sync Mihon-style extension catalogs via HTTP/filesystem drivers. | `GET /api/catalog`, `POST /api/catalog/sync`. |
| **Extensions & Installer** | Registry, runtime, loader, installer jobs, search/details/chapters/pages execution. | `/api/extensions/*`, `/api/extensions/install*`, `/api/installer/*`. |
| **Library & Progress** | Manage library entries (`library` table), read progress, stats, favorites, WebSocket broadcasts. | `/api/library` CRUD + progress routes, `/api/library/stats`, WebSocket `library:item:*`. |
| **Downloads** | Queue + persist chapter downloads, manage files, stats, WebSocket progress events. | `/api/downloads`, `/api/downloads/:id`, `/api/downloads/stats`, WebSocket `download:*`. |
| **Reader** | Serve chapter metadata, prev/next navigation, proxy/serve page binaries, update `reading_progress`. | `/api/reader/:libraryId/chapters/:chapterId[/next|/previous|/pages/:n]`. |
| **WebSocket** | Shared channel for downloads + library change streams, optional download subscriptions. | `ws://<host>:3000`, events per `docs/backend/websocket.md`. |

---

## Gap Analysis & Implementation Plan

### 1. API Client & Shared Types Foundation
- **Current State**: `src/api/client.ts` always parses JSON (fails for backend `204` responses like downloads/settings deletes). `src/constants/api.ts` defines placeholder endpoints (`/manga`, `/chapters`) that don't exist. `src/types/index.ts` models fake entities (`Manga`, `Chapter`, etc.) unrelated to backend payloads. Query hooks (`src/hooks/queries/*.ts`) expect those shapes and call non-existent routes.
- **Backend Reality**: All payloads described in `docs/backend/endpoints.md` wrap data (e.g., `{ items, total }`, `{ downloads: [...] }`) and use ids like `libraryId`, `extensionId`, etc.
- **Action Plan**:
  1. Update `apiClient` to return `null` for `204` responses and accept `Response` instances for binary reader pages.
  2. Replace `src/constants/api.ts` with constants mirroring backend routes (settings, catalog, extensions, installer, library, downloads, reader, health). Include helpers for nested paths (`readerChapter(libraryId, chapterId)` etc.).
  3. Define TypeScript interfaces mirroring backend contracts (settings, catalog entries, extension manifests, library item snapshots, download rows, reader payloads, WebSocket payloads). Either port types from `server/src/types` or describe them per docs.
  4. Rewrite React Query hooks to target real endpoints and unwrap server envelopes (`data.items`). Remove dead hooks for `/manga`/`/chapters`; replace with extension-aware hooks (search/details/chapters/pages) and library/download specific hooks.
  5. Delete `useDownloadStore.ts` (documented anti-pattern) once queries are in place to prevent regressions.
  - ✅ Status (2025-01-13): Completed via new `API_PATHS`, enhanced `apiClient` null/binary handling, backend-aligned shared types, rewritten library/download/extension React Query hooks, and removal of the deprecated download Zustand store.

### 2. Settings & Preferences
- **Backend**: `/api/settings` allows storing app/catalog/extensions/sandbox values; backend docs emphasize scopes, JSON payloads, and future validation.
- **Frontend Status**: `src/pages/SettingsPage.tsx` only toggles Electron `closeButtonMinimizesToTray` via preload API—no server settings UI.
- **Gaps**:
  - No surface for viewing/updating backend settings (e.g., sandbox allowlist, reader defaults).
  - No persistence of reader/download preferences to server scope (`reader.pageTurn`, `download.quality`).
- **Implementation Tasks**:
  1. Build a settings service hook (list, get, upsert, delete) using new API constants.
  2. Extend `SettingsPage` to show backend settings grouped by scope (app, extensions, sandbox) with forms mapped to known keys.
  3. Wire reader/download UI controls (currently stored in `useSettingsStore.ts`) to persist via `/api/settings`, keeping Zustand as local cache synced with server responses.
  4. Provide optimistic UI + error toasts leveraging 204 responses.
  5. Keep Electron-only tray toggle but visually separate backend-backed preferences.
  - ✅ **Status (2025-01-13)**: Completed comprehensive settings management implementation:
    - **Settings Query Hooks** ([src/hooks/queries/useSettingsQueries.ts](src/hooks/queries/useSettingsQueries.ts)):
      - `useSettingsList`: Fetch all settings with optional scope filter
      - `useSetting<T>`: Fetch single setting with type safety
      - `useUpdateSetting`: Upsert settings with cache invalidation
      - `useDeleteSetting`: Delete settings with cache removal
      - Proper query key management with `settingsKeys` factory
    - **Settings Constants** ([src/constants/settings.ts](src/constants/settings.ts)):
      - Organized setting keys by scope (APP, READER, DOWNLOADS, CATALOG, SANDBOX)
      - Type-safe options for page fit, reading direction, page turn mode, download quality, themes
      - Default values for all settings with helper functions
      - Scope detection utility (`getScopeFromKey`)
    - **Enhanced SettingsPage** ([src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx)):
      - Organized into 5 sections: Window Behavior, Appearance, Reader, Downloads, Catalog
      - Reusable setting components: `SettingSelect`, `SettingSwitch`, `SettingNumber`
      - Each component fetches current value, falls back to defaults, and updates via API
      - Optimistic updates with notifications on success/error
      - Maintains Electron-only tray toggle in separate section
    - **API Integration**:
      - Tested all CRUD operations (GET list, GET single, PUT upsert, DELETE)
      - Verified 204 responses for mutations
      - Confirmed proper scope handling and cache invalidation

### 3. Catalog + Extensions + Installer Management
- **Backend**: Catalog sync (`GET/POST /api/catalog`), extension registry/list/search/manga/chapters/pages, installer job queue/polling, job statuses (`pending` → `completed`), WebSocket events notifies when library updates occur after install.
- **Frontend**: `ExtensionsPage.tsx` placeholder; no catalog views or install flows. Discover page uses static trending mock data.
- **Gaps & Plan**:
  1. Create Catalog view (under Extensions or Discover) fetching `/api/catalog` entries with sync controls (trigger `POST /api/catalog/sync` per repo). Display `checksum`, `lastSyncedAt`.
  2. Implement installed extensions list (grid/table) using `GET /api/extensions`.
  3. Add extension detail drawer: surfaces manifest, version, enable/disable (if supported), shortcut actions (Search, manage library for that source).
  4. Build installer form: accept repo URL, optional extension IDs/branch, call `POST /api/extensions/install`, then poll `GET /api/extensions/install/:jobId` displaying statuses defined in docs.
  5. Provide failure logging + link to docs (`docs/backend/installer.md`) for troubleshooting.
  6. For Discover page, drive search results via `/api/extensions/:id/search` with extension selection (dropdown) and filters derived from manifest/scope (per docs). Replace `trendingManga` stub with data aggregated from installed extensions (maybe caching results client-side).
  - ✅ **Status (2025-01-14)**: Completed comprehensive Catalog + Extensions + Installer management implementation:
    - **Catalog Query Hooks** ([src/hooks/queries/useCatalogQueries.ts](src/hooks/queries/useCatalogQueries.ts)):
      - `useCatalogList`: Fetch catalog entries with optional repo filtering
      - `useCatalogSync`: Trigger catalog sync with automatic cache invalidation
    - **Installer Query Hooks** ([src/hooks/queries/useInstallerQueries.ts](src/hooks/queries/useInstallerQueries.ts)):
      - `useInstallExtension`: Start installation job from Git repository
      - `useInstallerJob`: Poll job status with automatic refetch interval based on job state
    - **CatalogSection Component** ([src/components/extensions/CatalogSection.tsx](src/components/extensions/CatalogSection.tsx)):
      - Table view of available extensions from catalog
      - Sync button to refresh catalog from repositories
      - Extension metadata display (name, version, language, description)
      - Install actions for each catalog entry
      - Success/error notifications for sync operations
    - **InstalledExtensionsList Component** ([src/components/extensions/InstalledExtensionsList.tsx](src/components/extensions/InstalledExtensionsList.tsx)):
      - Table view of installed extensions
      - Status badges (enabled/disabled)
      - Extension metadata (version, source, install date)
      - View details action for each extension
    - **ExtensionDetailDrawer Component** ([src/components/extensions/ExtensionDetailDrawer.tsx](src/components/extensions/ExtensionDetailDrawer.tsx)):
      - Drawer panel showing full extension details
      - Manifest display with syntax highlighting
      - Metadata (ID, slug, version, status, install path, repo source)
      - Supported languages list
      - Install timestamp
    - **InstallerForm Component** ([src/components/extensions/InstallerForm.tsx](src/components/extensions/InstallerForm.tsx)):
      - Modal form for installing extensions from Git repositories
      - Repository URL input with validation
      - Optional extension IDs filter (comma-separated)
      - Optional branch selection
      - Real-time job progress tracking with status cards
      - Automatic job polling (1s interval) while jobs are in progress
      - Progress bars showing installation stages (pending → downloading → compiling → installing → completed/failed)
      - Success/error notifications for installation lifecycle
      - Job detail display (extension ID, repo URL, timestamps, error messages)
    - **ExtensionsPage Integration** ([src/pages/ExtensionsPage.tsx](src/pages/ExtensionsPage.tsx)):
      - Organized layout with installer form, installed list, and catalog sections
      - Drawer state management for viewing extension details
      - Proper component composition and data flow
    - **Features**:
      - Full CRUD support for catalog and extension management
      - Real-time installation progress tracking with automatic polling
      - Comprehensive error handling and user feedback
      - Clean separation between catalog browsing and installed extensions
      - Detailed extension information access via drawer
      - Visual status indicators (badges, progress bars, colors)
      - Responsive table layouts with hover effects

### 4. Library Management & Stats
- **Backend**: Rich CRUD, filters (`status`, `favorite`, search, pagination), stats endpoint, per-item progress endpoints, WebSocket `library:item:*`.
- **Frontend**: `LibraryPage.tsx` stub; `LibraryGrid` prints placeholder text; query hooks hit fake endpoints; `HomePage` uses mock continue-reading data.
- **Implementation Steps**:
  1. Build `useLibraryList` hook hitting `GET /api/library` with pagination/filter state kept in URL or Zustand (ui-only). Parse `{ items, total }`.
  2. Implement list/grid (cards) with cover, status/favorite toggles calling `PATCH /api/library/:id` and `PATCH /api/library/:id/favorite`.
  3. Surface stats (reading/completed/etc.) from `/api/library/stats` for filter chips.
  4. Add "Add to Library" actions on Manga Detail page calling `POST /api/library`.
  5. Subscribe to WebSocket library events to update React Query caches (`library:item:added|updated|removed` invalidates relevant queries).
  6. Provide progress editors using `/api/library/:id/progress` endpoints; integrate with reader (see Section 7).
  - ✅ Status (2025-01-13): Completed LibraryPage with real `useLibraryList`, `useLibraryStats`, and filter controls (status, favorite, search). Implemented LibraryCard and LibraryGrid with responsive layouts. Favorite toggle integrated using `useToggleFavorite` mutation. Remaining: WebSocket subscriptions for real-time updates (Section 9), "Add to Library" flow on Manga Details (Section 8).

### 5. Continue Reading (Home) & History Views
- **Backend**: `reading_progress` table, `GET /api/library/:id/last-read`, ability to fetch per-chapter progress.
- **Frontend**: `HomePage.tsx` uses hard-coded `continueReadingData`; `HistoryPage.tsx` placeholder.
- **Plan**:
  1. Create service combining `GET /api/library?sort=lastUpdated` + per-item `/last-read` to build continue-reading cards (preload next chapter number, progress percent derived from `pageNumber/totalPages`).
  2. Update `ContinueReadingCard` to accept data from API and navigate to `ReaderPage` via `libraryId/chapterId`.
  3. Build History page with two view modes:
     - **Default: Reading Activity View** - Chronological reading events from `reading_progress` (reusing `/api/library/:id/progress` aggregated on client) with ability to resume or clear entries. Focus on manga/chapter reading timeline with covers, chapter info, timestamps, and quick resume actions.
     - **Verbose: Audit Log View** - Comprehensive activity log including key actions across the app (library additions, status changes, downloads initiated, settings updates, extension installs, etc.). Provides full app activity history for advanced users who want detailed tracking.
     - Implement view toggle (SegmentedControl or tabs) allowing users to switch between reading-focused and audit log views.
  4. Consider backend enhancement request (if needed) for a `GET /api/history` or `GET /api/audit-log` aggregator; until then, client can fetch recent progress per library item lazily for reading view, and aggregate actions from various sources for audit log.
  - ✅ **Status (2025-01-14)**: Completed comprehensive History Page implementation with dual-view mode:
    - **Reading Activity Query Hooks** ([src/hooks/queries/useReadingActivityQueries.ts](src/hooks/queries/useReadingActivityQueries.ts)):
      - `useReadingActivity`: Aggregates all reading progress across library items with full progress history
      - `useRecentReadingActivity`: Optimized hook that fetches only last read progress per item (more efficient for UI display)
      - Both hooks combine library data with reading progress, sorted by most recent activity
    - **ReadingActivityView Component** ([src/components/history/ReadingActivityView.tsx](src/components/history/ReadingActivityView.tsx)):
      - Card-based timeline displaying reading activity with manga covers
      - Shows chapter number, page progress, completion status
      - Progress bars with percentage indicators
      - Relative timestamps (e.g., "2 hours ago")
      - Quick resume buttons for each entry
      - Empty state with link to Discover page
      - Responsive layout with hover effects
    - **AuditLogView Component** ([src/components/history/AuditLogView.tsx](src/components/history/AuditLogView.tsx)):
      - Timeline-based comprehensive activity log
      - Aggregates events from multiple sources (library, downloads, reading activity)
      - Event types: library additions/updates, reading progress, downloads
      - Color-coded event icons and themed indicators
      - Metadata badges showing event details
      - Relative timestamps for all events
      - Sorted by most recent activity
      - Note about future backend endpoint for settings/extension events
    - **HistoryPage Integration** ([src/pages/HistoryPage.tsx](src/pages/HistoryPage.tsx)):
      - SegmentedControl toggle between "Reading Activity" and "Audit Log" views
      - Clean page layout with proper Container sizing
      - Icon-enhanced view mode labels
      - State management for view switching
    - **Features**:
      - Dual-view mode allows users to focus on reading timeline or see comprehensive app activity
      - Efficient data fetching with optimized hooks for different use cases
      - Real-time navigation to resume reading from any history entry
      - Visual indicators for reading progress and completion status
      - Extensible audit log design ready for future backend enhancements

### 6. Reader Experience
- **Backend**: Reader endpoints deliver metadata + page URLs, handle downloaded vs remote, support prev/next, and update progress when pages are requested. Image streaming requires binary fetch without JSON parsing.
- **Frontend**: `ReaderPage.tsx`, `PageViewer.tsx`, `ReaderControls.tsx` are placeholder-only. `useReaderStore` tracks page state but never syncs with backend.
- **Tasks**:
  1. Implement `useReaderChapter(libraryId, chapterId)` calling `/api/reader/:libraryId/chapters/:chapterId`, storing `pages`, `isDownloaded`, navigation IDs.
  2. Build `useReaderPageImage` hook hitting `/api/reader/.../pages/:pageNumber` returning `Blob` URLs, respecting caching headers and offline storage.
  3. Wire Reader UI: display page images, handle prev/next with `ReaderService.getNext/Previous` endpoints, show download status (downloaded vs streaming).
  4. Integrate progress updates: `ReaderService` already records when images are requested, but front still needs to update local store and show progress indicator; optionally call `/api/library/:id/progress` to sync after session.
  5. Provide actions to jump to next/previous chapter and to open download/queue from Reader.
  6. Handle errors (404 missing pages, extension failures) with retries and fallback messaging matching backend error envelope.
  - ⚡ Status (2025-01-14): Implemented a stop-gap reader that fetches chapter metadata from `/api/reader/:libraryId/chapters/:chapterId` and renders every page in a vertical scroll to keep prototyping unblocked. This will be replaced by the richer experience (navigation, progress syncing, downloads, fullscreen) once the finalized design is ready.

### 7. Downloads & Offline Mode
- **Backend**: `/api/downloads` returns `{ downloads: [...] }`; cancel endpoint returns 204; queue requires `{ libraryId, extensionId, chapterIds[], chapterNumbers? }`; stats endpoint shows disk usage; WebSocket events fire for each milestone.
- **Frontend**: `DownloadsPage.tsx` is empty; `QueueButton` + `DownloadPopoverContent` use mocked data; `useDownloadQueue`/`useStartDownload` expect array responses and send `mangaId/chapterId`.
- **Plan**:
  1. Adjust hooks to consume `{ downloads }` envelope, parameterize filters (status, libraryId). Update `QueueButton` and future `DownloadsPage` to rely on these hooks.
  2. Build start-download mutation that collects `libraryId`, `extensionId`, and selected `chapterIds`. UI should provide selectors in Manga Details + Reader pages to queue downloads per doc requirements.
  3. Fix cancel mutation to handle 204 responses (no JSON). Provide confirmation UI and unlink downloaded files when backend reports `download:cancelled`.
  4. Implement downloads list page with grouping (by library item), progress bars, concurrency indicator, failure/error details, plus `GET /api/downloads/stats` for disk usage banner.
  5. Enhance Queue popover: when opened, subscribe to the selected download IDs via `wsClient.subscribeToDownload` and unsubscribe on close. Use WebSocket payloads to update query cache incrementally instead of full invalidations where possible.
  6. Provide offline reader entry points using `GET /api/downloads/:id` + stored pages when `isDownloaded`.
  - ✅ **Status (2025-11-12)**: Downloads management now delivers real-time data and WebSocket-driven updates:
    - `useDownloadQueue`, `useDownloadStats`, `useDownloadDetails`, and `useStartDownload` are all wired to the backend envelopes with filter + mutation support.
    - `useDownloadSubscription(s)` + `useWebSocketBridge` keep queue data live by subscribing only to the active download IDs (DownloadsPage subscribes to all active IDs, Queue popover subscribes only while open).
    - `DownloadsPage` renders active/complete progress with stats cards, smart loaders, Mantine tables, and cancel actions that handle 204 responses.
    - `DownloadPopoverContent` now reflects real queue state, exposes cancel buttons, and shows animated progress bars.
    - Outstanding: (1) queue-from-reader UX so users can select and queue chapters directly from Reader/Manga Details and (2) offline reader handoff that switches to `GET /api/downloads/:id` assets when a chapter is fully downloaded.

### 8. Discover/Search & Manga Details
- **Backend**: Discovery lives in extensions search/manga details/chapters endpoints; data tied to extension IDs.
- **Frontend**: `DiscoverPage` uses constants; `MangaDetailsPage` stub; `MangaGrid`/`MangaCard` expect nonexistent `Manga` shape; breadcrumbs rely on `useManga`/`useChapter` hooks hitting `/manga`/`/chapters`.
- **Implementation**:
  1. Replace `Manga` structures with `ExtensionSearchResult` (id, title, cover, lang, extensionId). Search form should require user to select extension (or run across all installed by iterating `GET /api/extensions`).
  2. Build `MangaDetailsPage` that takes extensionId + mangaId (from route params or state). Fetch `/api/extensions/:extId/manga/:mangaId`, display description, cover, chapters (either included or via `/chapters`). Provide actions: `Add to Library`, `Start Reading` (calls Reader after verifying library entry), `Download Selected Chapters`.
  3. Update routing to include both `extensionId` and `mangaId` (e.g., `/extensions/:extensionId/manga/:mangaId`) so details + reader can call backend.
  4. Update Breadcrumbs: fetch data using new hooks aligned to extension endpoints; gracefully handle loading/fail states.
  - ✅ **Status (2025-01-13)**: Completed comprehensive Discover & Manga Details implementation with major enhancements:

    **Discover Page ([src/pages/DiscoverPage.tsx](src/pages/DiscoverPage.tsx))**:
    - **Search Modes**: Toggle between "Single Extension" and "Search All" modes with SegmentedControl
    - **Multi-Extension Concurrent Search**: Search across all installed extensions simultaneously with results grouped by extension
    - **Extension Selection**: MultiSelect dropdown to choose specific extensions (empty = all extensions)
    - **Filters & Sorting**: Sort dropdown (relevance, latest, popular, A-Z) integrated into search UI
    - **Popular/Trending Section**: Auto-loads on page mount with empty query, displays 6 results per extension limit
    - **Error Handling**: Alert when no extensions installed, proper loading states

    **UnifiedMangaCard Component ([src/components/shared/UnifiedMangaCard.tsx](src/components/shared/UnifiedMangaCard.tsx))**:
    - Created reusable card component matching ContinueReadingCard aesthetic
    - 2:3 aspect ratio with background cover image
    - Gradient overlays (top for title/metadata, bottom for optional progress)
    - Extension name and status badges with conditional rendering
    - Optional progress section for library items (progress %, chapter number, updated date)
    - Hover effects: Scale transform only (removed contrast/saturation dimming per user feedback)
    - Full accessibility support (keyboard navigation, ARIA labels)

    **ExtensionSearchResults Component ([src/components/discover/ExtensionSearchResults.tsx](src/components/discover/ExtensionSearchResults.tsx))**:
    - Wrapper component that calls `useExtensionSearch` at top level (fixes React hooks violation)
    - Enables safe mapping over extensions for concurrent searches
    - Handles loading states, empty results, and result limiting
    - Responsive grid layout (2-6 columns based on breakpoint)

    **Manga Details Page ([src/pages/MangaDetailsPage.tsx](src/pages/MangaDetailsPage.tsx))**:
    - Two-column layout (cover sidebar + content area)
    - Cover, title, description, authors, tags, status display
    - "Add to Library" mutation with notifications and status dropdown
    - "In Library" badge indicator when manga already in library
    - Chapters table with per-chapter read actions
    - "Start Reading" button (only when in library, navigates to first unread chapter)
    - Full loading/error state handling

    **Bug Fixes & Optimizations**:
    - Fixed `useExtensionSearch` enabled condition: Changed from `Boolean(extensionId && filters?.query)` to `Boolean(extensionId && filters !== undefined)` to allow empty string queries for popular section
    - Removed `contrast-95 saturate-100 group-hover:contrast-105 group-hover:saturate-125` classes from cards, kept only scale effect
    - Updated routes to use `/manga/:extensionId/:mangaId` pattern
    - Updated MangaCard and MangaGrid components to accept extensionId and navigate correctly

### 9. WebSocket Integration & Real-Time State
- **Backend**: Shared channel, optional `subscribe:download`, events for downloads + library.
- **Frontend**: `useWebSocket` hook + client exist but only `QueueButton` listens for `download:progress` and still uses mock data; library components ignore events.
- **Action Items**:
  1. Centralize WebSocket event handling (e.g., `useWebSocketBridge`) that listens once and updates React Query caches (downloads, library) or dispatches to Zustand UI for toasts.
  2. When user opens download details, call `subscribeToDownload(downloadId)` and clean up on unmount to reduce traffic.
  3. Surface WebSocket connection state indicator in Header (maybe color-coded dot) using `useWebSocketStatus`.
  4. Document event payload handling referencing `docs/backend/websocket.md` so future devs know when to update.
  - ✅ **Status (2025-01-14)**: Completed comprehensive WebSocket integration:

    **Core Infrastructure**:
    - **useWebSocketBridge** ([src/hooks/useWebSocketBridge.ts](src/hooks/useWebSocketBridge.ts)): Centralized bridge that listens to all WebSocket events and automatically updates React Query caches
      - Mounted once at app root in [App.tsx](src/App.tsx)
      - Handles all download events (started, progress, chapter complete, failed, cancelled)
      - Handles all library events (item added, updated, removed)
      - Configurable notifications for download completion and failures
      - Smart cache invalidation: invalidates specific queries (detail) for progress updates, broader queries (list, stats) for state changes

    **Download Subscriptions**:
    - **useDownloadSubscription** / **useDownloadSubscriptions** ([src/hooks/useDownloadSubscription.ts](src/hooks/useDownloadSubscription.ts)): Hooks for subscribing to specific download IDs
      - Automatically subscribes on mount and unsubscribes on unmount
      - Reduces traffic by only sending subscribe messages for relevant downloads
      - Integrated in [DownloadsPage.tsx](src/pages/DownloadsPage.tsx) to subscribe to active downloads
      - Integrated in [QueueButton.tsx](src/components/download/QueueButton.tsx) to subscribe only when popover is open

    **Connection Status Indicator**:
    - **WebSocketStatus** component ([src/components/ui/WebSocketStatus.tsx](src/components/ui/WebSocketStatus.tsx)): Visual indicator in Header
      - Color-coded indicator (green=connected, red=disconnected)
      - Processing animation when disconnected
      - Icon changes based on connection state (IconWifi/IconWifiOff)
      - Tooltip shows connection status
      - Added to [Header.tsx](src/components/layout/Header.tsx) next to navigation controls

    **Benefits**:
    - Real-time updates across library and downloads without polling
    - Toast notifications for important events (download complete, failed)
    - Automatic cache synchronization keeps UI fresh
    - Connection status visibility for users
    - Traffic optimization via targeted subscriptions

### 10. Navigation, Routing & Derived UI
- **Issues**: Breadcrumbs rely on data from nonexistent `/manga`/`/chapters` endpoints. Many routes (`/reader/:chapterId`) lack `libraryId` so Reader can't call backend API (needs both path params). `buildRoute.mangaDetails` misses extension context.
- **Plan**:
  1. Redesign routes to carry necessary identifiers (`/library/:libraryId/reader/:chapterId`, `/extensions/:extensionId/manga/:mangaId`). Update `buildRoute` helpers accordingly.
  2. Refactor Breadcrumbs to use new hooks that query real APIs; fallback to placeholders when data unavailable.
  3. Ensure navigation buttons (Header Search, cards) pass along extension/library metadata required by backend endpoints.
  - ✅ Status (2025-01-13): Updated route definitions in `src/routes/routes.config.ts` to use `/manga/:extensionId/:mangaId` and `/reader/:libraryId/chapters/:chapterId`. Updated `buildRoute` helpers to accept all required parameters. Refactored Breadcrumbs component to handle multi-segment paths with skipNext logic. Routes now align with backend API requirements.

### 11. Testing, Tooling & Observability
- **Backend expectations**: docs stress manual packaged testing, health check usage, log locations.
- **Frontend additions**:
  1. Add MSW or Mirage mocks replicating backend responses for storybook/testing to keep UI dev productive without server.
  2. Implement integration tests (Vitest + testing-library) for hooks calling `/api/*`, mocking fetch to ensure envelopes parsed correctly.
  3. Provide developer docs (maybe `docs/frontend-api-contracts.md`) summarizing how frontend uses backend endpoints, referencing this plan for onboarding.
  - ✅ **Status (2025-01-14)**: Completed comprehensive testing infrastructure and developer documentation:
    - **Testing Setup**:
      - Installed Vitest 4, Testing Library, MSW 2, happy-dom
      - Created [vitest.config.ts](../vitest.config.ts) with coverage configuration
      - Set up test utilities ([src/test/utils.tsx](../src/test/utils.tsx)) with React Query wrapper
      - Created test setup file ([src/test/setup.ts](../src/test/setup.ts)) with MSW integration
    - **MSW Mock Server**:
      - Configured MSW server ([src/test/mocks/server.ts](../src/test/mocks/server.ts))
      - Created comprehensive mock data ([src/test/mocks/data.ts](../src/test/mocks/data.ts)) for all entities
      - Built complete API handlers ([src/test/mocks/handlers.ts](../src/test/mocks/handlers.ts)) replicating all backend endpoints
      - Supports all endpoint categories: settings, catalog, extensions, installer, library, downloads, reader
    - **Integration Tests**:
      - Library query hooks tests ([src/hooks/queries/useLibraryQueries.test.ts](../src/hooks/queries/useLibraryQueries.test.ts))
      - Download query hooks tests ([src/hooks/queries/useDownloadQueries.test.ts](../src/hooks/queries/useDownloadQueries.test.ts))
      - Extensions query hooks tests ([src/hooks/queries/useExtensionsQueries.test.ts](../src/hooks/queries/useExtensionsQueries.test.ts))
      - Catalog query hooks tests ([src/hooks/queries/useCatalogQueries.test.ts](../src/hooks/queries/useCatalogQueries.test.ts))
      - Installer query hooks tests ([src/hooks/queries/useInstallerQueries.test.ts](../src/hooks/queries/useInstallerQueries.test.ts))
    - **Test Scripts** (package.json):
      - `pnpm test` - Run tests once (CI mode)
      - `pnpm vitest` - Run tests in watch mode
      - `pnpm vitest -- --ui` - Run tests with Vitest UI
      - `pnpm test -- --coverage` - Run with coverage report
    - **Developer Documentation**:
      - Created comprehensive [docs/frontend-api-contracts.md](../docs/frontend-api-contracts.md)
      - Documented all API endpoints with request/response formats
      - Explained query hooks patterns and cache management
      - Covered WebSocket integration and real-time updates
      - Provided testing guide with examples
      - Included references to all backend documentation

### 12. Backend Enhancements for Developer Experience
- **Automatic Extension DEBUG Logging** ✅ (Completed 2025-01-13):
  - **Problem**: Extension developers had to manually add DEBUG logging to see request/response details during development. Only extensions with developer-added logging (like batoto) showed detailed information, while others (like weebcentral) had no visibility.
  - **Solution**: Built automatic DEBUG logging directly into JAMRA's extension runtime ([server/src/modules/extensions/runtime/extension-runtime.ts](server/src/modules/extensions/runtime/extension-runtime.ts))
  - **Implementation Details**:
    - Added `env` parameter to `ExtensionRuntimeOptions` interface to detect development mode
    - Added `isDevMode` flag to `DefaultExtensionRuntime` class constructor
    - Created `shouldLogLifecycleMethod()` helper to determine which lifecycle methods to log (`search`, `getMangaDetails`, `getChapters`, `getPages`)
    - Updated `invokeLifecycle()` to automatically log before/after execution with timing information
    - Passed `env: context.config.env` when creating extension runtime in [extensions.module.ts](server/src/modules/extensions/extensions.module.ts#L34)
  - **Logged Information**:
    - **Before execution**: Method name, extension metadata (id, slug, version), full input payload with all parameters and filters
    - **After execution**: Method name, extension metadata, execution duration in milliseconds, complete result data
  - **Benefits**:
    - Zero developer effort: All extensions automatically get detailed logging without manual instrumentation
    - Consistent logging format: Same structured output for every extension
    - Performance tracking: Automatic duration measurement for each request
    - Dev mode only: Logging only occurs when `NODE_ENV === 'development'` to avoid production overhead
    - Complete visibility: See input parameters, output results, and timing for every extension lifecycle method call
  - **Example Output**:
    ```
    [DEBUG] Extension lifecycle: search - start {
      "extensionId": "batoto",
      "extensionSlug": "batoto",
      "method": "search",
      "payload": {
        "query": "one piece",
        "page": 1,
        "filters": {},
        "normalizedFilters": {...},
        "rawFilters": {...}
      }
    }
    [DEBUG] Extension lifecycle: search - complete {
      "extensionId": "batoto",
      "extensionSlug": "batoto",
      "method": "search",
      "durationMs": 1147,
      "result": {
        "results": [...],
        "hasMore": true,
        "totalResults": 247
      }
    }
    ```

---

## Immediate Next Steps
1. ✅ (Done) Land the shared API/type refactor (Section 1) to unblock all other work.
2. ✅ (Done) Fix routing structure (Section 10) to include all required IDs for backend API calls.
3. ✅ (Done) Implement Library page (Section 4) with filters, stats, and favorite toggles.
4. ✅ (Done) Implement Discover page with extension search and MangaDetailsPage (Section 8).
5. ✅ (Done) Implement Downloads management page (Section 7)
6. ✅ (Done) Implement Continue Reading on HomePage (Section 5)
7. ✅ (Done) Implement WebSocket integration for real-time updates (Section 9)
8. ✅ (Done) Implement Settings & Preferences UI (Section 2)
9. ✅ (Done) Implement Catalog + Extensions + Installer Management (Section 3)
10. ✅ (Done) History Page with dual-view mode (Section 5) - Reading activity timeline + audit log toggle
11. ✅ (Done) Testing & Tooling (Section 11) - MSW mocks, integration tests, developer documentation
12. **Reserved for End**: Full-featured Reader Experience (Section 6) - Requires hands-on instruction
13. Iterate with backend docs when adding new UI flows; keep `docs/frontend-gap-implementation-plan.md` updated as features ship.
14. Plan a final, extensive user/agent collaboration session to address lingering visual/layout inconsistencies and other UX polish items before sign-off.

---

## Implementation Progress

### Completed ✅
- **Section 1**: API Client & Shared Types Foundation (2025-01-13)
  - Enhanced `apiClient` with null/binary handling
  - Backend-aligned shared types
  - Rewritten React Query hooks for library, downloads, and extensions
  - Removed deprecated `useDownloadStore`

- **Section 10**: Navigation & Routing (2025-01-13)
  - Multi-parameter routes (`/manga/:extensionId/:mangaId`, `/reader/:libraryId/chapters/:chapterId`)
  - Updated `buildRoute` helpers
  - Refactored Breadcrumbs component, including reader-specific trails (`Home → <manga-slug> → Chapter N`) so context matches the active experience

- **Section 4**: Library Management (2025-01-13)
  - LibraryPage with filters, stats, and search
  - LibraryCard and LibraryGrid with responsive layouts
  - Favorite toggle integration
  - Status filtering (reading, completed, plan to read, on hold, dropped)
  - Gradient LibraryCard redesign with in-card status/favorite controls and immediate React Query cache refresh
  - Unified the Library grid with the shared `UnifiedMangaCard`, adding header/footer slots so status selectors and favorite toggles remain functional while the visual language stays consistent across pages

- **Section 5**: Continue Reading & History Page (2025-01-14)
  - **Continue Reading (2025-01-13)**:
    - Implemented `useContinueReadingEntries` aggregator hook that fans out to `/api/library` + `/last-read`
    - Wired `HomePage` to real data
    - Upgraded `ContinueReadingCard` with relative timestamps + progress logic
  - **History Page (2025-01-14)**:
    - Created reading activity query hooks (`useReadingActivity`, `useRecentReadingActivity`)
    - Built ReadingActivityView component with card-based timeline, progress indicators, and resume actions
    - Built AuditLogView component with Timeline display, event aggregation from multiple sources
    - Implemented HistoryPage with SegmentedControl toggle between Reading Activity and Audit Log views
    - Comprehensive event tracking (library additions/updates, reading progress, downloads)
    - Visual event indicators with color-coded icons and themed badges

- **Section 7**: Downloads Management (2025-11-12)
  - `DownloadsPage` subscribes to active download IDs via `useDownloadSubscriptions` for live progress, stats cards, and low-latency updates.
  - QueueButton + DownloadPopoverContent read the real queue, auto-subscribe only when open, and expose cancel actions that hit the backend with 204-safe handling.
  - Query hooks (`useDownloadQueue`, `useDownloadStats`, `useDownloadDetails`, `useStartDownload`) align with backend envelopes and invalidate caches through `useWebSocketBridge`.
  - Next up: queue-from-reader multi-select UX and offline reader handoff that swaps to downloaded assets when available.

- **Section 8**: Discover & Manga Details (2025-01-13)
  - **DiscoverPage**: Multi-extension concurrent search, search mode toggle, filters/sorting, popular/trending auto-load
  - **UnifiedMangaCard**: Reusable card component with optional progress section, matching ContinueReadingCard aesthetic
  - **ExtensionSearchResults**: Helper component solving React hooks violation for concurrent searches
  - **MangaDetailsPage**: Full implementation with add to library, chapters display, start reading
  - **Bug fixes**: `useExtensionSearch` enabled condition, card hover effects optimization

- **Section 6**: Reader Prototype (2025-01-14)
  - Added a lightweight ReaderPage that loads chapter metadata and streams every page in a vertical list for quick validation
  - Re-enabled chapter-level "Read" actions on Manga Details so navigation paths exist even before the rich reader ships
  - Added in-view previous/next chapter controls wired to the backend navigation hints so testers can step through chapters during prototyping

- **Section 9**: WebSocket Integration (2025-01-14)
  - **useWebSocketBridge**: Centralized bridge for all WebSocket events with automatic React Query cache updates
  - **useDownloadSubscription/useDownloadSubscriptions**: Hooks for targeted download subscriptions
  - **WebSocketStatus**: Connection status indicator in Header with visual feedback
  - Real-time updates for library and downloads without polling
  - Toast notifications for download events
  - Traffic optimization via targeted subscriptions

- **Section 12**: Backend Enhancements for Developer Experience (2025-01-13)
  - **Automatic Extension DEBUG Logging**: Built-in logging for all extensions in dev mode with timing, payloads, and results

- **Section 2**: Settings & Preferences (2025-01-13)
  - **Settings Query Hooks**: Complete CRUD hooks with cache management (`useSettingsList`, `useSetting`, `useUpdateSetting`, `useDeleteSetting`)
  - **Settings Constants**: Organized setting keys by scope with type-safe options and defaults
  - **Enhanced SettingsPage**: 5 sections (Window Behavior, Appearance, Reader, Downloads, Catalog) with reusable components
  - **Reusable Setting Components**: `SettingSelect`, `SettingSwitch`, `SettingNumber` with optimistic updates and notifications
  - **API Integration**: Tested all endpoints, verified 204 responses, proper scope handling

- **Section 3**: Catalog + Extensions + Installer Management (2025-01-14)
  - **Catalog Query Hooks**: `useCatalogList` and `useCatalogSync` with automatic cache invalidation
  - **Installer Query Hooks**: `useInstallExtension` and `useInstallerJob` with dynamic polling
  - **CatalogSection Component**: Table view with sync controls, install actions, and metadata display
  - **InstalledExtensionsList Component**: Table view of installed extensions with status badges
  - **ExtensionDetailDrawer Component**: Comprehensive extension details with manifest viewer
  - **InstallerForm Component**: Modal form with real-time job progress tracking and automatic polling
  - **ExtensionsPage Integration**: Full-featured extensions management page with all components
  - **Features**: Real-time installation tracking, comprehensive error handling, visual status indicators

- **Section 11**: Testing, Tooling & Observability (2025-01-14)
  - **Testing Infrastructure**: Vitest 4, Testing Library, MSW 2, happy-dom
  - **Test Configuration**: Created vitest.config.ts with coverage setup
  - **Test Utilities**: Custom render with React Query wrapper, test query client
  - **MSW Mock Server**: Complete API mocking infrastructure with handlers for all endpoints
  - **Mock Data**: Comprehensive mock data for settings, extensions, catalog, library, downloads, reader
  - **Integration Tests**:
    - Library query hooks (list, item, stats, mutations)
    - Download query hooks (queue, details, stats, mutations)
    - Extensions query hooks (list, search, manga details, chapters)
    - Catalog query hooks (list, sync)
    - Installer query hooks (install, job polling)
  - **Test Scripts**: `test`, `test:integration`, `test:extensions` (watch/UI via `pnpm vitest` flags)
  - **Developer Documentation**: Comprehensive [docs/frontend-api-contracts.md](../docs/frontend-api-contracts.md) covering all API endpoints, query hooks, WebSocket integration, testing guide, and references

### Next Priority
- **Section 6**: Reader Experience (full-featured replacement component with navigation, fullscreen, page fit modes) - **Reserved for end, requires hands-on instruction**
- Final UX polish session to address visual/layout inconsistencies across all pages
