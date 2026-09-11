import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { useTableSession } from "@/context/table-session-context";
import { Button } from "@/components/ui/button";
import { CheckoutPaymentOptions } from "@/components/customer/checkout-payment-options";

export function PaymentPage() {
  const { id: tableId } = useParams<{ id: string }>();
  const { sessionId } = useTableSession();
  const { items, clearCart, pendingOrderData, setPendingOrderData, total } = useCart();
  const navigate = useNavigate();

  // AT_COUNTER confirmation state
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedOrderTotal, setPlacedOrderTotal] = useState<string>("0");

  // Store cart data when entering payment page
  useEffect(() => {
    if (!pendingOrderData && items.length > 0) {
      setPendingOrderData({ items, total });
    }
  }, [pendingOrderData, items, total, setPendingOrderData]);

  const handleOrderPlaced = useCallback(
    (orderId: string, totalAmount: string) => {
      clearCart();
      setPendingOrderData(null);
      setPlacedOrderId(orderId);
      setPlacedOrderTotal(totalAmount);
    },
    [clearCart, setPendingOrderData]
  );

  const handleContinue = () => {
    setPlacedOrderId(null);
    navigate(`/t/${tableId}`);
  };

  const paymentData = pendingOrderData ?? { items, total };

  // ── AT_COUNTER confirmation overlay ─────────────────────────────
  if (placedOrderId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="mx-auto size-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4">
              <CheckCircle className="size-8 text-primary" strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Order Placed!
            </h2>
            <p className="font-body-secondary text-body-secondary text-on-surface-variant">
              Please pay at the counter when your food arrives.
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 mb-6">
            <p className="font-body-secondary text-body-secondary text-on-surface-variant mb-2">
              Order #{placedOrderId.slice(0, 8).toUpperCase()}
            </p>
            <p className="font-menu-item-title text-menu-item-title text-primary italic">
              {formatMoney(placedOrderTotal)}
            </p>
          </div>
          <Button className="w-full" size="lg" onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-6 py-8 flex flex-col">
      <header className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <X className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Payment</h1>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant">
            Table {tableId}
          </p>
        </div>
      </header>

      {/* Order Summary */}
      <section className="bg-surface-container rounded-xl p-6 shadow-[0px_10px_30px_rgba(45,36,30,0.05)] mb-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
          Order Summary
        </h2>
        <div className="flex flex-col gap-3 mb-4 max-h-60 overflow-y-auto">
          {paymentData.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-body-main text-body-main text-on-surface italic truncate">
                  {item.name}
                </p>
                <p className="font-body-secondary text-body-secondary text-on-surface-variant">
                  {item.quantity}x @ {formatMoney(item.price)}
                </p>
              </div>
              <span className="font-price-label text-price-label text-on-surface italic whitespace-nowrap">
                {formatMoney((Number(item.price) * item.quantity).toString())}
              </span>
            </div>
          ))}
        </div>
        <hr className="my-4 border-outline-variant/40" />
        <div className="flex justify-between items-baseline">
          <span className="font-body-main text-body-main text-on-surface">Total</span>
          <span className="font-display-lg text-display-lg text-primary italic">
            {formatMoney(paymentData.total.toString())}
          </span>
        </div>
      </section>

      {/* Payment Method + Submit */}
      <CheckoutPaymentOptions
        sessionId={sessionId ?? ""}
        items={paymentData.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity }))}
        total={paymentData.total}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
}
