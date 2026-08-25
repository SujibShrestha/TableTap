import { cn } from "@/lib/utils";
import type { Order } from "@/types";
import { OrderCard } from "./order-card";
import { ClipboardList } from "lucide-react";

interface KitchenColumnProps {
  title: string;
  orders: Order[];
  onStatusChange: (orderId: string, newStatus: string) => void;
  statuses: string[];
  count: number;
}

const COLUMN_COLORS: Record<string, string> = {
  "New": "bg-primary-fixed/10 border-primary-fixed/20",
  "Preparing": "bg-amber-100/50 border-amber-200",
  "Ready to Serve": "bg-emerald-100/50 border-emerald-200",
};

export function KitchenColumn({ title, orders, onStatusChange, count }: KitchenColumnProps) {
  return (
    <section className={cn(
      "flex flex-col min-h-0 rounded-[1.5rem] border",
      COLUMN_COLORS[title] ?? "border-outline-variant/20"
    )}>
      {/* Column Header */}
      <header className="px-4 py-3 flex justify-between items-center border-b border-outline-variant/20">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface m-0 italic">
          {title}
        </h2>
        <span className="font-caption-bold text-caption-bold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
          {count}
        </span>
      </header>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/50 py-12">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-3">
              <ClipboardList className="size-8" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="font-body-secondary text-body-secondary">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </section>
  );
}