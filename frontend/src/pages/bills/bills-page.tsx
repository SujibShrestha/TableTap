import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getActiveSessions, getAwaitingPaymentOrders, markStaffPayment, verifyPayment, closeTableSession, type ActiveSession } from "@/api/api";
import { useWaiterSocket } from "@/hooks/useWaiterSocket";
import type { Order } from "@/types";
import { Loader2, AlertTriangle, Receipt, Banknote, CreditCard, Users, Clock, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PayMethod = "CASH" | "CARD";

interface AwaitingPaymentOrder {
  sessionId: string;
  tableNumber: string;
  startedAt: string;
  orderCount: number;
  itemCount: number;
  totalDue: number;
  orderIds: string[];
  /** Are ALL orders in this group awaiting payment (none verified yet)? */
  allAwaiting: boolean;
  /** Payment ID of the first verified payment (if any) */
  firstPaymentId: string | null;
}

export function BillsPage() {
  const { accessToken, user } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [awaitingOrders, setAwaitingOrders] = useState<AwaitingPaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const canVerify = user?.role === "CASHIER" || user?.role === "ADMIN" || user?.role === "WAITER";

  const fetchSessions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [sessionsData, awaitingData] = await Promise.all([
        getActiveSessions(accessToken),
        getAwaitingPaymentOrders(accessToken),
      ]);
      
      setSessions(sessionsData);
      
      // Group awaiting payment orders by session
      const grouped = awaitingData.reduce((acc, order) => {
        const existing = acc.find((a) => a.sessionId === order.sessionId);
        const isVerified = order.paymentStatus === "PENDING_VERIFICATION" || order.paymentStatus === "PAID" || order.payment?.status === "PENDING_VERIFICATION";
        
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
            firstPaymentId: (isVerified && order.payment?.id) ? order.payment.id : null,
          });
        }
        return acc;
      }, [] as AwaitingPaymentOrder[]);
      
      setAwaitingOrders(grouped);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch bills:", err);
      setError("Failed to load open tables");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useWaiterSocket({
    accessToken: accessToken ?? "",
    onNewOrder: () => void fetchSessions(),
    onOrderStatusUpdate: (_updated: Order) => {
      // totals only change when orders are added; status flips don't affect amounts
    },
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
        toast.success("Payment recorded — pending cashier verification");
        // Refresh the list to show updated status
        await fetchSessions();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to record payment");
      } finally {
        setPayingId(null);
      }
    },
    [accessToken, fetchSessions]
  );

  const handleVerify = useCallback(
    async (paymentId: string) => {
      if (!accessToken) return;
      setVerifyingId(paymentId);
      try {
        await verifyPayment(accessToken, paymentId);
        toast.success("Payment verified — order sent to kitchen");
        await fetchSessions();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to verify payment");
      } finally {
        setVerifyingId(null);
      }
    },
    [accessToken, fetchSessions]
  );

  const handleClose = useCallback(
    async (tableId: string) => {
      if (!accessToken) return;
      setClosingId(tableId);
      try {
        await closeTableSession(accessToken, tableId);
        toast.success("Session closed");
        await fetchSessions();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to close session");
      } finally {
        setClosingId(null);
      }
    },
    [accessToken, fetchSessions]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" strokeWidth={2} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="size-12 text-destructive mb-4" strokeWidth={2} aria-hidden="true" />
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Failed to load bills</h2>
        <p className="font-body-main text-body-main text-on-surface-variant mb-6">{error}</p>
        <button
          onClick={fetchSessions}
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
          Bills
        </h1>
        <p className="font-body-main text-body-main text-on-surface-variant">
          {(sessions.length + awaitingOrders.length) === 0
            ? "No open tables right now."
            : `${sessions.length} open table${sessions.length !== 1 ? "s" : ""}, ${awaitingOrders.length} awaiting payment`}
        </p>
      </header>

      {/* Awaiting Payment Orders */}
      {awaitingOrders.length > 0 && (
        <section>
          <h2 className="font-body-secondary text-body-secondary text-on-surface-variant uppercase tracking-wide text-sm mb-3">
            Awaiting Payment
          </h2>
          <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {awaitingOrders.map((awaiting) => (
              <li
                key={awaiting.sessionId}
                className="bg-surface-container-lowest rounded-[1.5rem] shadow-soft hover:shadow-hover border border-amber-300/50 p-6 flex flex-col gap-4 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-menu-item-title text-menu-item-title text-on-surface italic">
                      Table {awaiting.tableNumber}
                    </h3>
                    <p className="font-caption-bold text-caption-bold text-on-surface-variant/70 mt-0.5">
                      Seated {formatDistanceToNow(new Date(awaiting.startedAt), { addSuffix: true })}
                    </p>
                  </div>
                  {awaiting.allAwaiting ? (
                    <span className="flex items-center gap-1.5 font-caption-bold text-caption-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
                      <Clock className="size-3.5" aria-hidden="true" />
                      Awaiting Payment
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 font-caption-bold text-caption-bold bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
                      <ShieldCheck className="size-3.5" aria-hidden="true" />
                      Pending Verification
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between border-t border-outline-variant/20 pt-4">
                  <span className="font-caption-bold text-caption-bold text-on-surface-variant uppercase tracking-wide">
                    {awaiting.itemCount} item{awaiting.itemCount !== 1 ? "s" : ""} due
                  </span>
                  <span className="font-price-label text-price-label text-amber-600 italic">
                    Rs {awaiting.totalDue.toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3 mt-auto">
                  {awaiting.allAwaiting ? (
                    // Show Cash/Card buttons — staff needs to record the payment method
                    (["CASH", "CARD"] as PayMethod[]).map((method, idx) => {
                      const isBusy = payingId === awaiting.sessionId;
                      const Icon = method === "CASH" ? Banknote : CreditCard;
                      return (
                        <button
                          key={method}
                          onClick={() => handlePay(awaiting.sessionId, method)}
                          disabled={isBusy}
                          className={cn(
                            "flex-1 font-cta-label text-cta-label py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-wait",
                            idx === 0
                              ? "bg-amber-600 text-white hover:bg-amber-700"
                              : "bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-container-high"
                          )}
                        >
                          {isBusy ? (
                            <Loader2 className="size-4 mx-auto animate-spin" aria-hidden="true" />
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Icon className="size-4" aria-hidden="true" />
                              {method === "CASH" ? "Cash" : "Card"}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    // Show Verify button — payment recorded, awaiting cashier verification
                    canVerify && awaiting.firstPaymentId ? (
                      <button
                        onClick={() => handleVerify(awaiting.firstPaymentId!)}
                        disabled={verifyingId === awaiting.firstPaymentId}
                        className="flex-1 font-cta-label text-cta-label py-3 rounded-full bg-primary text-white hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                      >
                        {verifyingId === awaiting.firstPaymentId ? (
                          <Loader2 className="size-4 mx-auto animate-spin" aria-hidden="true" />
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <ShieldCheck className="size-4" aria-hidden="true" />
                            Verify Payment
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className="flex-1 font-cta-label text-cta-label py-3 rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-center">
                        Awaiting Verification
                      </span>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Open tables (already paid, just need to close session) */}
      {sessions.length === 0 && awaitingOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/50">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
            <Receipt className="size-8" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <p className="font-body-secondary text-body-secondary">Everything is settled</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {sessions.map((session) => (
            <li
              key={session.sessionId}
              className="bg-surface-container-lowest rounded-[1.5rem] shadow-soft hover:shadow-hover border border-outline-variant/30 p-6 flex flex-col gap-4 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-menu-item-title text-menu-item-title text-on-surface italic">
                    Table {session.tableNumber}
                  </h3>
                  <p className="font-caption-bold text-caption-bold text-on-surface-variant/70 mt-0.5">
                    Seated {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 font-caption-bold text-caption-bold bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full">
                  <Users className="size-3.5" aria-hidden="true" />
                  {session.orderCount} order{session.orderCount !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-outline-variant/20 pt-4">
                <span className="font-caption-bold text-caption-bold text-on-surface-variant uppercase tracking-wide">
                  {session.itemCount} item{session.itemCount !== 1 ? "s" : ""} due
                </span>
                <span className="font-price-label text-price-label text-primary italic">
                  Rs {session.totalDue.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => handleClose(session.tableId)}
                  disabled={closingId === session.tableId}
                  className="flex-1 font-cta-label text-cta-label py-3 rounded-full bg-destructive text-white hover:bg-destructive/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait"
                >
                  {closingId === session.tableId ? (
                    <Loader2 className="size-4 mx-auto animate-spin" aria-hidden="true" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <XCircle className="size-4" aria-hidden="true" />
                      Close Session
                    </span>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
