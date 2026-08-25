"use client";

import { cn } from "@/lib/utils";
import { useTableSession } from "@/context/table-session-context";
import { ArrowLeft, Check, Receipt, UtensilsCrossed, Package, Store, Circle } from "lucide-react";
import type { Order } from "@/types";

const ORDER_STEPS = [
  { key: "PENDING", label: "Pending", icon: Circle, completedIcon: Check },
  { key: "CONFIRMED", label: "Confirmed", icon: Receipt, completedIcon: Receipt },
  { key: "PREPARING", label: "Preparing", icon: UtensilsCrossed, completedIcon: UtensilsCrossed },
  { key: "READY", label: "Ready", icon: Package, completedIcon: Package },
  { key: "SERVED", label: "Served", icon: Store, completedIcon: Store },
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

  const estimatedMinutes = 15 + Math.floor(Math.random() * 10);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-surface border-b border-outline-variant/40 shadow-[0px_10px_30px_rgba(45,36,30,0.05)]">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="size-5 text-primary" strokeWidth={2.5} />
          </button>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold italic text-primary">L'Artiste Bistro</h1>
          <div className="font-body-main text-body-main text-primary font-bold italic px-2">Table {table?.tableNumber ?? ""}</div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-6 py-12 pb-32 flex flex-col items-center">
        <div className="text-center mb-12 flex flex-col items-center gap-4 w-full">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface-variant">Estimated Wait</h2>
          <div className="font-display-lg text-display-lg text-on-surface-variant italic font-bold">
            {estimatedMinutes}-{estimatedMinutes + 5} min
          </div>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 italic mt-2 text-center max-w-[250px]">
            We're crafting your order with care.
          </p>
        </div>

        <div className="w-full relative flex justify-between items-start pt-6 mb-12">
          <div className="absolute top-[34px] left-8 right-8 h-1 bg-surface-variant rounded-full z-0"></div>
          <div
            className="absolute top-[34px] left-8 h-1 bg-primary-container rounded-full z-0 transition-all duration-700 ease-in-out"
            style={{ width: `${(activeIndex / 4) * 100}%` }}
          ></div>
          {ORDER_STEPS.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;
            const StepIcon = step.icon;
            const CompletedIcon = step.completedIcon;
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center gap-2 group">
                <div className={cn(
                  "rounded-full flex items-center justify-center shadow-[0px_10px_30px_rgba(45,36,30,0.15)] transition-all duration-300",
                  isCompleted && "w-14 h-14 bg-primary-container text-on-primary-container",
                  isActive && "w-16 h-16 -mt-1 bg-surface text-primary border-4 border-primary-container scale-110 shadow-[0px_10px_30px_rgba(45,36,30,0.2)]",
                  !isCompleted && !isActive && "w-14 h-14 bg-surface text-on-surface-variant border border-outline-variant bg-opacity-80"
                )}>
                  {isCompleted ? (
                    <CompletedIcon className="size-6" strokeWidth={2.5} aria-hidden="true" />
                  ) : (
                    <StepIcon className={cn("size-5 strokeWidth={2}", isActive && "size-7")} aria-hidden="true" />
                  )}
                </div>
                <span className={cn(
                  "font-body-secondary text-body-secondary text-caption-bold font-medium whitespace-nowrap",
                  (isCompleted || isActive) && "text-primary-container italic font-bold",
                  (!isCompleted && !isActive) && "text-on-surface-variant/60"
                )}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="w-full bg-surface rounded-xl shadow-[0px_10px_30px_rgba(45,36,30,0.05)] p-6 border border-surface-variant/50 relative overflow-hidden group hover:shadow-[0px_15px_40px_rgba(45,36,30,0.08)] transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 rounded-bl-full -mr-16 -mt-16 transition-transform duration-500 group-hover:scale-110" aria-hidden="true" />
          <h3 className="font-menu-item-title text-menu-item-title text-on-surface-variant mb-6 border-b border-surface-variant pb-4">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h3>
          <ul className="flex flex-col gap-4">
            {order.items?.map((item) => (
              <li key={item.id} className="flex justify-between items-start">
                <div>
                  <div className="font-body-main text-body-main text-on-surface font-medium italic">
                    {item.menuItem?.name ?? "Item"}
                  </div>
                  {item.menuItem?.description && (
                    <div className="font-body-secondary text-body-secondary text-on-surface-variant/70">
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
        </div>
      </main>
    </div>
  );
}