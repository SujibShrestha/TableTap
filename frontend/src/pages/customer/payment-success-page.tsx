import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { verifyEsewaPayment, getErrorMessage } from "@/api/api";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";

export function PaymentSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    orderId ? "verifying" : "failed"
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(
    orderId ? null : "No order ID provided."
  );
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    async function verify() {
      try {
        const result = await verifyEsewaPayment(orderId!);
        if (cancelled) return;
        setOrder(result.order);
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setError(getErrorMessage(err, "Payment verification failed"));
        setStatus("failed");
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [orderId]);

  // Auto-navigate to the table after 3-second countdown
  useEffect(() => {
    if (status !== "success" || !order) return;

    const tableId = order?.session?.table?.id;
    if (!tableId) return;

    if (countdown <= 0) {
      navigate(`/t/${tableId}`);
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, order, countdown, navigate]);

  // ── Verifying state ─────────────────────────────────────────────
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <Loader2
            className="size-12 animate-spin text-primary mx-auto mb-6"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Confirming your payment...
          </h1>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant">
            Please wait while we verify your eSewa transaction.
          </p>
        </div>
      </div>
    );
  }

  // ── Failed state ────────────────────────────────────────────────
  if (status === "failed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          <div className="bg-surface rounded-2xl shadow-card p-8 text-center">
            <div className="mx-auto size-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="size-8 text-destructive" strokeWidth={2} aria-hidden="true" />
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
              Payment Not Verified
            </h1>
            <p className="font-body-secondary text-body-secondary text-on-surface-variant mb-8 leading-relaxed">
              {error ?? "We couldn't verify your payment. If you completed the payment on eSewa, please try again or contact support."}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="size-4" />
                Back to Checkout
              </Button>
              <Link
                to="/"
                className="font-body-secondary text-body-secondary text-on-surface-variant text-center hover:text-primary transition-colors underline underline-offset-4"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="bg-surface rounded-2xl shadow-card p-8 text-center">
          <div className="mx-auto size-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-6">
            <CheckCircle className="size-8 text-primary" strokeWidth={2} aria-hidden="true" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Payment Successful!
          </h1>
          <p className="font-body-secondary text-body-secondary text-on-surface-variant mb-6">
            Your order has been confirmed and sent to the kitchen.
          </p>

          {order && (
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-8 text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="font-body-secondary text-body-secondary text-on-surface-variant">
                  Order
                </span>
                <span className="font-body-main text-body-main text-on-surface">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="font-body-secondary text-body-secondary text-on-surface-variant">
                  Status
                </span>
                <span className="font-body-main text-body-main text-primary font-bold uppercase text-xs tracking-wider">
                  {order.status}
                </span>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="border-t border-outline-variant/30 mt-3 pt-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1.5">
                      <span className="font-body-secondary text-body-secondary text-on-surface-variant truncate mr-2">
                        {item.quantity}x {item.menuItem?.name ?? "Item"}
                      </span>
                      <span className="font-body-main text-body-main text-on-surface italic whitespace-nowrap">
                        {formatMoney((Number(item.unitPrice) * item.quantity).toString())}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-outline-variant/30 mt-3 pt-3 flex justify-between items-baseline">
                <span className="font-body-main text-body-main text-on-surface">Total Paid</span>
                <span className="font-display-lg text-display-lg text-primary italic">
                  {formatMoney(order.totalAmount)}
                </span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              const tableId = order?.session?.table?.id;
              if (tableId) {
                navigate(`/t/${tableId}`);
              } else {
                navigate("/");
              }
            }}
          >
            {order?.session?.table?.id
              ? `Continue to Table (${countdown}s)`
              : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
