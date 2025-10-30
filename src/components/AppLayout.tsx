import React from 'react';
import { AppShell } from "@mantine/core";
import { Outlet } from "react-router";
import { LAYOUT } from "../utils/constants";
import { Header } from "./layout/Header";
import { Navbar } from "./layout/Navbar";

export const AppLayout: React.FC = () => {
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
        {/* header component */}
        <Header />
      </AppShell.Header>
      <AppShell.Navbar className="flex flex-1 items-center p-3">
        <Navbar />
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
