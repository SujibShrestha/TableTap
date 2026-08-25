import { formatMoney } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { ShoppingBag } from "lucide-react";

interface CartButtonProps {
  onClick: () => void;
  className?: string;
}

export function CartButton({ onClick, className }: CartButtonProps) {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className={className}>
      <button
        onClick={onClick}
        className="w-full bg-primary-container text-on-primary-container rounded-full py-4 px-6 flex justify-between items-center shadow-[0px_10px_30px_rgba(160,56,24,0.3)] hover:opacity-95 active:scale-95 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="size-5" strokeWidth={2} aria-hidden="true" />
          <span className="font-cta-label text-cta-label italic uppercase">View Order</span>
        </div>
        <span className="text-price-label font-medium italic">
          {itemCount} Item{itemCount !== 1 ? "s" : ""} • {formatMoney(total)}
        </span>
      </button>
    </div>
  );
}