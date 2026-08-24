import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { useTableSession } from "@/context/table-session-context";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Order } from "@/types";

const ORDER_STEPS = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY", label: "Ready" },
  { key: "SERVED", label: "Served" },
] as const;

type OrderStatus = (typeof ORDER_STEPS)[number]["key"];

interface OrderConfirmationProps {
  order: Order;
  onClose: () => void;
}

export function OrderConfirmation({ order, onClose }: OrderConfirmationProps) {
  const { table } = useTableSession();

  const currentStatus = order.status as OrderStatus;
  const statusIndex = ORDER_STEPS.findIndex((step) => step.key === currentStatus);
  const activeIndex = statusIndex >= 0 ? statusIndex : 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-[0px_20px_50px_rgba(45,36,30,0.15)] overflow-hidden animate-fade-in">
        <header className="bg-surface border-b border-outline-variant/40 p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
              aria-label="Close"
            >
              <X className="size-5 text-primary" />
            </button>
            <h1 className="text-headline-lg-mobile font-bold italic text-primary">TableTap</h1>
            <div className="text-primary font-bold italic px-2">Table {table?.tableNumber ?? ""}</div>
          </div>
        </header>

        <main className="flex-grow p-4 max-w-md mx-auto w-full pb-8">
          <div className="text-center mb-8">
            <svg className="mx-auto size-16 text-emerald-600 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h2 className="text-headline-lg-mobile text-on-surface">Order Placed!</h2>
            <p className="text-body-secondary text-on-surface-variant/70 italic mt-2">
              Your order has been received and is being prepared.
            </p>
          </div>

          <div className="w-full relative flex justify-between items-start pt-6 mb-8">
            <div className="absolute top-[28px] left-8 right-8 h-1 bg-surface-variant rounded-full z-0"></div>
            <div
              className="absolute top-[28px] left-8 h-1 bg-primary-container rounded-full z-0 transition-all duration-700 ease-in-out"
              style={{ width: `${(activeIndex / 4) * 100}%` }}
            ></div>
            {ORDER_STEPS.map((step, index) => {
              const isCompleted = index < activeIndex;
              const isActive = index === activeIndex;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 group">
                  <div className={cn(
                    "rounded-full flex items-center justify-center shadow-[0px_10px_30px_rgba(45,36,30,0.15)] transition-all duration-300",
                    isCompleted && "w-12 h-12 bg-primary-container text-on-primary-container",
                    isActive && "w-14 h-14 -mt-1 bg-surface text-primary border-4 border-primary-container scale-110",
                    !isCompleted && !isActive && "w-12 h-12 bg-surface text-on-surface-variant border border-outline-variant bg-opacity-80"
                  )}>
                    {isCompleted ? (
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : isActive ? (
                      <svg className="size-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    ) : (
                      <span className="text-caption-bold font-bold">{index + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    "font-body-secondary text-body-secondary text-xs font-medium",
                    (isCompleted || isActive) && "text-primary-container italic font-bold",
                    (!isCompleted && !isActive) && "text-on-surface-variant/60"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-surface rounded-xl shadow-card p-6 border border-surface-variant/50">
            <h3 className="text-menu-item-title text-on-surface-variant mb-6 border-b border-surface-variant pb-4">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h3>
            <ul className="flex flex-col gap-4 mb-6">
              {order.items?.map((item) => (
                <li key={item.id} className="flex justify-between items-start">
                  <div>
                    <div className="font-body-main text-body-main text-on-surface font-medium italic">
                      {item.menuItem?.name ?? "Item"}
                    </div>
                    {item.menuItem?.description && (
                      <div className="font-body-secondary text-body-secondary text-on-surface-variant/70 text-sm">
                        {item.menuItem.description}
                      </div>
                    )}
                  </div>
                  <div className="font-price-label text-price-label text-on-surface-variant italic">
                    {item.quantity}x
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between items-center border-t border-surface-variant pt-4">
              <span className="font-body-main text-body-main text-on-surface">Total</span>
              <span className="text-price-label font-bold text-primary italic">
                {formatMoney(order.totalAmount)}
              </span>
            </div>
          </div>
        </main>

        <Button
          onClick={onClose}
          className="w-full mx-4 mb-6 bg-surface-container-high text-on-surface border border-outline-variant font-cta-label text-cta-label italic uppercase py-3 rounded-xl shadow-card hover:bg-opacity-70 transition-all"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}