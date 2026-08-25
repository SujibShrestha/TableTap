
import { NavLink, useLocation, useParams } from "react-router-dom";
import { Menu, Search, ListOrdered, CreditCard } from "lucide-react";

const navItems = [
  { path: "/t/:tableId", label: "Menu", icon: Menu },
  { path: "/t/:tableId/search", label: "Search", icon: Search },
  { path: "/t/:tableId/orders", label: "Orders", icon: ListOrdered },
  { path: "/t/:tableId/bill", label: "Bill", icon: CreditCard },
] as const;

export function CustomerFooterNav() {
  const location = useLocation();
  const { id: tableId } = useParams<{ id: string }>();

  if (!tableId) return null;

  return (
    <nav className="md:hidden bg-surface-container-low dark:bg-surface-container-highest shadow-[0px_-10px_30px_rgba(45,36,30,0.05)] fixed bottom-0 left-0 w-full z-50 rounded-t-xl flex justify-around items-center px-4 py-3 pb-safe">
      {navItems.map((item) => {
        const href = item.path.replace(":tableId", tableId);
        const isActive = location.pathname === href || (item.path === "/t/:tableId" && location.pathname === `/t/${tableId}`);
        const Icon = item.icon;

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
            <Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
            <span className="font-cta-label text-cta-label italic mt-1">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}