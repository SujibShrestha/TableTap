import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/context/auth-context";
import {
  getActiveSessions,
  getAwaitingPaymentOrders,
  getTodayPayments,
  getTables,
  markStaffPayment,
  verifyPayment,
  closeTableSession,
  getOrdersBySession,
  getErrorMessage,
  type ActiveSession,
  type TodayPayment,
  type TodayPaymentsSummary,
} from "@/api/api";
import { useWaiterSocket } from "@/hooks/useWaiterSocket";
import type { Order } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Banknote,
  CreditCard,
  Globe,
  ShieldCheck,
  Clock,
  Receipt,
  XCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PayMethod = "CASH" | "CARD";

// ── Types ───────────────────────────────────────────────────────────

interface AwaitingPaymentOrder {
  sessionId: string;
  tableNumber: string;
  startedAt: string;
  orderCount: number;
  itemCount: number;
  totalDue: number;
  orderIds: string[];
  allAwaiting: boolean;
  firstPaymentId: string | null;
}

interface SessionBillDetail {
  sessionId: string;
  orders: Order[];
}

// ── Metric Card (matches admin dashboard) ───────────────────────────

function MetricCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-card p-6 border border-border/40 shadow-card">
      <Skeleton className="h-3 w-24 mb-4" />
      <Skeleton className="h-9 w-32 mb-4" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  trendUp,
  loading,
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  loading: boolean;
}) {
  if (loading) return <MetricCardSkeleton />;

  return (
    <div className="flex flex-col rounded-xl bg-card p-6 border border-border/40 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
        {label}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold italic text-primary leading-tight sm:text-[2.5rem]">
          {value}
        </span>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm text-secondary">
          {trendUp !== false ? (
            <TrendingUp className="size-4 text-primary" />
          ) : (
            <ArrowRight className="size-4 text-secondary" />
          )}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ── Bill Detail Expandable ──────────────────────────────────────────

function BillDetailPanel({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<SessionBillDetail | null>(null);

  const toggle = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (detail) return;
    setLoading(true);
    try {
      const orders = await getOrdersBySession(sessionId);
      setDetail({ sessionId, orders });
    } catch {
      toast.error("Failed to load bill details");
    } finally {
      setLoading(false);
    }
  }, [open, detail, sessionId]);

  return (
    <div className="border-t border-border/30 pt-3 mt-1">
      <button
        type="button"
        onClick={() => void toggle()}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors"
      >
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        {open ? "Hide" : "View"} Bill
      </button>

      {open && (
        <div className="mt-3 rounded-lg bg-surface-container-low p-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : detail ? (
            <div className="space-y-2">
              {detail.orders.map((order) => (
                <div key={order.id}>
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="text-foreground truncate mr-2">
                        {item.quantity}x {item.menuItem?.name ?? "Item"}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        Rs {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="border-t border-border/30 pt-2 flex justify-between text-xs font-bold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">
                  Rs {detail.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Cashier Board ───────────────────────────────────────────────────

export function CashierBoard() {
  const { accessToken } = useAuth();

  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [awaitingOrders, setAwaitingOrders] = useState<AwaitingPaymentOrder[]>([]);
  const [todayPayments, setTodayPayments] = useState<TodayPayment[]>([]);
  const [todaySummary, setTodaySummary] = useState<TodayPaymentsSummary | null>(null);
  const [totalTables, setTotalTables] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payingId, setPayingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [sessionsData, awaitingData, todayData, tablesData] = await Promise.allSettled([
        getActiveSessions(accessToken),
        getAwaitingPaymentOrders(accessToken),
        getTodayPayments(accessToken),
        getTables(accessToken),
      ]);

      if (sessionsData.status === "fulfilled") setSessions(sessionsData.value);
      if (awaitingData.status === "fulfilled") {
        const grouped = awaitingData.value.reduce((acc, order) => {
          const existing = acc.find((a) => a.sessionId === order.sessionId);
          const isVerified =
            order.paymentStatus === "PENDING_VERIFICATION" ||
            order.paymentStatus === "PAID" ||
            order.payment?.status === "PENDING_VERIFICATION";

          if (existing) {
            existing.orderCount += 1;
            existing.itemCount += order.items?.length ?? 0;
            existing.totalDue += Number(order.totalAmount);
            existing.orderIds.push(order.id);
            if (isVerified) {
              existing.allAwaiting = false;
              if (!existing.firstPaymentId && order.payment?.id) {
                existing.firstPaymentId = order.payment.id;
              }
            }
          } else {
            acc.push({
              sessionId: order.sessionId,
              tableNumber: order.session?.table?.tableNumber ?? "?",
              startedAt: order.session?.createdAt ?? order.createdAt,
              orderCount: 1,
              itemCount: order.items?.length ?? 0,
              totalDue: Number(order.totalAmount),
              orderIds: [order.id],
              allAwaiting: !isVerified,
              firstPaymentId: isVerified && order.payment?.id ? order.payment.id : null,
            });
          }
          return acc;
        }, [] as AwaitingPaymentOrder[]);
        setAwaitingOrders(grouped);
      }
      if (todayData.status === "fulfilled") {
        setTodayPayments(todayData.value.payments);
        setTodaySummary(todayData.value.summary);
      }
      if (tablesData.status === "fulfilled") {
        setTotalTables(tablesData.value.length);
      }

      setError(null);
    } catch (err) {
      if (!error) setError(getErrorMessage(err, "Failed to load cashier data"));
    } finally {
      setLoading(false);
    }
  }, [accessToken, error]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accessToken) return;
      try {
        const [sessionsData, awaitingData, todayData, tablesData] = await Promise.allSettled([
          getActiveSessions(accessToken),
          getAwaitingPaymentOrders(accessToken),
          getTodayPayments(accessToken),
          getTables(accessToken),
        ]);

        if (cancelled) return;

        if (sessionsData.status === "fulfilled") setSessions(sessionsData.value);
        if (awaitingData.status === "fulfilled") {
          const grouped = awaitingData.value.reduce((acc, order) => {
            const existing = acc.find((a) => a.sessionId === order.sessionId);
            const isVerified =
              order.paymentStatus === "PENDING_VERIFICATION" ||
              order.paymentStatus === "PAID" ||
              order.payment?.status === "PENDING_VERIFICATION";

            if (existing) {
              existing.orderCount += 1;
              existing.itemCount += order.items?.length ?? 0;
              existing.totalDue += Number(order.totalAmount);
              existing.orderIds.push(order.id);
              if (isVerified) {
                existing.allAwaiting = false;
                if (!existing.firstPaymentId && order.payment?.id) {
                  existing.firstPaymentId = order.payment.id;
                }
              }
            } else {
              acc.push({
                sessionId: order.sessionId,
                tableNumber: order.session?.table?.tableNumber ?? "?",
                startedAt: order.session?.createdAt ?? order.createdAt,
                orderCount: 1,
                itemCount: order.items?.length ?? 0,
                totalDue: Number(order.totalAmount),
                orderIds: [order.id],
                allAwaiting: !isVerified,
                firstPaymentId: isVerified && order.payment?.id ? order.payment.id : null,
              });
            }
            return acc;
          }, [] as AwaitingPaymentOrder[]);
          setAwaitingOrders(grouped);
        }
        if (todayData.status === "fulfilled") {
          setTodayPayments(todayData.value.payments);
          setTodaySummary(todayData.value.summary);
        }
        if (tablesData.status === "fulfilled") {
          setTotalTables(tablesData.value.length);
        }

        setError(null);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, "Failed to load cashier data"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [accessToken]);

  useWaiterSocket({
    accessToken: accessToken ?? "",
    onNewOrder: () => void fetchData(),
    onOrderStatusUpdate: () => {},
    onSessionClosed: (payload) => {
      setSessions((prev) => prev.filter((s) => s.sessionId !== payload.sessionId));
      setAwaitingOrders((prev) => prev.filter((a) => a.sessionId !== payload.sessionId));
    },
  });

  const handlePay = useCallback(
    async (sessionId: string, method: PayMethod) => {
      if (!accessToken) return;
      setPayingId(sessionId);
      try {
        await markStaffPayment(accessToken, sessionId, method);
        toast.success("Payment recorded — pending verification");
        await fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to record payment");
      } finally {
        setPayingId(null);
      }
    },
    [accessToken, fetchData]
  );

  const handleVerify = useCallback(
    async (paymentId: string) => {
      if (!accessToken) return;
      setVerifyingId(paymentId);
      try {
        await verifyPayment(accessToken, paymentId);
        toast.success("Payment verified — sent to kitchen");
        await fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to verify payment");
      } finally {
        setVerifyingId(null);
      }
    },
    [accessToken, fetchData]
  );

  const handleClose = useCallback(
    async (tableId: string) => {
      if (!accessToken) return;
      setClosingId(tableId);
      try {
        await closeTableSession(accessToken, tableId);
        toast.success("Session closed");
        await fetchData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to close session");
      } finally {
        setClosingId(null);
      }
    },
    [accessToken, fetchData]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" strokeWidth={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Failed to load</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); fetchData(); }}
          className="bg-primary text-primary-foreground font-bold text-sm py-3 px-6 rounded-full hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    );
  }

  const occupiedCount = sessions.length;
  const occupancyPct = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0;
  const pendingCount = awaitingOrders.length;
  const totalPendingDue = awaitingOrders.reduce((sum, a) => sum + a.totalDue, 0);

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <header>
        <h1 className="text-[2rem] font-bold text-foreground leading-tight sm:text-5xl">
          Cashier Dashboard
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {pendingCount === 0
            ? "No pending payments — all settled."
            : `${pendingCount} table${pendingCount !== 1 ? "s" : ""} awaiting payment`}
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Collected Today"
          value={`Rs ${(todaySummary?.totalCollected ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend="today's shift"
          loading={loading}
        />
        <MetricCard
          label="Cash"
          value={`Rs ${(todaySummary?.totalCash ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={`${todaySummary?.transactionCount ?? 0} transactions`}
          trendUp={false}
          loading={loading}
        />
        <MetricCard
          label="Active Sessions"
          value={String(occupiedCount)}
          trend={`${totalTables} tables total`}
          loading={loading}
        />
        <MetricCard
          label="Occupancy"
          value={`${occupancyPct}%`}
          trend={`${occupiedCount} of ${totalTables} occupied`}
          loading={loading}
        />
      </section>

      {/* Pending Payments — card grid */}
      {awaitingOrders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Pending Payments
            </h2>
            <span className="text-sm text-secondary font-medium">
              Rs {totalPendingDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total due
            </span>
          </div>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {awaitingOrders.map((awaiting) => (
              <li
                key={awaiting.sessionId}
                className="bg-card rounded-xl border border-border/40 shadow-card p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold italic text-foreground">
                      Table {awaiting.tableNumber}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Seated {formatDistanceToNow(new Date(awaiting.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {awaiting.allAwaiting ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                      <Clock className="size-3" />
                      Needs Payment
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                      <ShieldCheck className="size-3" />
                      Pending Verify
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between border-t border-border/30 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {awaiting.itemCount} item{awaiting.itemCount !== 1 ? "s" : ""}
                  </span>
                  <span className="text-lg font-bold italic text-primary">
                    Rs {awaiting.totalDue.toFixed(2)}
                  </span>
                </div>

                <BillDetailPanel sessionId={awaiting.sessionId} />

                <div className="flex gap-3 mt-1">
                  {awaiting.allAwaiting ? (
                    (["CASH", "CARD"] as PayMethod[]).map((method) => {
                      const isBusy = payingId === awaiting.sessionId;
                      const Icon = method === "CASH" ? Banknote : CreditCard;
                      return (
                        <button
                          key={method}
                          onClick={() => handlePay(awaiting.sessionId, method)}
                          disabled={isBusy}
                          className={cn(
                            "flex-1 font-bold text-sm py-2.5 rounded-full transition-all duration-200 disabled:opacity-50",
                            method === "CASH"
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-surface-container border border-border text-foreground hover:bg-surface-container-high"
                          )}
                        >
                          {isBusy ? (
                            <Loader2 className="size-4 mx-auto animate-spin" />
                          ) : (
                            <span className="flex items-center justify-center gap-1.5">
                              <Icon className="size-4" />
                              {method}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <button
                      onClick={() => awaiting.firstPaymentId && handleVerify(awaiting.firstPaymentId)}
                      disabled={!awaiting.firstPaymentId || verifyingId === awaiting.firstPaymentId}
                      className="flex-1 font-bold text-sm py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
                    >
                      {verifyingId === awaiting.firstPaymentId ? (
                        <Loader2 className="size-4 mx-auto animate-spin" />
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="size-4" />
                          Verify Payment
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Active Sessions — table */}
      {sessions.length > 0 && (
        <section className="rounded-xl bg-card p-8 border border-border/40 shadow-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Active Sessions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider">
                    Table
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider">
                    Seated
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Orders
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Items
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Total Due
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-center">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {sessions.map((session) => {
                  const isAwaiting = awaitingOrders.some((a) => a.sessionId === session.sessionId);
                  return (
                    <tr key={session.sessionId} className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-4 px-2">
                        <span className="font-semibold italic text-foreground group-hover:text-primary transition-colors">
                          Table {session.tableNumber}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-secondary text-sm">
                        {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                      </td>
                      <td className="py-4 px-2 text-right text-secondary">
                        {session.orderCount}
                      </td>
                      <td className="py-4 px-2 text-right text-secondary">
                        {session.itemCount}
                      </td>
                      <td className="py-4 px-2 text-right text-base font-medium text-foreground">
                        Rs {session.totalDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-2 text-center">
                        {!isAwaiting ? (
                          <button
                            onClick={() => handleClose(session.tableId)}
                            disabled={closingId === session.tableId}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                          >
                            {closingId === session.tableId ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            Close
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Awaiting Pay
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Today's Payments — table */}
      {todayPayments.length > 0 && (
        <section className="rounded-xl bg-card p-8 border border-border/40 shadow-card">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Today's Payments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider">
                    Time
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider">
                    Table
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider">
                    Method
                  </th>
                  <th className="py-4 px-2 text-xs font-bold uppercase tracking-wider text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {todayPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="py-4 px-2 text-secondary text-sm">
                      {format(new Date(p.createdAt), "h:mm a")}
                    </td>
                    <td className="py-4 px-2">
                      <span className="font-semibold italic text-foreground group-hover:text-primary transition-colors">
                        {p.session?.table?.tableNumber ?? "—"}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        p.method === "CASH" && "bg-emerald-50 text-emerald-700",
                        p.method === "CARD" && "bg-blue-50 text-blue-700",
                        p.method === "ONLINE" && "bg-violet-50 text-violet-700",
                      )}>
                        {p.method === "CASH" ? <Banknote className="size-3" /> : p.method === "CARD" ? <CreditCard className="size-3" /> : <Globe className="size-3" />}
                        {p.method}
                      </span>
                    </td>
                    <td className="py-4 px-2 text-right text-base font-medium text-foreground">
                      Rs {Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty state */}
      {awaitingOrders.length === 0 && sessions.length === 0 && (
        <section className="rounded-xl bg-card p-8 border border-border/40 shadow-card">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
              <Receipt className="size-8" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium">All settled — nothing pending.</p>
          </div>
        </section>
      )}
    </div>
  );
}
