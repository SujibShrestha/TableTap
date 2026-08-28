"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CreditCard, Banknote, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { useTableSession } from "@/context/table-session-context";
import { createOrderWithPayment, getErrorMessage } from "@/api/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { Order } from "@/types";

export function PaymentPage() {
  const { id: tableId } = useParams<{ id: string }>();
  const { sessionId } = useTableSession();
  const { items, clearCart, pendingOrderData, setPendingOrderData, total } = useCart();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "AT_COUNTER">("ONLINE");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState<Order | null>(null);

  // Store cart data when entering payment page
  useEffect(() => {
    if (!pendingOrderData && items.length > 0) {
      setPendingOrderData({ items, total });
    }
  }, [pendingOrderData, items, total, setPendingOrderData]);

  const handleSubmit = useCallback(async () => {
    if (!sessionId || items.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      // createOrderWithPayment handles payment creation internally
      const order = await createOrderWithPayment(
        sessionId,
        items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        undefined, // specialInstructions - could be added from UI
        paymentMethod
      );

      clearCart();
      setPendingOrderData(null);
      setOrderResult(order);
      setSuccess(true);
      toast.success("Order placed successfully");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to process payment");
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }, [sessionId, items, paymentMethod, clearCart]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleContinue = () => {
    setSuccess(false);
    setOrderResult(null);
    navigate(`/t/${tableId}`);
  };

  const paymentData = pendingOrderData ?? { items, total };

  if (success && orderResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-surface rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <div className="mx-auto size-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4">
              <CheckCircle className="size-8 text-primary" strokeWidth={2} aria-hidden="true" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Order Confirmed!</h2>
            <p className="font-body-secondary text-body-secondary text-on-surface-variant">
              Your order has been sent to the kitchen.
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-4 mb-6">
            <p className="font-body-secondary text-body-secondary text-on-surface-variant mb-2">
              Order #{orderResult.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="font-menu-item-title text-menu-item-title text-primary italic">
              {formatMoney(orderResult.totalAmount)}
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
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
          <X className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Payment</h1>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant">
            Table {tableId}
          </p>
        </div>
      </header>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </Alert>
      )}

      <section className="bg-surface-container rounded-xl p-6 shadow-[0px_10px_30px_rgba(45,36,30,0.05)] mb-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Order Summary</h2>
        <div className="flex flex-col gap-3 mb-4 max-h-60 overflow-y-auto">
          {paymentData.items.map((item) => (
            <div key={item.menuItemId} className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-body-main text-body-main text-on-surface italic truncate">{item.name}</p>
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

      <section className="mb-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Payment Method</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="ONLINE"
              checked={paymentMethod === "ONLINE"}
              onChange={() => setPaymentMethod("ONLINE")}
              className="size-5 text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            <div className="flex flex-col gap-1 flex-1 cursor-pointer">
              <span className="font-body-main text-body-main text-on-surface flex items-center gap-2">
                <CreditCard className="size-5 text-primary" strokeWidth={2} aria-hidden="true" />
                Pay Online
              </span>
              <span className="font-body-secondary text-body-secondary text-on-surface-variant">
                Credit/Debit card or digital wallet
              </span>
            </div>
          </label>
          <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="AT_COUNTER"
              checked={paymentMethod === "AT_COUNTER"}
              onChange={() => setPaymentMethod("AT_COUNTER")}
              className="size-5 text-primary focus-visible:ring-2 focus-visible:ring-primary"
            />
            <div className="flex flex-col gap-1 flex-1 cursor-pointer">
              <span className="font-body-main text-body-main text-on-surface flex items-center gap-2">
                <Banknote className="size-5 text-primary" strokeWidth={2} aria-hidden="true" />
                Pay at Counter
              </span>
              <span className="font-body-secondary text-body-secondary text-on-surface-variant">
                Pay with cash or card when your food arrives
              </span>
            </div>
          </label>
        </div>
      </section>

      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={processing || items.length === 0}
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} aria-hidden="true" />
            Processing...
          </span>
        ) : (
          `Place Order • ${formatMoney(total.toString())}`
        )}
      </Button>
    </div>
  );
}