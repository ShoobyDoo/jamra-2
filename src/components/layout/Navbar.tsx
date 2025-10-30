import React from 'react';
import { NavLink } from 'react-router';
import { Stack } from '@mantine/core';
import { IconHome, IconBooks, IconDownload, IconSettings } from '@tabler/icons-react';
import { ROUTES } from '../../routes/routes.config';

/**
 * Navigation bar component with links to main application sections
 */
export const Navbar: React.FC = () => {
  const navLinks = [
    { to: ROUTES.HOME, label: 'Home', icon: IconHome },
    { to: ROUTES.LIBRARY, label: 'Library', icon: IconBooks },
    { to: ROUTES.DOWNLOADS, label: 'Downloads', icon: IconDownload },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: IconSettings },
  ];

  return (
    <nav className="p-4">
      <Stack gap="xs">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </Stack>
    </nav>
  );
};
