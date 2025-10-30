/**
 * ⚠️ EDUCATIONAL EXAMPLE - ANTI-PATTERN - DO NOT USE ⚠️
 *
 * This store demonstrates a COMMON MISTAKE: storing server state in Zustand.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHY THIS IS WRONG
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 1. SERVER STATE vs UI STATE:
 *    - Download queue, progress, status = SERVER STATE (lives on backend)
 *    - Modal open/closed, sidebar collapsed = UI STATE (lives in browser only)
 *    - Zustand should ONLY handle UI state
 *    - TanStack Query should handle ALL server state
 *
 * 2. PROBLEMS WITH THIS APPROACH:
 *    ✗ Manual Cache Invalidation:
 *      - You must manually call updateProgress() when data changes
 *      - Easy to forget, leads to stale data
 *      - TanStack Query automatically invalidates and refetches
 *
 *    ✗ No Automatic Refetching:
 *      - Data can become stale if server changes without you knowing
 *      - TanStack Query refetches on window focus, reconnect, intervals
 *
 *    ✗ Race Conditions:
 *      - Multiple components updating the same download state
 *      - Network requests completing out of order
 *      - TanStack Query handles deduplication and request coordination
 *
 *    ✗ No Error Handling:
 *      - What if the server rejects the download?
 *      - How do you handle network failures?
 *      - TanStack Query provides error states and retry logic
 *
 *    ✗ No Loading States:
 *      - isDownloading is too simplistic
 *      - What about per-download loading states?
 *      - TanStack Query gives you isLoading, isFetching, isPending per query
 *
 *    ✗ Duplicate State:
 *      - Server has the download queue
 *      - You're duplicating it here in Zustand
 *      - Creates sync issues and wasted memory
 *
 * 3. REAL-WORLD SCENARIO WHERE THIS FAILS:
 *
 *    User opens app on Phone → Downloads chapter 1 → Progress: 50%
 *    User opens app on Desktop → useDownloadStore shows: []
 *    ❌ State is out of sync! Desktop doesn't know about phone's download.
 *
 *    With TanStack Query:
 *    User opens app on Desktop → useDownloadQueue() fetches from server
 *    ✅ Desktop automatically sees chapter 1 at 50% progress
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * THE CORRECT APPROACH
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * USE: src/hooks/queries/useDownloadQueries.ts
 *
 * Example Usage:
 * ```tsx
 * import { useDownloadQueue, useStartDownload } from '@/hooks/queries/useDownloadQueries';
 * import { useWebSocket } from '@/hooks/useWebSocket';
 * import { WS_EVENTS } from '@/constants/websocket';
 * import type { DownloadProgressPayload } from '@/types';
 *
 * const DownloadsPage: React.FC = () => {
 *   // Get download queue from server (automatically cached & synchronized)
 *   const { data: queue, isLoading, error } = useDownloadQueue();
 *
 *   // Real-time progress updates via WebSocket
 *   const progressUpdate = useWebSocket<DownloadProgressPayload>(
 *     WS_EVENTS.DOWNLOAD_PROGRESS
 *   );
 *
 *   // Invalidate cache when WebSocket event received
 *   const queryClient = useQueryClient();
 *   useEffect(() => {
 *     if (progressUpdate) {
 *       queryClient.invalidateQueries({ queryKey: downloadKeys.queue });
 *     }
 *   }, [progressUpdate, queryClient]);
 *
 *   // Start a download (automatically updates cache on success)
 *   const startDownload = useStartDownload();
 *
 *   const handleDownload = (mangaId: string, chapterId: string) => {
 *     startDownload.mutate({ mangaId, chapterId });
 *   };
 *
 *   if (isLoading) return <Loader />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       {queue?.map((download) => (
 *         <DownloadItem key={download.id} {...download} />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * Benefits of TanStack Query + WebSocket:
 * ✓ Automatic caching - no manual cache management
 * ✓ Real-time updates via WebSocket events
 * ✓ Automatic refetching on window focus / reconnect
 * ✓ Error handling with retry logic built-in
 * ✓ Loading states per query (isLoading, isFetching, isPending)
 * ✓ Optimistic updates with rollback on failure
 * ✓ Request deduplication (multiple components using same query)
 * ✓ Stale-while-revalidate pattern (show old data while fetching new)
 * ✓ Background refetching without blocking UI
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * WHEN TO USE ZUSTAND
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * USE Zustand for UI-ONLY state:
 * ✓ src/store/useUIStore.ts - Modals, sidebars, tooltips
 * ✓ src/store/useSettingsStore.ts - User preferences (theme, language)
 * ✓ src/store/useReaderStore.ts - Current page, fullscreen mode
 *
 * DO NOT use Zustand for server data:
 * ✗ Downloads, manga lists, chapters, library items
 * ✗ Anything that comes from an API endpoint
 * ✗ Anything that should sync across devices/tabs
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KEY LEARNING: STATE OWNERSHIP
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ask yourself: "Where does this data TRULY live?"
 *
 * If the answer is "the server/database":
 *   → Use TanStack Query
 *
 * If the answer is "only in the browser for this session":
 *   → Use Zustand (or useState/useReducer for local state)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * @deprecated DO NOT USE THIS STORE IN PRODUCTION CODE
 * This file exists ONLY for educational purposes.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand';

// ❌ WRONG: This is server state, should be in TanStack Query
interface DownloadItem {
  id: string;
  mangaTitle: string;
  chapterTitle: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

// ❌ WRONG: Managing server data in Zustand
interface DownloadStore {
  queue: DownloadItem[]; // ❌ Server state
  isDownloading: boolean; // ❌ Derived from server state

  addToQueue: (item: Omit<DownloadItem, 'progress' | 'status'>) => void;
  removeFromQueue: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setStatus: (id: string, status: DownloadItem['status']) => void;
  setIsDownloading: (isDownloading: boolean) => void;
}

/**
 * @deprecated DO NOT USE - This is an anti-pattern example
 * Use src/hooks/queries/useDownloadQueries.ts instead
 */
export const useDownloadStore = create<DownloadStore>((set) => ({
  queue: [],
  isDownloading: false,

  // ❌ PROBLEM: Manually adding to queue - what if server rejects it?
  addToQueue: (item) =>
    set((state) => ({
      queue: [...state.queue, { ...item, progress: 0, status: 'pending' }],
    })),

  // ❌ PROBLEM: Removing from local state doesn't update server
  removeFromQueue: (id) =>
    set((state) => ({
      queue: state.queue.filter((item) => item.id !== id),
    })),

  // ❌ PROBLEM: Manually updating progress - what if network lags?
  updateProgress: (id, progress) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, progress } : item
      ),
    })),

  // ❌ PROBLEM: Local status update can desync from server
  setStatus: (id, status) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),

  // ❌ PROBLEM: Derived state should be computed, not stored
  setIsDownloading: (isDownloading) => set({ isDownloading }),
}));
