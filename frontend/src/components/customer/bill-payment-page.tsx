import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTableSession } from "@/context/table-session-context";
import { getOrdersBySession } from "@/api/api";
import { Banknote, Loader2, Info } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Order, OrderItem } from "@/types";
import { Alert } from "@/components/ui/alert";

function BillItem({ item }: { item: OrderItem }) {
  const lineTotal = Number(item.unitPrice) * item.quantity;
  return (
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 min-w-0">
        <span className="font-body-main text-body-main text-on-surface font-medium">
          {item.menuItem?.name ?? "Item"}
        </span>
      </div>
      <span className="font-price-label text-price-label text-on-surface-variant italic whitespace-nowrap">
        {formatMoney(lineTotal.toString())}
      </span>
    </div>
  );
}

export function BillPaymentPage() {
  const { id: tableId } = useParams<{ id: string }>();
  const { sessionId } = useTableSession();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subtotal = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? "0"), 0);
  const total = subtotal;

  const fetchOrders = async () => {
    if (!sessionId) return;
    try {
      const data = await getOrdersBySession(sessionId);
      setOrders(data);
      setError(null);
    } catch (err) {
      setError("Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" strokeWidth={2} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-100 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-body-main text-body-main text-on-surface">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-150 mx-auto w-full px-6 py-12 flex flex-col gap-12">
      <section className="bg-surface-container rounded-xl p-8 shadow-[0px_10px_30px_rgba(45,36,30,0.05)] flex flex-col gap-6">
        <h2 className="font-menu-item-title text-menu-item-title italic text-on-surface border-b border-surface-variant pb-4">
          Your Check
        </h2>
        <div className="flex flex-col gap-4">
          {orders.flatMap((order) =>
            order.items?.map((item) => (
              <BillItem key={item.id} item={item} />
            ))
          )}
        </div>
        <div className="border-t border-surface-variant pt-6 flex flex-col gap-2">
          <div className="flex justify-between font-body-secondary text-body-secondary text-on-surface-variant/70">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal.toString())}</span>
          </div>
        </div>
        <div className="mt-4 pt-6 border-t border-surface-variant flex justify-between items-baseline">
          <span className="font-menu-item-title text-menu-item-title text-on-surface">Total</span>
          <span className="font-display-lg text-display-lg italic text-primary">
            {formatMoney(total.toString())}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <Alert className="bg-primary-container/20 border-primary-container/30">
          <Info className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
          <div className="flex-1">
            <p className="font-body-main text-body-main text-on-surface font-medium">
              Payment is handled before ordering
            </p>
            <p className="font-body-secondary text-body-secondary text-on-surface-variant">
              You already paid when placing your order. This check is for reference only.
            </p>
          </div>
        </Alert>
        <button
          onClick={() => tableId ? navigate(`/t/${tableId}`) : navigate(-1)}
          className="w-full bg-surface-container text-on-surface border border-outline-variant font-cta-label text-cta-label italic uppercase py-6 rounded-xl shadow-[0px_10px_30px_rgba(45,36,30,0.05)] hover:opacity-90 active:scale-95 transition-all"
        >
          <Banknote className="size-5 inline-block mr-2" strokeWidth={2} aria-hidden="true" />
          Done
        </button>
      </section>
    </main>
  );
}