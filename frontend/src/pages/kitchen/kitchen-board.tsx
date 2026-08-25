import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { getActiveKitchenOrders, updateOrderStatus } from "@/api/api";
import { useKitchenSocket } from "@/hooks/useKitchenSocket";
import { Loader2, AlertTriangle, ShoppingBag } from "lucide-react";
import type { Order } from "@/types";
import { OrderCard } from "@/components/kitchen/order-card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All Active" },
  { id: "grill", label: "Grill Station" },
  { id: "salad", label: "Salad/Cold" },
] as const;

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 3,
};

export function KitchenBoard() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await getActiveKitchenOrders(accessToken);
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch kitchen orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useKitchenSocket({
    accessToken: accessToken ?? "",
    onNewOrder: (newOrder: Order) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [...prev, newOrder].sort((a, b) => {
          const priorityA = STATUS_PRIORITY[a.status] ?? 99;
          const priorityB = STATUS_PRIORITY[b.status] ?? 99;
          if (priorityA !== priorityB) return priorityA - priorityB;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      });
      toast.info(`New order from Table ${newOrder.session?.table?.tableNumber ?? newOrder.sessionId.slice(0, 8)}`);
    },
    onOrderStatusUpdate: (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, status: updatedOrder.status, updatedAt: updatedOrder.updatedAt } : o))
      );
    },
  });

  const handleAction = useCallback(async (orderId: string, newStatus: string) => {
    if (!accessToken) return;
    try {
      await updateOrderStatus(accessToken, orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    }
  }, [accessToken]);

  // Sort orders: PENDING first, then by createdAt
  const sortedOrders = [...orders].sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] ?? 99;
    const priorityB = STATUS_PRIORITY[b.status] ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Apply filter (placeholder for future station-based filtering)
  const filteredOrders = activeFilter === "all" 
    ? sortedOrders 
    : sortedOrders; // TODO: implement station filtering

  if (loading) {
    return (
      <div className="h-screen bg-surface flex items-center justify-center">
        <Loader2 className="size-12 animate-spin text-primary" strokeWidth={2} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-surface flex flex-col items-center justify-center p-8">
        <AlertTriangle className="size-12 text-destructive mb-4" strokeWidth={2} />
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Failed to load orders</h2>
        <p className="font-body-main text-body-main text-on-surface-variant mb-6">{error}</p>
        <button
          onClick={fetchOrders}
          className="bg-primary text-on-primary font-cta-label text-cta-label py-3 px-6 rounded-full"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-surface flex flex-col">
      {/* Top Toolbar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 border-b border-outline-variant/20 bg-surface/95 backdrop-blur-sm sticky top-0 z-40">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary italic font-extrabold text-3xl mb-1">Kitchen Feed</h1>
          <p className="font-body-main text-body-main text-on-surface-variant">
            Service is flowing nicely. {orders.length} active order{orders.length !== 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "font-caption-bold text-caption-bold px-4 py-2 rounded-full transition-colors",
                activeFilter === filter.id
                  ? "bg-surface-container-low border border-outline-variant text-on-surface hover:bg-surface-container-high"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {/* Feed Grid */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto pb-20">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-on-surface-variant/50">
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
                <ShoppingBag className="size-8" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <p className="font-body-secondary text-body-secondary">No orders</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={handleAction} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}