import { formatMoney } from "@/lib/format";
import { useCart } from "@/context/cart-context";

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
          <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span className="font-cta-label text-cta-label italic uppercase">View Order</span>
        </div>
        <span className="text-price-label font-medium italic">
          {itemCount} Item{itemCount !== 1 ? "s" : ""} • {formatMoney(total)}
        </span>
      </button>
    </div>
  );
}