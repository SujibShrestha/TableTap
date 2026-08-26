
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import { useTableSession } from "@/context/table-session-context";
import { getOrdersBySession, cancelOrder } from "@/api/api";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/socket-context";
import { Check, Loader2, AlertCircle, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import type { Order } from "@/types";

const ORDER_STEPS = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "SERVED", label: "Served" },
] as const;

type OrderStatus = (typeof ORDER_STEPS)[number]["key"];

function OrderCard({
  order,
  isLatest,
  onCancel,
  cancelling,
}: {
  order: Order;
  isLatest: boolean;
  onCancel?: (orderId: string) => void;
  cancelling?: boolean;
}) {
  const currentStatus = order.status as OrderStatus;

  // Cancelled orders aren't part of the progress tracker — show a settled banner instead
  if (order.status === "CANCELLED") {
    return (
      <article className="rounded-2xl shadow-[0px_10px_30px_rgba(45,36,30,0.05)] p-4 md:p-6 bg-surface border border-outline-variant/40 opacity-70">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-menu-item-title text-menu-item-title text-on-surface-variant italic">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h3>
            <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-caption-bold rounded-full line-through">
            Cancelled
          </span>
        </div>
      </article>
    );
  }

  const statusIndex = ORDER_STEPS.findIndex((step) => step.key === currentStatus);
  const activeIndex = statusIndex >= 0 ? statusIndex : 0;

  return (
    <article className={cn(
      "rounded-2xl shadow-[0px_10px_30px_rgba(45,36,30,0.05)] p-4 md:p-6 bg-surface border transition-all duration-300 hover:shadow-[0px_15px_40px_rgba(45,36,30,0.08)]",
      isLatest && "border-2 border-primary-container/50 ring-1 ring-primary-container/30"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-menu-item-title text-menu-item-title text-primary italic">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h3>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 mt-1">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        {isLatest && (
          <span className="px-3 py-1 bg-primary-container/20 text-primary-container text-caption-bold rounded-full font-medium italic">
            Latest
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-3 mb-4">
        {order.items?.map((item) => (
          <li key={item.id} className="flex justify-between items-center py-2 border-b border-surface-variant/30 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="font-body-main text-body-main text-on-surface font-medium italic truncate">
                {item.menuItem?.name ?? "Item"}
              </div>
              {order.specialInstructions && (
                <p className="font-body-secondary text-body-secondary text-on-surface-variant/60 text-sm italic">
                  {order.specialInstructions}
                </p>
              )}
            </div>
            <div className="font-price-label text-price-label text-on-surface-variant italic whitespace-nowrap">
              {item.quantity}x
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-center mb-4 pt-3 border-t border-surface-variant">
        <span className="font-body-main text-body-main text-on-surface">Total</span>
        <span className="text-price-label font-bold text-primary italic">
          {formatMoney(order.totalAmount)}
        </span>
      </div>

      <div className="w-full relative flex justify-between items-start pt-3">
        <div className="absolute top-[24px] left-8 right-8 h-1 bg-surface-variant rounded-full z-0"></div>
        <div
          className="absolute top-[24px] left-8 h-1 bg-primary-container rounded-full z-0 transition-all duration-700 ease-in-out"
          style={{ width: `${(activeIndex / 4) * 100}%` }}
        ></div>
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={cn(
                "rounded-full flex items-center justify-center shadow-[0px_5px_15px_rgba(45,36,30,0.1)] transition-all duration-300",
                isCompleted && "w-8 h-8 bg-primary-container text-on-primary-container",
                isActive && "w-10 h-10 -mt-0.5 bg-surface text-primary border-3 border-primary-container scale-110",
                !isCompleted && !isActive && "w-8 h-8 bg-surface text-on-surface-variant border border-outline-variant"
              )}>
                {isCompleted ? (
                  <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
                ) : isActive ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <span className="text-caption-bold font-bold text-xs">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "font-body-secondary text-body-secondary text-[10px] font-medium whitespace-nowrap",
                (isCompleted || isActive) && "text-primary-container italic font-bold",
                (!isCompleted && !isActive) && "text-on-surface-variant/60"
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {order.status === "PENDING" && onCancel && (
        <button
          onClick={() => onCancel(order.id)}
          disabled={cancelling}
          className="mt-5 w-full flex items-center justify-center gap-2 font-cta-label text-cta-label py-3 rounded-full border border-error/40 text-error hover:bg-error/5 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {cancelling ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <X className="size-4" aria-hidden="true" />
          )}
          Cancel Order
        </button>
      )}
    </article>
  );
}

export function OrdersPage() {
  const { sessionId } = useTableSession();
  const { onOrderStatusUpdate } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!sessionId) return;
    try {
      const data = await getOrdersBySession(sessionId);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const unsubscribe = onOrderStatusUpdate((updatedOrder) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? { ...order, status: updatedOrder.status, updatedAt: updatedOrder.updatedAt } : order
        )
      );
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, onOrderStatusUpdate]);

  const handleCancel = async (orderId: string) => {
    if (!sessionId || cancellingId) return;
    if (!window.confirm("Cancel this order? This can't be undone.")) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId, sessionId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o)));
      toast.success("Order cancelled");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <main className="max-w-2xl mx-auto w-full px-container-padding-mobile md:px-0 pt-8 pb-32">
        <div className="text-center py-12">
          <div className="mx-auto size-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
          <p className="font-body-main text-body-main text-on-surface-variant mt-4">Loading orders...</p>
        </div>
      </main>
    );
  }

  if (error && orders.length === 0) {
    return (
      <main className="max-w-2xl mx-auto w-full px-container-padding-mobile md:px-0 pt-8 pb-32">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto size-12 text-destructive mb-4" strokeWidth={2} />
          <p className="font-body-main text-body-main text-on-surface">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto w-full px-container-padding-mobile md:px-0 pt-8 pb-32">
      <header className="mb-8">
        <h1 className="text-headline-lg font-bold italic text-primary">Your Orders</h1>
        <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 italic mt-1">
          Track your orders in real-time
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant/40">
          <ShoppingBag className="mx-auto size-16 text-on-surface-variant/30 mb-4" strokeWidth={1.5} />
          <h3 className="text-headline-lg-mobile text-on-surface mb-2">No orders yet</h3>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 italic">
            Your order history will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => (
            <OrderCard
              key={order.id}
              order={order}
              isLatest={index === 0}
              onCancel={handleCancel}
              cancelling={cancellingId === order.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}