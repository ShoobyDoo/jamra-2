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
import { ROUTES } from "../../routes/routes.config";
import { QueueButton } from "../download/QueueButton";
import { NavButton } from "../ui/NavButton";

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
  ];

  return (
    <nav className="flex size-full flex-col justify-between p-2">
      <div className="flex flex-col gap-1">
        {navLinks.map((link) => (
          <NavButton
            key={link.to}
            to={link.to}
            label={link.label}
            icon={link.icon}
          />
        ))}
      </div>

      {/* Bottom anchored section */}
      <div className="flex flex-col gap-1.5">
        <QueueButton />
        <NavButton to={ROUTES.SETTINGS} label="Settings" icon={IconSettings} />
      </div>
    </nav>
  );
};
