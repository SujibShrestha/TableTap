import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getAllOrders, updateOrderStatus } from "@/api/api";
import { useWaiterSocket } from "@/hooks/useWaiterSocket";
import { Loader2, AlertTriangle, ReceiptText, ChevronLeft, ChevronRight, Check } from "lucide-react";
import type { Order } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "READY", label: "Ready" },
  { value: "SERVED", label: "Served" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

const PAGE_SIZE = 10;

/** Transitions the current user may perform, by role. */
function allowedTransitions(role: string | undefined): Record<string, string[]> {
  if (role === "ADMIN") {
    return {
      PENDING: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["SERVED"],
    };
  }
  // WAITER (and other staff) can only serve
  return { READY: ["SERVED"] };
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  PENDING: "bg-error/10 text-error",
  CONFIRMED: "bg-primary-fixed/30 text-on-surface",
  PREPARING: "bg-tertiary-fixed-dim/40 text-on-surface",
  READY: "bg-primary-container text-on-primary-container",
  SERVED: "bg-surface-container-high text-on-surface-variant",
  CANCELLED: "bg-surface-container-high text-on-surface-variant line-through",
};

function getTableNumber(order: Order): string {
  return order.session?.table?.tableNumber ?? order.sessionId.slice(0, 8);
}

function summarizeItems(order: Order): string {
  if (!order.items?.length) return "—";
  const summary = order.items.map((i) => `${i.quantity}x ${i.menuItem?.name ?? "Item"}`).join(", ");
  return summary.length > 60 ? `${summary.slice(0, 57)}…` : summary;
}

export function StaffOrdersPage() {
  const { accessToken, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get("status") ?? "";
  const fromFilter = searchParams.get("from") ?? ""; // YYYY-MM-DD
  const toFilter = searchParams.get("to") ?? ""; // YYYY-MM-DD
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);

  /** Converts a YYYY-MM-DD date input value to an ISO timestamp at local day start/end. */
  const dayToIso = (day: string, endOfDay: boolean): string | undefined => {
    if (!day) return undefined;
    const date = new Date(`${day}T00:00:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date.toISOString();
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getAllOrders(accessToken, {
        page,
        limit: PAGE_SIZE,
        ...(statusFilter && { status: statusFilter }),
        ...(dayToIso(fromFilter, false) && { from: dayToIso(fromFilter, false) }),
        ...(dayToIso(toFilter, true) && { to: dayToIso(toFilter, true) }),
      });
      setOrders(data.orders);
      setTotalPages(Math.max(data.totalPages, 1));
      setTotal(data.total);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, statusFilter, fromFilter, toFilter]);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  useWaiterSocket({
    accessToken: accessToken ?? "",
    onNewOrder: () => {
      // New orders affect page 1 / "All" or "PENDING" views — refetch to stay accurate
      if (page === 1 && (!statusFilter || statusFilter === "PENDING")) void fetchOrders();
    },
    onOrderStatusUpdate: (updated: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
    },
  });

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          if (key !== "page") next.delete("page"); // any filter change resets pagination
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const hasDateFilter = Boolean(fromFilter || toFilter);

  const handleAction = useCallback(
    async (orderId: string, newStatus: string) => {
      if (!accessToken) return;
      setActingId(orderId);
      try {
        await updateOrderStatus(accessToken, orderId, newStatus);
        toast.success(`Order marked as ${newStatus.toLowerCase()}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to update status");
      } finally {
        setActingId(null);
      }
    },
    [accessToken]
  );

  const transitions = allowedTransitions(user?.role);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="size-12 text-destructive mb-4" strokeWidth={2} aria-hidden="true" />
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Failed to load orders</h2>
        <p className="font-body-main text-body-main text-on-surface-variant mb-6">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-primary text-white font-cta-label text-cta-label py-3 px-6 rounded-full hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="font-headline-lg text-headline-lg text-primary italic font-extrabold text-3xl mb-1">
          Orders
        </h1>
        <p className="font-body-main text-body-main text-on-surface-variant">
          {total} order{total !== 1 ? "s" : ""}
          {statusFilter ? ` · ${statusFilter.toLowerCase()}` : ""}
          {fromFilter || toFilter ? " · in selected range" : ""}
        </p>
      </header>

      {/* Date range filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="orders-from" className="font-caption-bold text-caption-bold text-on-surface-variant uppercase tracking-wide">
            From
          </label>
          <input
            id="orders-from"
            type="date"
            value={fromFilter}
            max={toFilter || undefined}
            onChange={(e) => setParam("from", e.target.value)}
            className="h-11 rounded-lg border border-outline-variant bg-surface-container-low px-3 font-body-secondary text-body-secondary text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all [color-scheme:light]"
          />
        </div>
        <span className="pb-3 font-body-secondary text-body-secondary text-on-surface-variant" aria-hidden="true">
          →
        </span>
        <div className="flex flex-col gap-1">
          <label htmlFor="orders-to" className="font-caption-bold text-caption-bold text-on-surface-variant uppercase tracking-wide">
            To
          </label>
          <input
            id="orders-to"
            type="date"
            value={toFilter}
            min={fromFilter || undefined}
            onChange={(e) => setParam("to", e.target.value)}
            className="h-11 rounded-lg border border-outline-variant bg-surface-container-low px-3 font-body-secondary text-body-secondary text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all [color-scheme:light]"
          />
        </div>
        {hasDateFilter && (
          <button
            onClick={() => {
              setSearchParams(
                (prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("from");
                  next.delete("to");
                  next.delete("page");
                  return next;
                },
                { replace: true }
              );
            }}
            className="pb-1 font-caption-bold text-caption-bold text-primary underline-offset-4 hover:underline min-h-[44px]"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <nav aria-label="Filter orders by status" className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setParam("status", tab.value)}
            aria-pressed={statusFilter === tab.value}
            className={cn(
              "font-caption-bold text-caption-bold px-4 py-2 rounded-full transition-colors min-h-[44px]",
              statusFilter === tab.value
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-10 animate-spin text-primary" strokeWidth={2} aria-hidden="true" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/50">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
            <ReceiptText className="size-8" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="font-body-secondary text-body-secondary">No orders match this filter</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant/20 bg-surface-container-lowest rounded-2xl shadow-soft overflow-hidden">
          {orders.map((order) => (
            <li key={order.id} className="p-4 sm:p-5 hover:bg-surface-container-low/50 transition-colors">
              {/* Mobile layout */}
              <div className="sm:hidden flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-menu-item-title text-menu-item-title text-on-surface italic">
                    Table {getTableNumber(order)}
                  </span>
                  <span
                    className={cn(
                      "font-caption-bold text-caption-bold px-3 py-1 rounded-full",
                      STATUS_BADGE_CLASSES[order.status]
                    )}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="font-body-secondary text-body-secondary text-on-surface-variant">
                  {summarizeItems(order)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-price-label text-price-label text-on-surface">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                  <span className="font-caption-bold text-caption-bold text-on-surface-variant/70">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {(transitions[order.status] ?? []).length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {(transitions[order.status] ?? []).map((next) => (
                      <button
                        key={next}
                        onClick={() => handleAction(order.id, next)}
                        disabled={actingId === order.id || next !== "SERVED"}
                        className={cn(
                          "flex-1 font-cta-label text-cta-label py-2.5 px-4 rounded-full transition-all duration-200 disabled:opacity-50",
                          next === "SERVED"
                            ? "bg-primary-container text-on-primary hover:bg-primary"
                            : "bg-surface-container-low border border-outline-variant text-on-surface"
                        )}
                      >
                        {actingId === order.id ? (
                          <Loader2 className="size-4 mx-auto animate-spin" aria-hidden="true" />
                        ) : next === "SERVED" ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Check className="size-4" aria-hidden="true" /> Mark Served
                          </span>
                        ) : (
                          next.charAt(0) + next.slice(1).toLowerCase()
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:flex items-center gap-6">
                <div className="w-24 shrink-0">
                  <p className="font-menu-item-title text-menu-item-title text-on-surface italic">
                    Table {getTableNumber(order)}
                  </p>
                  <p className="font-caption-bold text-caption-bold text-on-surface-variant/70 mt-0.5">
                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <p className="flex-1 min-w-0 truncate font-body-main text-body-main text-on-surface-variant">
                  {summarizeItems(order)}
                </p>
                <span className="font-price-label text-price-label text-on-surface shrink-0">
                  ${Number(order.totalAmount).toFixed(2)}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-caption-bold text-caption-bold px-3 py-1 rounded-full w-28 text-center",
                    STATUS_BADGE_CLASSES[order.status]
                  )}
                >
                  {order.status}
                </span>
                <div className="w-32 shrink-0 flex justify-end">
                  {(transitions[order.status] ?? []).includes("SERVED") && (
                    <button
                      onClick={() => handleAction(order.id, "SERVED")}
                      disabled={actingId === order.id}
                      className="font-cta-label text-cta-label py-2.5 px-4 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-all duration-200 disabled:opacity-50"
                    >
                      {actingId === order.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Check className="size-4" aria-hidden="true" /> Served
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
          <button
            onClick={() => setParam("page", String(page - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 font-cta-label text-cta-label px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:pointer-events-none min-h-[44px] transition-colors"
          >
            <ChevronLeft className="size-4" aria-hidden="true" /> Prev
          </button>
          <span className="font-body-secondary text-body-secondary text-on-surface-variant" aria-live="polite">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setParam("page", String(page + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 font-cta-label text-cta-label px-4 py-2.5 rounded-full bg-surface-container-low text-on-surface hover:bg-surface-container-high disabled:opacity-40 disabled:pointer-events-none min-h-[44px] transition-colors"
          >
            Next <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
