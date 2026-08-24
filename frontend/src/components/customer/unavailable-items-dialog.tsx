import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { X } from "lucide-react";

interface UnavailableItemsDialogProps {
  unavailableItems: string[];
  onClose: () => void;
  onRetry: () => void;
}

export function UnavailableItemsDialog({ unavailableItems, onClose, onRetry }: UnavailableItemsDialogProps) {
  const { removeItem } = useCart();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-[0px_20px_50px_rgba(45,36,30,0.15)] overflow-hidden animate-fade-in">
        <header className="bg-error-container/50 border-b border-destructive/20 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-headline-lg-mobile font-bold italic text-destructive">
              Items Unavailable
            </h1>
            <button
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full bg-surface hover:bg-surface-container-high transition-colors"
              aria-label="Close"
            >
              <X className="size-5 text-destructive" />
            </button>
          </div>
        </header>

        <main className="p-6">
          <Alert className="mb-6 border-destructive/30 bg-error-container/50 text-on-error-container">
            <div className="flex items-center gap-2">
              <svg className="size-5 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-medium">Some items in your cart are no longer available</span>
            </div>
          </Alert>

          <ul className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {unavailableItems.map((itemName) => (
              <li key={itemName} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/50">
                <span className="font-body-main text-body-main text-on-surface">{itemName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(itemName)}
                  className="text-body-secondary"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Keep Shopping
            </Button>
            <Button className="flex-1" onClick={onRetry}>
              Retry Order
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}