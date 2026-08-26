import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/context/auth-context";

/** Landing page per staff role — used after login and for access-bounce redirects. */
export function getHomePath(role?: string | null): string {
  switch (role) {
    case "KITCHEN":
      return "/kitchen";
    case "WAITER":
      return "/waiter";
    default:
      return "/dashboard";
  }
}

export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user } = useAuth();
  const home = getHomePath(user?.role);

  if (user?.role !== "ADMIN") {
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}

/** Redirects "/" to the signed-in user's role home. */
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomePath(user?.role)} replace />;
}

/** Allows only the listed roles; everyone else is bounced to their role home. */
export function RoleRoute({ allowed }: { allowed: string[] }) {
  const { user } = useAuth();

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to={getHomePath(user?.role)} replace />;
  }

  return <Outlet />;
}
