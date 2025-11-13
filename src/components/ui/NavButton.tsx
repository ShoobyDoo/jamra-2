import type { Icon, IconProps } from "@tabler/icons-react";
import { NavLink } from "react-router";

interface INavLink {
  to: string;
  label: string;
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
}

export const NavButton: React.FC<INavLink> = ({ to, label, icon: NavIcon }) => {
  return (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100"
        }`
      }
      aria-label={label}
    >
      <NavIcon size={24} stroke={1.5} />
      <span className="text-center text-[11px] leading-none font-medium tracking-wide">
        {label}
      </span>
    </NavLink>
  );
};
