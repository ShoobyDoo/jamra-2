/**
 * WebSocket Status Indicator
 * Shows connection status with color-coded indicator
 */

import React from "react";
import { Indicator, Tooltip } from "@mantine/core";
import { IconWifi, IconWifiOff } from "@tabler/icons-react";
import { useWebSocketStatus } from "../../hooks/useWebSocket";

export const WebSocketStatus: React.FC = () => {
  const isConnected = useWebSocketStatus();

  return (
    <Tooltip
      label={isConnected ? "Connected to server" : "Disconnected from server"}
      position="bottom"
    >
      <Indicator
        color={isConnected ? "green" : "red"}
        processing={!isConnected}
        size={8}
      >
        {isConnected ? (
          <IconWifi size={20} className="text-gray-400" />
        ) : (
          <IconWifiOff size={20} className="text-gray-400" />
        )}
      </Indicator>
    </Tooltip>
  );
};
