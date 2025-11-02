import React from "react";
import { LAYOUT } from "../../constants/ui";

export const Header: React.FC = () => {
  return (
    <div className="flex h-full flex-row">
      {/* Left section - Project icon aligned with navbar width */}
      <div
        className="flex items-center justify-center p-3 font-semibold"
        style={{ width: LAYOUT.NAVBAR_WIDTH }}
      >
        JAMRA
      </div>

      {/* Right section - Breadcrumbs and Search with space-between */}
      <div className="flex flex-1 items-center justify-between px-3">
        <div>Breadcrumbs</div>
        <div>Search</div>
      </div>
    </div>
  );
};
