import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/auth-context";
import { getActiveSessions, markStaffPayment, type ActiveSession } from "@/api/api";
import { useWaiterSocket } from "@/hooks/useWaiterSocket";
import type { Order } from "@/types";
import { Loader2, AlertTriangle, Receipt, Banknote, CreditCard, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PayMethod = "CASH" | "CARD";

export function BillsPage() {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getActiveSessions(accessToken);
      setSessions(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch active sessions:", err);
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
    },
  });

  const handlePay = useCallback(
    async (sessionId: string, method: PayMethod) => {
      if (!accessToken) return;
      setPayingId(sessionId);
      try {
        await markStaffPayment(accessToken, sessionId, method);
        toast.success(`Table paid by ${method.toLowerCase()} — session closed`);
        setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to record payment");
      } finally {
        setPayingId(null);
      }
    },
    [accessToken]
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
          {sessions.length === 0
            ? "No open tables right now."
            : `${sessions.length} open table${sessions.length !== 1 ? "s" : ""} waiting to check out.`}
        </p>
      </header>

      {/* Open tables */}
      {sessions.length === 0 ? (
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
                {(["CASH", "CARD"] as PayMethod[]).map((method, idx) => {
                  const isBusy = payingId === session.sessionId;
                  const Icon = method === "CASH" ? Banknote : CreditCard;
                  return (
                    <button
                      key={method}
                      onClick={() => handlePay(session.sessionId, method)}
                      disabled={isBusy}
                      className={cn(
                        "flex-1 font-cta-label text-cta-label py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-wait",
                        idx === 0
                          ? "bg-primary-container text-on-primary hover:bg-primary"
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
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
