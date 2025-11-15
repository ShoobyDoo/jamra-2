/**
 * WebSocket Status Indicator
 * Shows connection status with color-coded indicator
 */

import React from "react";
import { Group, Indicator, Loader, Text, Tooltip } from "@mantine/core";
import { IconWifi, IconWifiOff } from "@tabler/icons-react";
import { useWebSocketStatus } from "../../hooks/useWebSocket";
import { useServerBootstrap } from "../../hooks/useServerBootstrap";

export const WebSocketStatus: React.FC = () => {
  const isConnected = useWebSocketStatus();
  const { status, attempts, maxAttempts } = useServerBootstrap();
  const isBootstrapping = status === "checking";

  return (
    <Group gap="xs" align="center">
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

      {isBootstrapping && (
        <Tooltip
          label={`Waiting for backend (${attempts}/${maxAttempts})`}
          position="bottom"
        >
          <Group gap={4} align="center">
            <Loader size="xs" color="yellow" />
            <Text size="xs" c="dimmed">
              {attempts}/{maxAttempts}
            </Text>
          </Group>
        </Tooltip>
      )}
    </Group>
  );
};
