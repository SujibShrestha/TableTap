"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { X, Loader2, Image, Minus, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { useTableSession } from "@/context/table-session-context";
import { createCustomerOrder, getErrorMessage } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { UnavailableItemsDialog } from "./unavailable-items-dialog";
import { OrderConfirmation } from "./order-confirmation";
import { toast } from "sonner";
import type { Order } from "@/types";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { sessionId } = useTableSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [unavailableItems, setUnavailableItems] = useState<string[] | null>(null);
  const [orderResult, setOrderResult] = useState<Order | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!sessionId || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const order = await createCustomerOrder(
        sessionId,
        items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }))
      );
      clearCart();
      setOrderResult(order);
      setSuccess(true);
      toast.success("Order placed successfully");
      onOpenChange(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const data = err.response.data as { unavailableItems?: string[] };
        setUnavailableItems(data.unavailableItems ?? []);
      } else {
        setError(getErrorMessage(err, "Failed to place order"));
      }
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, items, clearCart, onOpenChange]);

  if (items.length === 0) return null;

  return (
    <>
      <Sheet>
        <SheetContent open={open} onOpenChange={onOpenChange} side="bottom" className="max-h-[calc(85vh-6rem)] pb-24">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4 w-full">
              <div>
                <SheetTitle>Your Order</SheetTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Close cart"
              >
                <X className="size-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && <Alert className="mb-4">{error}</Alert>}

            {items.map((item) => (
              <div key={item.menuItemId} className="flex gap-4">
                <div className="w-16 h-16 rounded-lg bg-surface-container-high flex-shrink-0 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="size-6 text-muted-foreground/50" strokeWidth={2} aria-hidden="true" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-body-main text-body-main text-on-surface font-medium italic">
                        {item.name}
                      </h3>
                      <p className="text-price-label font-medium text-on-surface-variant italic">
                        {formatMoney(item.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.menuItemId)}
                      className="text-on-surface-variant/60 hover:text-destructive transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-variant rounded-full transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                    <span className="font-body-main text-body-main text-on-surface w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-8 h-8 flex items_center justify-center text-primary hover:bg-surface-variant rounded-full transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t border-outline-variant/40 pt-4">
              <label className="block text-body-secondary text-on-surface-variant mb-2">
                Special Instructions (optional)
              </label>
              <textarea
                className="w-full h-20 p-3 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="e.g., No onions, extra spicy, allergy info..."
                maxLength={500}
              />
            </div>
          </div>

          <SheetFooter className="flex-col gap-4">
            <div className="flex justify-between items-center w-full">
              <span className="font-body-main text-body-main text-on-surface">Total</span>
              <span className="text-display-lg text-primary font-bold italic">
                {formatMoney(total)}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Placing Order...
                </span>
              ) : (
                `Place Order • ${formatMoney(total)}`
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {unavailableItems && (
        <UnavailableItemsDialog
          unavailableItems={unavailableItems}
          onClose={() => setUnavailableItems(null)}
          onRetry={handleSubmit}
        />
      )}

      {success && orderResult && (
        <OrderConfirmation order={orderResult} onClose={() => setSuccess(false)} />
      )}
    </>
  );
}