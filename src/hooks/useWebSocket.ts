/**
 * useWebSocket Hook
 * React hook for subscribing to WebSocket events
 */

import { useEffect, useState } from 'react';
import { wsClient } from '../lib/websocket-client';
import { WS_EVENTS, type WSEventType } from '../constants/websocket';

/**
 * Hook to subscribe to WebSocket events
 *
 * @example
 * ```tsx
 * const downloadProgress = useWebSocket<DownloadProgressPayload>(
 *   WS_EVENTS.DOWNLOAD_PROGRESS
 * );
 *
 * if (downloadProgress) {
 *   console.log(`Progress: ${downloadProgress.percentage}%`);
 * }
 * ```
 */
export const useWebSocket = <T = unknown>(
  event: WSEventType
): T | null => {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const unsubscribe = wsClient.on<T>(event, (eventData) => {
      setData(eventData);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [event]);

  return data;
};

/**
 * Hook to get WebSocket connection status
 *
 * @example
 * ```tsx
 * const isConnected = useWebSocketStatus();
 *
 * return <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>;
 * ```
 */
export const useWebSocketStatus = (): boolean => {
  const [isConnected, setIsConnected] = useState(wsClient.isConnected());

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const unsubscribeConnect = wsClient.on(WS_EVENTS.CONNECT, onConnect);
    const unsubscribeDisconnect = wsClient.on(WS_EVENTS.DISCONNECT, onDisconnect);

    // Check initial connection status
    setIsConnected(wsClient.isConnected());

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, []);

  return isConnected;
};
