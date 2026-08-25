import { cn } from "@/lib/utils";
import { Check, Loader2, X, UtensilsCrossed, Package, Users, Table } from "lucide-react";
import type { Order } from "@/types";
import { useState } from "react";

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  isNew?: boolean;
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["SERVED"],
  SERVED: [],
  CANCELLED: [],
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  CONFIRMED: "Confirm",
  PREPARING: "Start Cooking",
  READY: "Ready",
  SERVED: "Served",
  CANCELLED: "Cancel",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  CONFIRMED: Check,
  PREPARING: UtensilsCrossed,
  READY: Package,
  SERVED: Check,
  CANCELLED: X,
};

const COURSE_LABELS: Record<string, string> = {
  PENDING: "Course 1",
  CONFIRMED: "Course 1",
  PREPARING: "Course 1",
  READY: "Course 1",
  SERVED: "Course 1",
  CANCELLED: "Course 1",
};

function getTableNumber(order: Order): string {
  if (order.session?.table?.tableNumber) {
    return order.session.table.tableNumber;
  }
  return order.sessionId.slice(0, 8);
}

function getStatusBadge(order: Order) {
  const status = order.status;
  if (status === "PENDING") {
    return (
      <span className="font-caption-bold text-caption-bold text-error bg-error/10 px-3 py-1 rounded-full">
        VIP / Waiting
      </span>
    );
  }
  return (
    <span className="font-caption-bold text-caption-bold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
      Order in progress...
    </span>
  );
}

function getHeaderClass(status: string) {
  if (status === "PENDING") {
    return "bg-error-container/20 border-error-container/30";
  }
  return "bg-primary-fixed/20 border-outline-variant/20";
}

function getBorderClass(status: string, isNew: boolean) {
  const base = "border";
  if (isNew) return `${base} border-2 border-primary-container animate-pulse`;
  if (status === "PENDING") return `${base} border-error-container/50`;
  return `${base} border-outline-variant/30`;
}

function getHeaderIcon(status: string) {
  if (status === "PENDING") return <Users className="size-5" strokeWidth={2} aria-hidden="true" />;
  return <Table className="size-5" strokeWidth={2} aria-hidden="true" />;
}

export function OrderCard({ order, onStatusChange, isNew = false }: OrderCardProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const currentStatus = order.status;
  const nextStatuses = STATUS_TRANSITIONS[currentStatus] ?? [];

  const handleAction = async (newStatus: string) => {
    setIsProcessing(newStatus);
    try {
      await onStatusChange(order.id, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <article
      className={cn(
        "ticket-card bg-surface-container-lowest rounded-[1.5rem] shadow-soft hover:shadow-hover overflow-hidden flex flex-col transition-all duration-300",
        getBorderClass(currentStatus, isNew),
      )}
    >
      {/* Header */}
      <div className={cn("px-6 py-4 flex justify-between items-center border-b", getHeaderClass(currentStatus))}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
            {getHeaderIcon(currentStatus)}
          </div>
          <h3 className="font-menu-item-title text-menu-item-title text-on-surface m-0">
            Table {getTableNumber(order)}
          </h3>
        </div>
        {getStatusBadge(order)}
      </div>

      {/* Items */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        {order.items?.map((item, index) => (
          <div key={item.id} className="flex flex-col gap-2 border-b border-outline-variant/20 pb-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <span className="font-price-label text-price-label text-on-surface-variant mt-1">
                  {item.quantity}x
                </span>
                <div>
                  <h4 className="font-body-main text-body-main text-on-surface font-semibold m-0">
                    {item.menuItem?.name ?? "Item"}
                  </h4>
                  <p className="font-body-secondary text-body-secondary text-on-surface-variant italic m-0">
                    {COURSE_LABELS[order.status] ?? `Course ${index + 1}`}
                  </p>
                </div>
              </div>
            </div>
            {order.specialInstructions && (
              <div className="flex gap-2 flex-wrap pl-8">
                <span className="font-caption-bold text-caption-bold text-on-tertiary-fixed-variant bg-surface-container-low px-2 py-1 rounded-md">
                  {order.specialInstructions}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-6 pt-0 mt-auto flex gap-3 border-t border-outline-variant/20">
        {nextStatuses.length === 0 ? (
          <span className="flex-1 text-center font-body-secondary text-body-secondary text-on-surface-variant/60 py-3">
            No actions available
          </span>
        ) : (
          nextStatuses.map((nextStatus) => {
            const isActive = isProcessing === nextStatus;
            const Icon = STATUS_ICONS[nextStatus];
            const label = STATUS_ACTION_LABELS[nextStatus] ?? nextStatus;
            const isPrimary = nextStatus === "READY" || nextStatus === "SERVED";

            return (
              <button
                key={nextStatus}
                onClick={() => handleAction(nextStatus)}
                disabled={isActive}
                className={cn(
                  "flex-1 font-cta-label text-cta-label py-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-wait",
                  isPrimary
                    ? "bg-primary-container text-on-primary hover:bg-primary shadow-sm"
                    : "bg-surface-container-low border border-border-sepia text-on-surface hover:bg-surface-container-high"
                )}
              >
                {isActive ? (
                  <Loader2 className="size-4 mx-auto animate-spin" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </article>
  );
}