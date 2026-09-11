import { useState } from "react";
import { CreditCard, Banknote, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { checkoutOrder, getErrorMessage } from "@/api/api";
import { redirectToEsewa } from "@/lib/esewa";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

type PaymentMethod = "ONLINE" | "AT_COUNTER";

interface CheckoutPaymentOptionsProps {
  sessionId: string;
  items: { menuItemId: string; quantity: number }[];
  specialInstructions?: string;
  total: number;
  onOrderPlaced: (orderId: string, totalAmount: string) => void;
}

export function CheckoutPaymentOptions({
  sessionId,
  items,
  specialInstructions,
  total,
  onOrderPlaced,
}: CheckoutPaymentOptionsProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ONLINE");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (items.length === 0) return;

    setProcessing(true);
    setError(null);

    try {
      const result = await checkoutOrder(sessionId, items, paymentMethod, specialInstructions);

      if (result.esewa) {
        // ONLINE path — redirect browser to eSewa hosted payment page
        redirectToEsewa(result.esewa);
        // Browser navigates away — no further code runs here
      } else {
        // AT_COUNTER path — order placed, awaiting cashier confirmation
        onOrderPlaced(result.order.id, result.order.totalAmount);
        toast.success("Order placed — pay at the counter when your food arrives");
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to place order");
      setError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <span>{error}</span>
        </Alert>
      )}

      <section>
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
          Payment Method
        </h2>
        <div className="space-y-3">
          {/* eSewa */}
          <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
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
                Pay Online (eSewa)
              </span>
              <span className="font-body-secondary text-body-secondary text-on-surface-variant">
                Digital wallet — pay securely via eSewa
              </span>
            </div>
          </label>

          {/* Pay at counter */}
          <label className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/40 cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
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
        onClick={() => void handleSubmit()}
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
