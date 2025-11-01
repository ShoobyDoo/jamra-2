import {
  IconBooks,
  IconCompass,
  IconDownload,
  IconHistory,
  IconHome,
  IconPuzzle,
  IconSettings,
} from "@tabler/icons-react";
import React from "react";
import { NavLink } from "react-router";
import { ROUTES } from "../../routes/routes.config";

/**
 * Navigation bar component with links to main application sections
 */
export const Navbar: React.FC = () => {
  const navLinks = [
    { to: ROUTES.HOME, label: "Home", icon: IconHome },
    { to: ROUTES.DISCOVER, label: "Discover", icon: IconCompass },
    { to: ROUTES.LIBRARY, label: "Library", icon: IconBooks },
    { to: ROUTES.DOWNLOADS, label: "Downloads", icon: IconDownload },
    { to: ROUTES.HISTORY, label: "History", icon: IconHistory },
    { to: ROUTES.EXTENSIONS, label: "Extensions", icon: IconPuzzle },

    { to: ROUTES.SETTINGS, label: "Settings", icon: IconSettings },
  ];

  return (
    <nav className="flex w-full flex-col gap-1">
      <div></div>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
            aria-label={link.label}
          >
            <Icon size={24} stroke={1.5} />
            <span className="text-center text-[10.5px] leading-none font-medium tracking-wide">
              {link.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};
