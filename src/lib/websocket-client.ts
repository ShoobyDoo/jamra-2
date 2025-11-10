/**
 * WebSocket Client
 * Manages WebSocket connection lifecycle with automatic reconnection
 */

import {
  WS_EVENTS,
  WS_MAX_RECONNECT_ATTEMPTS,
  WS_RECONNECT_BACKOFF_MULTIPLIER,
  WS_RECONNECT_INTERVAL,
  WS_URL,
  type WSEventType,
} from "../constants/websocket";

/**
 * WebSocket Event Data
 */
export interface WSMessage<T = unknown> {
  event: WSEventType;
  data: T;
  timestamp: number;
}

/**
 * Event listener callback
 */
type EventCallback<T = unknown> = (data: T) => void;

/**
 * WebSocket Client Class
 */
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private listeners = new Map<WSEventType, Set<EventCallback>>();
  private isIntentionalClose = false;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    console.log("Connecting to WebSocket server...");
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log("✅ WebSocket connected");
      this.reconnectAttempts = 0;
      this.emit(WS_EVENTS.CONNECT, { connected: true });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.emit(WS_EVENTS.ERROR, { error });
    };

    this.ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      this.emit(WS_EVENTS.DISCONNECT, { connected: false });

      // Auto-reconnect if not intentional close
      if (!this.isIntentionalClose) {
        this.attemptReconnect();
      }
    };
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    console.log("WebSocket disconnected intentionally");
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay =
      WS_RECONNECT_INTERVAL *
      Math.pow(WS_RECONNECT_BACKOFF_MULTIPLIER, this.reconnectAttempts - 1);

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${WS_MAX_RECONNECT_ATTEMPTS})...`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to an event
   */
  on<T = unknown>(event: WSEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   */
  off<T = unknown>(event: WSEventType, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as EventCallback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: WSEventType, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WSMessage): void {
    this.emit(message.event, message.data);
  }

  /**
   * Send message to server (for future client-to-server events)
   */
  send(event: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data, timestamp: Date.now() }));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Singleton WebSocket client instance
 */
export const wsClient = new WebSocketClient();

// Auto-connect on module load
wsClient.connect();
