/**
 * WebSocket Connection Handlers
 * Manages WebSocket connections and event broadcasting
 */

import { WebSocket, WebSocketServer, type RawData } from "ws";
import type {
  DownloadCancelledPayload,
  DownloadChapterCompletePayload,
  DownloadFailedPayload,
  DownloadPageCompletePayload,
  DownloadProgressPayload,
  DownloadStartedPayload,
  LibraryItemRemovedPayload,
  LibraryItemSnapshotPayload,
  LibraryItemUpdatedPayload,
} from "./events.js";
import { WS_EVENTS } from "./events.js";

// Store active connections + subscription metadata
type ClientSubscriptions = Set<string>;
const clients = new Map<WebSocket, ClientSubscriptions>();

const DOWNLOAD_SUBSCRIPTION_PREFIX = "download:";

interface BroadcastScope {
  downloadId?: string;
}

interface ClientMessage {
  event?: string;
  data?: unknown;
}

const getClientSubscriptions = (ws: WebSocket): ClientSubscriptions => {
  let subscriptions = clients.get(ws);
  if (!subscriptions) {
    subscriptions = new Set<string>();
    clients.set(ws, subscriptions);
  }
  return subscriptions;
};

const buildDownloadSubscriptionKey = (downloadId: string): string => {
  return `${DOWNLOAD_SUBSCRIPTION_PREFIX}${downloadId}`;
};

const sendEvent = (ws: WebSocket, event: string, data: unknown): void => {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(
    JSON.stringify({
      event,
      data,
      timestamp: Date.now(),
    }),
  );
};

const shouldReceiveBroadcast = (
  subscriptions: ClientSubscriptions | undefined,
  scope?: BroadcastScope,
): boolean => {
  if (!scope?.downloadId) {
    return true;
  }

  if (!subscriptions || subscriptions.size === 0) {
    // Backwards compatibility: clients that haven't subscribed explicitly
    // still receive all broadcast events.
    return true;
  }

  return subscriptions.has(buildDownloadSubscriptionKey(scope.downloadId));
};

const extractDownloadId = (data: unknown): string => {
  if (typeof data !== "object" || data === null) {
    throw new Error("Message payload must be an object");
  }

  const candidate =
    (data as { downloadId?: unknown }).downloadId ??
    (data as { payload?: { downloadId?: unknown } }).payload?.downloadId;

  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new Error("downloadId is required for this action");
  }

  return candidate;
};

const handleClientMessage = (ws: WebSocket, rawMessage: RawData): void => {
  try {
    const parsed = JSON.parse(rawMessage.toString()) as ClientMessage;
    if (!parsed?.event) {
      throw new Error("Client message missing event field");
    }

    switch (parsed.event) {
      case "subscribe:download": {
        const downloadId = extractDownloadId(parsed.data);
        const subscriptions = getClientSubscriptions(ws);
        subscriptions.add(buildDownloadSubscriptionKey(downloadId));
        sendEvent(ws, WS_EVENTS.SUBSCRIPTION_ACK, {
          action: "subscribed",
          type: "download",
          downloadId,
        });
        break;
      }

      case "unsubscribe:download": {
        const downloadId = extractDownloadId(parsed.data);
        const subscriptions = getClientSubscriptions(ws);
        subscriptions.delete(buildDownloadSubscriptionKey(downloadId));
        sendEvent(ws, WS_EVENTS.SUBSCRIPTION_ACK, {
          action: "unsubscribed",
          type: "download",
          downloadId,
        });
        break;
      }

      default: {
        console.warn("Unknown WebSocket client event:", parsed.event);
        sendEvent(ws, WS_EVENTS.ERROR, {
          message: `Unknown client event: ${parsed.event}`,
        });
      }
    }
  } catch (error) {
    console.error("Failed to process WebSocket message:", error);
    sendEvent(ws, WS_EVENTS.ERROR, {
      message:
        error instanceof Error ? error.message : "Failed to process message",
    });
  }
};

/**
 * Initialize WebSocket server
 */
export const initializeWebSocketServer = (wss: WebSocketServer): void => {
  wss.on("connection", (ws: WebSocket) => {
    console.log("✅ WebSocket client connected");
    clients.set(ws, new Set());

    // Send connection confirmation
    sendEvent(ws, WS_EVENTS.CONNECT, {
      message: "Connected to manga reader server",
    });

    // Handle client messages (future: for client-to-server events)
    ws.on("message", (message) => {
      handleClientMessage(ws, message);
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log("❌ WebSocket client disconnected");
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  console.log("🔌 WebSocket server initialized");
};

/**
 * Broadcast event to all connected clients
 */
const broadcast = (
  event: string,
  data: unknown,
  scope?: BroadcastScope,
): void => {
  clients.forEach((subscriptions, client) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!shouldReceiveBroadcast(subscriptions, scope)) {
      return;
    }

    sendEvent(client, event, data);
  });
};

/**
 * Download Event Emitters
 * These functions should be called from download service/routes
 */

export const emitDownloadStarted = (payload: DownloadStartedPayload): void => {
  console.log("📡 Emitting download started:", payload.downloadId);
  broadcast(WS_EVENTS.DOWNLOAD_STARTED, payload, {
    downloadId: payload.downloadId,
  });
};

export const emitDownloadProgress = (
  payload: DownloadProgressPayload,
): void => {
  // Don't log every progress update (too noisy)
  broadcast(WS_EVENTS.DOWNLOAD_PROGRESS, payload, {
    downloadId: payload.downloadId,
  });
};

export const emitDownloadPageComplete = (
  payload: DownloadPageCompletePayload,
): void => {
  console.log(
    `📡 Emitting page complete: ${payload.chapterId} - page ${payload.pageNumber}`,
  );
  broadcast(WS_EVENTS.DOWNLOAD_PAGE_COMPLETE, payload, {
    downloadId: payload.downloadId,
  });
};

export const emitDownloadChapterComplete = (
  payload: DownloadChapterCompletePayload,
): void => {
  console.log("📡 Emitting chapter complete:", payload.chapterId);
  broadcast(WS_EVENTS.DOWNLOAD_CHAPTER_COMPLETE, payload, {
    downloadId: payload.downloadId,
  });
};

export const emitDownloadFailed = (payload: DownloadFailedPayload): void => {
  console.log("📡 Emitting download failed:", payload.downloadId);
  broadcast(WS_EVENTS.DOWNLOAD_FAILED, payload, {
    downloadId: payload.downloadId,
  });
};

export const emitDownloadCancelled = (
  payload: DownloadCancelledPayload,
): void => {
  console.log("📡 Emitting download cancelled:", payload.downloadId);
  broadcast(WS_EVENTS.DOWNLOAD_CANCELLED, payload, {
    downloadId: payload.downloadId,
  });
};

/**
 * Library Event Emitters
 */
export const emitLibraryItemAdded = (
  payload: LibraryItemSnapshotPayload,
): void => {
  broadcast(WS_EVENTS.LIBRARY_ITEM_ADDED, payload);
};

export const emitLibraryItemUpdated = (
  payload: LibraryItemUpdatedPayload,
): void => {
  broadcast(WS_EVENTS.LIBRARY_ITEM_UPDATED, payload);
};

export const emitLibraryItemRemoved = (
  payload: LibraryItemRemovedPayload,
): void => {
  broadcast(WS_EVENTS.LIBRARY_ITEM_REMOVED, payload);
};

/**
 * Get active connection count
 */
export const getActiveConnections = (): number => {
  return clients.size;
};
