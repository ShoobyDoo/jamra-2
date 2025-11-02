import { Text } from "@mantine/core";
import React from "react";
import { LAYOUT } from "../../constants/ui";

export const Header: React.FC = () => {
  return (
    <div className="flex h-full flex-row">
      {/* Left section - Project icon aligned with navbar width */}
      <div
        className="flex items-center justify-center p-3"
        style={{ width: LAYOUT.NAVBAR_WIDTH }}
      >
        <div>
          <Text fw={700} fz={16} lh={1} className="whitespace-nowrap">
            JAMRA
          </Text>
          <Text size="10px" c="dimmed" lh={0.9} className="leading-tight" p={0}>
            just another manga reader app
          </Text>
        </div>
      </div>

      {/* Right section - Breadcrumbs and Search with space-between */}
      <div className="flex flex-1 items-center justify-between px-3">
        <div>Breadcrumbs</div>
        <div>Search</div>
      </div>
    </div>
  );
};
