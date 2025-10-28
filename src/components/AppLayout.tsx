import { AppShell } from "@mantine/core";
import { Outlet } from "react-router";
import { LAYOUT } from "../utils/constants";

export const AppLayout = () => {
  return (
    <AppShell
      withBorder={false}
      header={{ height: { base: LAYOUT.HEADER_HEIGHT } }}
      navbar={{
        width: { base: LAYOUT.NAVBAR_WIDTH },
        breakpoint: "sm",
      }}
    >
      <AppShell.Header>
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
      </AppShell.Header>
      <AppShell.Navbar className="flex flex-1 items-center p-3">
        Navbar
      </AppShell.Navbar>
      <AppShell.Main className="flex">
        <div
          className={`flex-1 rounded-tl-lg border-t border-l border-gray-100 ${LAYOUT.MAIN_PADDING}`}
        >
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
  );
};
