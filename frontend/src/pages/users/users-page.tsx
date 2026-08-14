import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil, Plus, UserX } from "lucide-react";

import { getAuth } from "@/lib/auth-store";
import { getErrorMessage, deactivateUser, getUsers, updateUser } from "@/api/api";
import { formatDate } from "@/lib/format";
import type { PaginatedUsers, Role, User } from "@/types";
import { ROLES } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ROLE_BADGE_VARIANTS: Record<Role, "default" | "secondary" | "warning" | "outline"> = {
  ADMIN: "default",
  WAITER: "secondary",
  KITCHEN: "warning",
  CASHIER: "outline",
};

function PageHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create, update and manage staff accounts.
        </p>
      </div>
      <Link to="/users/new" className={buttonVariants({ variant: "container" })}>
        <Plus />
        Add Staff
      </Link>
    </header>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={ROLE_BADGE_VARIANTS[role]}>{role}</Badge>;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "destructive"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function ConfirmDeactivateButton({ user, onDone }: { user: User; onDone: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3500);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deactivateUser(getAuth()?.accessToken ?? "", user.id);
      setConfirming(false);
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <span className="flex items-center gap-2 text-xs text-destructive">
        {error}
        <button className="underline-offset-4 hover:underline" onClick={() => setError(null)}>
          dismiss
        </button>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("text-destructive hover:bg-error-container", confirming && "bg-error-container")}
      disabled={busy}
      onClick={() => void handleClick()}
    >
      <UserX />
      {confirming ? "Confirm" : "Deactivate"}
    </Button>
  );
}

function ReactivateButton({ user, onDone }: { user: User; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await updateUser(getAuth()?.accessToken ?? "", user.id, { isActive: true });
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <span className="flex items-center gap-2 text-xs text-destructive">
        {error}
        <button className="underline-offset-4 hover:underline" onClick={() => setError(null)}>
          dismiss
        </button>
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-primary"
      disabled={busy}
      onClick={() => void handleClick()}
    >
      Reactivate
    </Button>
  );
}

export function UsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | "">("");
  const [isActive, setIsActive] = useState<boolean | "">("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  useEffect(() => {
    let cancelled = false;

    getUsers(getAuth()?.accessToken ?? "", { page, limit, role, isActive })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load staff"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, role, isActive, refreshKey]);

  function beginFetch() {
    setLoading(true);
    setError(null);
  }

  function changeRole(value: Role | "") {
    beginFetch();
    setRole(value);
    setPage(1);
  }

  function changeStatus(value: boolean | "") {
    beginFetch();
    setIsActive(value);
    setPage(1);
  }

  function goToPage(next: number) {
    beginFetch();
    setPage(next);
  }

  const refresh = () => {
    beginFetch();
    setRefreshKey((current) => current + 1);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader />

      <div className="flex flex-wrap items-center gap-4">
        <Select
          className="w-44"
          aria-label="Filter by role"
          value={role}
          onChange={(e) => changeRole(e.target.value as Role | "")}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <Select
          className="w-44"
          aria-label="Filter by status"
          value={String(isActive)}
          onChange={(e) => {
            const value = e.target.value;
            changeStatus(value === "" ? "" : value === "true");
          }}
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="overflow-hidden rounded-xl bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data || data.users.length === 0 ? (
              <TableEmpty colSpan={7}>
                No staff members found. Adjust your filters or add a new member.
              </TableEmpty>
            ) : (
              data.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={user.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        <Pencil />
                        Edit
                      </Link>
                      {user.isActive ? (
                        <ConfirmDeactivateButton user={user} onDone={refresh} />
                      ) : (
                        <ReactivateButton user={user} onDone={refresh} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 ? (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {(data.page - 1) * data.limit + 1}–{Math.min(data.page * data.limit, data.total)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{data.total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={data.page <= 1}
              onClick={() => goToPage(Math.max(1, data.page - 1))}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm font-semibold">
              {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={data.page >= data.totalPages}
              onClick={() => goToPage(data.page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
