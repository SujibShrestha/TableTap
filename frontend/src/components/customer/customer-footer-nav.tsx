
import { NavLink, useLocation } from "react-router-dom";
import {ListOrderedIcon, MenuIcon, SearchIcon} from "lucide-react"

const navItems = [
  { path: "/t/:tableId", label: "Menu", icon: <MenuIcon /> },
  { path: "/t/:tableId/search", label: "Search", icon: <SearchIcon /> },
  { path: "/t/:tableId/orders", label: "Orders", icon: <ListOrderedIcon /> },
] as const;

export function CustomerFooterNav({ tableId }: { tableId: string }) {
  const location = useLocation();

  return (
    <nav className="md:hidden bg-surface-container-low dark:bg-surface-container-highest shadow-[0px_-10px_30px_rgba(45,36,30,0.05)] fixed bottom-0 left-0 w-full z-50 rounded-t-xl flex justify-around items-center px-4 py-3 pb-safe">
      {navItems.map((item) => {
        const href = item.path.replace(":tableId", tableId);
        const isActive = location.pathname === href || (item.path === "/t/:tableId" && location.pathname === `/t/${tableId}`);

        return (
          <NavLink
            key={item.label}
            to={href}
            className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-200 active:scale-95 ${
              isActive
                ? "bg-primary-container text-on-primary-container rounded-full"
                : "text-secondary dark:text-on-secondary-container hover:text-primary"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.icon}
            </span>
            <span className="font-cta-label text-cta-label italic mt-1">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}