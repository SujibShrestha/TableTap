import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Table2,
  Users,
  UtensilsCrossed,
  ChefHat,
  ConciergeBell,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  hideForRoles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hideForRoles: ["KITCHEN"] },
  { to: "/users", label: "Staff", icon: Users, adminOnly: true },
  { to: "/tables", label: "Tables", icon: Table2, adminOnly: true },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed, adminOnly: true },
  { to: "/orders", label: "Orders", icon: ShoppingBag, hideForRoles: ["KITCHEN"] },
  { to: "/kitchen", label: "Kitchen", icon: ChefHat, hideForRoles: ["WAITER"] },
  { to: "/waiter", label: "Waiter", icon: ConciergeBell, hideForRoles: ["KITCHEN"] },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hideForRoles: ["KITCHEN"] },
  { to: "/users", label: "Staff", icon: Users, adminOnly: true },
  { to: "/tables", label: "Tables", icon: Table2, adminOnly: true },
  { to: "/orders", label: "Orders", icon: ShoppingBag, hideForRoles: ["KITCHEN"] },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed, adminOnly: true },
  { to: "/kitchen", label: "Kitchen", icon: ChefHat, hideForRoles: ["WAITER"] },
  { to: "/waiter", label: "Waiter", icon: ConciergeBell, hideForRoles: ["KITCHEN"] },
];

function SidebarNav() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || user?.role === "ADMIN") &&
      (!item.hideForRoles?.includes(user?.role ?? ""))
  );

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
              "text-sm font-semibold tracking-[0.05em] text-muted-foreground uppercase",
              "hover:bg-surface-container-high hover:text-foreground",
              isActive && "translate-x-0.5 bg-secondary-container font-bold text-primary"
            )
          }
        >
          <Icon className="size-[18px]" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-surface-container-low px-6 py-6 shadow-card lg:flex">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <img
            src="/logo-sm.png"
            alt="TableTap logo"
            className="size-10 shrink-0 rounded-lg object-cover"
          />
          <div>
            <h1 className="font-semibold text-2xl tracking-tight text-primary">
              TableTap
            </h1>
            <p className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase opacity-80">
              Management Portal
            </p>
          </div>
        </div>
      </div>

      <SidebarNav />

      <div className="mt-auto flex flex-col gap-3 pt-6">
        <div className="flex items-center gap-3 rounded-lg bg-surface-container px-3 py-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground uppercase">
            {user?.name.charAt(0) ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role.toLowerCase()}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => void logout()}
        >
          <LogOut />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface px-6 shadow-card lg:hidden">
      <div className="flex items-center gap-2">
        <img src="/logo-sm.png" alt="TableTap logo" className="size-8 rounded-lg object-cover" />
        <h1 className="text-lg font-semibold text-primary">TableTap</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {user?.role.toLowerCase()}
        </span>
        <Button variant="ghost" size="icon" onClick={() => void logout()}>
          <LogOut />
        </Button>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const { user } = useAuth();
  const items = MOBILE_NAV_ITEMS.filter(
    (item) =>
      (!item.adminOnly || user?.role === "ADMIN") &&
      (!item.hideForRoles?.includes(user?.role ?? ""))
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-outline-variant/60 bg-surface shadow-[0_-5px_20px_rgba(45,36,30,0.05)] lg:hidden">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold tracking-wide uppercase transition-colors",
              isActive
                ? "border-t-2 border-primary text-primary"
                : "border-t-2 border-transparent text-muted-foreground hover:text-foreground"
            )
          }
        >
          <Icon className="size-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileTopBar />
      <MobileBottomNav />
      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 pb-24 lg:ml-64 lg:px-10 lg:py-10 lg:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
