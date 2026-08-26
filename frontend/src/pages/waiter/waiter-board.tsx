import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { getReadyWaiterOrders, updateOrderStatus } from "@/api/api";
import { useWaiterSocket } from "@/hooks/useWaiterSocket";
import { Loader2, AlertTriangle, ConciergeBell } from "lucide-react";
import type { Order } from "@/types";
import { OrderCard } from "@/components/kitchen/order-card";
import { toast } from "sonner";

export function WaiterBoard() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getReadyWaiterOrders(accessToken);
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch ready orders:", err);
      setError("Failed to load ready orders");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useWaiterSocket({
    accessToken: accessToken ?? "",
    onNewOrder: (newOrder: Order) => {
      // Only relevant if it somehow arrives already READY
      if (newOrder.status !== "READY") return;
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [...prev, newOrder];
      });
    },
    onOrderStatusUpdate: (updatedOrder: Order) => {
      setOrders((prev) => {
        if (updatedOrder.status === "READY") {
          return prev.some((o) => o.id === updatedOrder.id)
            ? prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            : [...prev, updatedOrder];
        }
        // Left the READY state (served/cancelled) — remove from board
        return prev.filter((o) => o.id !== updatedOrder.id);
      });
    },
  });

  const handleAction = useCallback(async (orderId: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await updateOrderStatus(accessToken, orderId, newStatus);
      toast.success(`Order marked as ${newStatus.toLowerCase()}`);
      // Optimistically remove from the board; socket update confirms
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    }
  }, [accessToken]);

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
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary italic font-extrabold text-3xl mb-1">
            Service Feed
          </h1>
          <p className="font-body-main text-body-main text-on-surface-variant">
            {orders.length === 0
              ? "All caught up — nothing waiting to be served."
              : `${orders.length} order${orders.length !== 1 ? "s" : ""} ready to serve.`}
          </p>
        </div>
        <div
          className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full"
          aria-live="polite"
        >
          <ConciergeBell className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
          <span className="font-caption-bold text-caption-bold text-on-surface-variant uppercase tracking-wide">
            Ready for pickup
          </span>
        </div>
      </header>

      {/* Feed Grid */}
      <main>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
          {orders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant/50">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                <ConciergeBell className="size-8" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="font-body-secondary text-body-secondary">No orders waiting</p>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={handleAction} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
