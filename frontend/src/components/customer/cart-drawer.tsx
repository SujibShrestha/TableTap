import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Image, Minus, Plus } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { useTableSession } from "@/context/table-session-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { UnavailableItemsDialog } from "./unavailable-items-dialog";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, setPendingOrderData } = useCart();
  const { sessionId, table } = useTableSession();
  const navigate = useNavigate();
  const [unavailableItems, setUnavailableItems] = useState<string[] | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const handleSubmit = useCallback(() => {
    if (!sessionId || items.length === 0 || !table) return;
    setPendingOrderData({ items, specialInstructions, total: items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) });
    onOpenChange(false);
    navigate(`/t/${table.id}/payment`);
  }, [sessionId, items, specialInstructions, table, onOpenChange, navigate]);

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
                      className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-variant rounded-full transition-colors"
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
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
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
                {formatMoney(items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0).toString())}
              </span>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={items.length === 0}
            >
              Proceed to Payment
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {unavailableItems && (
        <UnavailableItemsDialog
          unavailableItems={unavailableItems}
          onClose={() => setUnavailableItems(null)}
          onRetry={table ? () => navigate(`/t/${table.id}/payment`) : undefined}
        />
      )}
    </>
  );
}