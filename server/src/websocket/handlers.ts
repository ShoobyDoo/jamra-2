/**
 * WebSocket Connection Handlers
 * Manages WebSocket connections and event broadcasting
 */

import { WebSocket, WebSocketServer } from 'ws';
import { WS_EVENTS } from './events.js';
import type {
  DownloadStartedPayload,
  DownloadProgressPayload,
  DownloadPageCompletePayload,
  DownloadChapterCompletePayload,
  DownloadFailedPayload,
  DownloadCancelledPayload,
} from './events.js';

// Store active connections
const clients = new Set<WebSocket>();

/**
 * Initialize WebSocket server
 */
export const initializeWebSocketServer = (wss: WebSocketServer): void => {
  wss.on('connection', (ws: WebSocket) => {
    console.log('✅ WebSocket client connected');
    clients.add(ws);

    // Send connection confirmation
    ws.send(
      JSON.stringify({
        event: WS_EVENTS.CONNECT,
        data: { message: 'Connected to manga reader server' },
        timestamp: Date.now(),
      })
    );

    // Handle client messages (future: for client-to-server events)
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message from client:', data);
        // TODO: Handle client-initiated events (e.g., subscribe to specific downloads)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('❌ WebSocket client disconnected');
      clients.delete(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  console.log('🔌 WebSocket server initialized');
};

/**
 * Broadcast event to all connected clients
 */
const broadcast = (event: string, data: unknown): void => {
  const message = JSON.stringify({
    event,
    data,
    timestamp: Date.now(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

/**
 * Download Event Emitters
 * These functions should be called from download service/routes
 */

export const emitDownloadStarted = (payload: DownloadStartedPayload): void => {
  console.log('📡 Emitting download started:', payload.downloadId);
  broadcast(WS_EVENTS.DOWNLOAD_STARTED, payload);
};

export const emitDownloadProgress = (payload: DownloadProgressPayload): void => {
  // Don't log every progress update (too noisy)
  broadcast(WS_EVENTS.DOWNLOAD_PROGRESS, payload);
};

export const emitDownloadPageComplete = (
  payload: DownloadPageCompletePayload
): void => {
  console.log(
    `📡 Emitting page complete: ${payload.chapterId} - page ${payload.pageNumber}`
  );
  broadcast(WS_EVENTS.DOWNLOAD_PAGE_COMPLETE, payload);
};

export const emitDownloadChapterComplete = (
  payload: DownloadChapterCompletePayload
): void => {
  console.log('📡 Emitting chapter complete:', payload.chapterId);
  broadcast(WS_EVENTS.DOWNLOAD_CHAPTER_COMPLETE, payload);
};

export const emitDownloadFailed = (payload: DownloadFailedPayload): void => {
  console.log('📡 Emitting download failed:', payload.downloadId);
  broadcast(WS_EVENTS.DOWNLOAD_FAILED, payload);
};

export const emitDownloadCancelled = (
  payload: DownloadCancelledPayload
): void => {
  console.log('📡 Emitting download cancelled:', payload.downloadId);
  broadcast(WS_EVENTS.DOWNLOAD_CANCELLED, payload);
};

/**
 * Get active connection count
 */
export const getActiveConnections = (): number => {
  return clients.size;
};
