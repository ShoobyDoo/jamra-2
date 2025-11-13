# Frontend API Contracts

This document describes how the JAMRA frontend integrates with the backend API, summarizing endpoint usage, response formats, and best practices for developers.

**Last Updated:** 2025-01-14

---

## Table of Contents

- [Overview](#overview)
- [API Client Configuration](#api-client-configuration)
- [Response Formats](#response-formats)
- [Endpoint Categories](#endpoint-categories)
  - [Settings](#settings)
  - [Catalog](#catalog)
  - [Extensions](#extensions)
  - [Installer](#installer)
  - [Library](#library)
  - [Downloads](#downloads)
  - [Reader](#reader)
- [Query Hooks](#query-hooks)
- [WebSocket Integration](#websocket-integration)
- [Testing](#testing)
- [References](#references)

---

## Overview

The JAMRA frontend is a React application using:

- **TanStack Query v5** for server state management
- **Zustand v5** for UI-only state
- **WebSocket (ws)** for real-time updates
- **Mantine v8** for UI components
- **React Router v7** for navigation

All API communication goes through the centralized `apiClient` ([src/api/client.ts](../src/api/client.ts)) with endpoints defined in `API_PATHS` ([src/constants/api.ts](../src/constants/api.ts)).

---

## API Client Configuration

### Base URL

```typescript
// src/constants/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
```

Override via environment variable: `VITE_API_URL=http://custom-host:port`

### Client Features

The `apiClient` handles:

- **JSON parsing** for standard responses
- **Null responses** for `204 No Content` (mutations like delete)
- **Binary responses** for reader page images
- **Error handling** with typed error envelopes from backend

```typescript
// Usage examples
const data = await apiClient.get<LibraryListResponse>(API_PATHS.library);
const item = await apiClient.post<LibraryItem>(API_PATHS.library, payload);
await apiClient.delete(API_PATHS.libraryItem(id)); // Returns null for 204
```

---

## Response Formats

### Standard Envelopes

Most backend endpoints wrap data in envelope objects:

```typescript
// List endpoints
{
  items: T[],
  total: number
}

// Specific examples
GET /api/library → { items: LibraryItem[], total: number }
GET /api/downloads → { downloads: Download[] }
GET /api/extensions → { extensions: Extension[] }
GET /api/catalog → { catalog: CatalogEntry[] }
```

### Single Resource Responses

Direct object returns (no envelope):

```typescript
GET /api/library/:id → LibraryItem
GET /api/extensions/:id → Extension
GET /api/downloads/:id → Download
GET /api/settings/:key → Setting
```

### Mutation Responses

- **POST/PUT/PATCH:** Return the created/updated resource
- **DELETE:** Return `204 No Content` (parsed as `null` by `apiClient`)

### Error Responses

```typescript
{
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}
```

---

## Endpoint Categories

### Settings

Scoped key-value store for app/reader/downloads/catalog preferences.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/settings` | List all settings (optional `?scope=` filter) | `{ settings: Setting[] }` |
| `GET` | `/api/settings/:key` | Get single setting | `Setting` or `404` |
| `PUT` | `/api/settings/:key` | Upsert setting | `Setting` |
| `DELETE` | `/api/settings/:key` | Delete setting | `204` |

**Frontend Hooks:**
- `useSettingsList(scope?)` - List settings
- `useSetting<T>(key)` - Get single setting with type safety
- `useUpdateSetting()` - Mutation to upsert
- `useDeleteSetting()` - Mutation to delete

**Example:**
```typescript
const { data: pageFit } = useSetting<string>('reader.pageFit');
const updateSetting = useUpdateSetting();
updateSetting.mutate({ key: 'reader.pageFit', value: 'fitWidth' });
```

---

### Catalog

Extension repository catalog management (synced from GitHub/filesystem).

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/catalog` | List catalog entries (optional `?repo=` filter) | `{ catalog: CatalogEntry[] }` |
| `POST` | `/api/catalog/sync` | Sync catalog from repositories | `{ synced: number, catalog: CatalogEntry[] }` |

**Frontend Hooks:**
- `useCatalogList(filters?)` - List catalog
- `useCatalogSync()` - Mutation to sync

---

### Extensions

Installed extension management and execution (search, details, chapters, pages).

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/extensions` | List installed extensions | `{ extensions: Extension[] }` |
| `GET` | `/api/extensions/:id` | Get extension details | `Extension` |
| `GET` | `/api/extensions/:id/search?query=...` | Search manga via extension | `{ results: ExtensionSearchResult[], hasMore: boolean, totalResults: number }` |
| `GET` | `/api/extensions/:id/manga/:mangaId` | Get manga details | `MangaDetails` |
| `GET` | `/api/extensions/:id/manga/:mangaId/chapters` | Get chapters | `{ chapters: ChapterDetails[] }` |
| `GET` | `/api/extensions/:id/manga/:mangaId/chapters/:chapterId/pages` | Get page URLs | `{ pages: string[] }` |

**Frontend Hooks:**
- `useExtensions()` - List installed extensions
- `useExtension(id)` - Get single extension
- `useExtensionSearch(id, filters)` - Search manga
- `useExtensionMangaDetails(extId, mangaId)` - Get manga details
- `useExtensionChapters(extId, mangaId)` - Get chapters

---

### Installer

Extension installation job queue and status tracking.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `POST` | `/api/extensions/install` | Start installation job | `{ jobId: string, status: 'pending', ... }` |
| `GET` | `/api/extensions/install/:jobId` | Poll job status | `InstallerJob` |

**Frontend Hooks:**
- `useInstallExtension()` - Mutation to start job
- `useInstallerJob(jobId)` - Poll job status (automatic refetch interval based on status)

**Job Lifecycle:**
```
pending → downloading → compiling → installing → completed|failed
```

---

### Library

User's personal manga library with reading progress and favorites.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/library` | List library items (filters: `status`, `favorite`, `search`) | `{ items: LibraryItem[], total: number }` |
| `GET` | `/api/library/:id` | Get library item | `LibraryItem` |
| `POST` | `/api/library` | Add to library | `LibraryItem` (201) |
| `PATCH` | `/api/library/:id` | Update status | `LibraryItem` |
| `PATCH` | `/api/library/:id/favorite` | Toggle favorite | `LibraryItem` |
| `DELETE` | `/api/library/:id` | Remove from library | `204` |
| `GET` | `/api/library/stats` | Get library statistics | `LibraryStats` |
| `GET` | `/api/library/:id/progress` | Get reading progress history | `{ progress: ReadingProgress[] }` |
| `GET` | `/api/library/:id/last-read` | Get last read progress | `ReadingProgress \| null` |

**Frontend Hooks:**
- `useLibraryList(filters?)` - List library
- `useLibraryItem(id)` - Get single item
- `useLibraryStats()` - Get statistics
- `useAddToLibrary()` - Mutation to add
- `useUpdateLibraryStatus()` - Mutation to update status
- `useToggleFavorite()` - Mutation to toggle favorite
- `useRemoveFromLibrary()` - Mutation to remove

**Status Values:** `reading`, `completed`, `planToRead`, `onHold`, `dropped`

---

### Downloads

Chapter download queue management with progress tracking.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/downloads` | List downloads (optional `?status=` filter) | `{ downloads: Download[] }` |
| `GET` | `/api/downloads/:id` | Get download details | `Download` |
| `POST` | `/api/downloads` | Queue downloads | `{ queued: number, downloads: Download[] }` (201) |
| `DELETE` | `/api/downloads/:id` | Cancel download | `204` |
| `GET` | `/api/downloads/stats` | Get download statistics | `DownloadStats` |

**Frontend Hooks:**
- `useDownloadQueue(filters?)` - List downloads
- `useDownloadDetails(id)` - Get single download
- `useDownloadStats()` - Get statistics
- `useStartDownload()` - Mutation to queue
- `useCancelDownload()` - Mutation to cancel

**Download Statuses:** `pending`, `downloading`, `completed`, `failed`, `cancelled`

---

### Reader

Chapter reading interface with page streaming and navigation.

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/reader/:libraryId/chapters/:chapterId` | Get chapter data | `ReaderChapterData` |
| `GET` | `/api/reader/:libraryId/chapters/:chapterId/next` | Get next chapter ID | `{ nextChapterId: string \| null }` |
| `GET` | `/api/reader/:libraryId/chapters/:chapterId/previous` | Get previous chapter ID | `{ previousChapterId: string \| null }` |
| `GET` | `/api/reader/:libraryId/chapters/:chapterId/pages/:n` | Get page image (binary) | `image/jpeg` (binary) |

**Frontend Hooks:**
- `useReaderChapter(libraryId, chapterId)` - Get chapter data
- Page images are fetched directly via `apiClient` with binary response handling

**Note:** Reading progress is automatically tracked server-side when pages are requested.

---

## Query Hooks

### Query Key Patterns

Consistent query key factories for cache management:

```typescript
// src/hooks/queries/useLibraryQueries.ts
export const libraryKeys = {
  all: ['library'] as const,
  lists: () => [...libraryKeys.all, 'list'] as const,
  list: (filters: LibraryFilters) => [...libraryKeys.lists(), filters] as const,
  details: () => [...libraryKeys.all, 'detail'] as const,
  detail: (id: string) => [...libraryKeys.details(), id] as const,
  stats: () => [...libraryKeys.all, 'stats'] as const,
};
```

### Cache Invalidation

Mutations automatically invalidate related queries:

```typescript
const addToLibrary = useAddToLibrary();

// Invalidates library list and stats after successful mutation
queryClient.invalidateQueries({ queryKey: libraryKeys.lists() });
queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
```

### Optimistic Updates

Example with favorite toggle:

```typescript
const toggleFavorite = useToggleFavorite();

// Optimistically update UI before server responds
queryClient.setQueryData(
  libraryKeys.detail(libraryId),
  (old) => ({ ...old, favorite: !old.favorite })
);
```

---

## WebSocket Integration

Real-time updates via WebSocket connection at `ws://localhost:3000`.

### Connection Management

```typescript
// src/lib/websocket-client.ts
export const wsClient = new WebSocketClient({
  url: WS_URL,
  reconnectInterval: 1000,
  maxReconnectAttempts: 10,
});
```

### Event Types

```typescript
// Download events
'download:started'
'download:progress'
'download:chapter:complete'
'download:failed'
'download:cancelled'

// Library events
'library:item:added'
'library:item:updated'
'library:item:removed'
```

### Download Subscriptions

Reduce traffic by subscribing only to specific downloads:

```typescript
// Subscribe when viewing download details
wsClient.subscribeToDownload(downloadId);

// Unsubscribe on unmount
wsClient.unsubscribeFromDownload(downloadId);
```

### Centralized Bridge

The `useWebSocketBridge` hook (mounted in [App.tsx](../src/App.tsx)) listens to all events and automatically invalidates React Query caches:

```typescript
// src/hooks/useWebSocketBridge.ts
wsClient.on('download:progress', (payload) => {
  queryClient.invalidateQueries({ queryKey: downloadKeys.detail(payload.downloadId) });
});

wsClient.on('library:item:updated', (payload) => {
  queryClient.invalidateQueries({ queryKey: libraryKeys.detail(payload.libraryId) });
});
```

---

## Testing

### Test Infrastructure

- **Framework:** Vitest 4
- **Testing Library:** React Testing Library 16
- **API Mocking:** MSW (Mock Service Worker) 2
- **Environment:** happy-dom

### Running Tests

```bash
# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run

# Run with coverage
pnpm test:coverage
```

### Test Files Location

```
src/
├── hooks/
│   └── queries/
│       ├── useLibraryQueries.test.ts
│       ├── useDownloadQueries.test.ts
│       ├── useExtensionsQueries.test.ts
│       ├── useCatalogQueries.test.ts
│       └── useInstallerQueries.test.ts
└── test/
    ├── setup.ts              # Global test setup
    ├── utils.tsx             # Test utilities (custom render, etc.)
    └── mocks/
        ├── server.ts         # MSW server setup
        ├── handlers.ts       # API request handlers
        └── data.ts           # Mock data
```

### Writing Tests

Example test for a query hook:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHook } from '../../test/utils';
import { useLibraryList } from './useLibraryQueries';
import { createTestQueryClient } from '../../test/utils';

describe('useLibraryList', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it('fetches library list successfully', async () => {
    const { result } = renderHook(() => useLibraryList(), { queryClient });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(2);
  });
});
```

### MSW Handlers

Mock handlers replicate backend responses in [src/test/mocks/handlers.ts](../src/test/mocks/handlers.ts):

```typescript
import { http, HttpResponse } from 'msw';
import { API_PATHS } from '../../constants/api';

export const handlers = [
  http.get(`${BASE_URL}${API_PATHS.library}`, () => {
    return HttpResponse.json({
      items: mockLibraryItems,
      total: mockLibraryItems.length,
    });
  }),
];
```

---

## References

### Backend Documentation

- [Backend Index](./backend/index.md) - Overview of backend architecture
- [Endpoints](./backend/endpoints.md) - Complete endpoint reference
- [WebSocket](./backend/websocket.md) - WebSocket events and payloads
- [Extensions](./backend/extensions.md) - Extension system details
- [Library](./backend/library.md) - Library management
- [Downloads](./backend/downloads.md) - Download system
- [Reader](./backend/reader.md) - Reader endpoints
- [Settings](./backend/settings.md) - Settings management
- [Catalog](./backend/catalog.md) - Catalog sync system
- [Installer](./backend/installer.md) - Extension installer

### Frontend Implementation Plan

- [Frontend Gap Implementation Plan](./frontend-gap-implementation-plan.md) - Detailed implementation roadmap

### Code Organization

- [src/constants/api.ts](../src/constants/api.ts) - API endpoint constants
- [src/api/client.ts](../src/api/client.ts) - API client implementation
- [src/types/index.ts](../src/types/index.ts) - TypeScript type definitions
- [src/hooks/queries/](../src/hooks/queries/) - React Query hooks
- [src/lib/websocket-client.ts](../src/lib/websocket-client.ts) - WebSocket client

---

**For questions or contributions, refer to the main project README or open an issue on GitHub.**
