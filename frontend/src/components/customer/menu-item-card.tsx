import { formatMoney } from "@/lib/format";
import type { MenuItem } from "@/types";

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAddToCart: () => void;
  onUpdateQuantity: (delta: number) => void;
}

export function MenuItemCard({ item, quantity, onAddToCart, onUpdateQuantity }: MenuItemCardProps) {
  return (
    <article className="rounded-xl bg-[#F7F2EB] p-4 md:p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-menu-item-title leading-[1.4] font-bold text-primary mb-1 truncate italic">
            {item.name}
          </h2>
          {item.description && (
            <p className="text-body-main text-on-surface-variant/70 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-container-high flex-shrink-0">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
              <svg className="size-8 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-end mt-2">
        <span className="text-price-label leading-[1.4] font-bold text-primary italic">
          {formatMoney(item.price)}
        </span>
        {quantity > 0 ? (
          <div className="flex items-center bg-surface-container-low rounded-full border border-outline-variant p-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(-1)}
              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-variant rounded-full transition-colors"
              aria-label="Decrease quantity"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="font-body-main text-body-main text-on-surface w-6 text-center font-medium">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(1)}
              className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-variant rounded-full transition-colors"
              aria-label="Increase quantity"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAddToCart}
            className="px-4 py-2 bg-transparent border border-primary text-primary font-cta-label text-cta-label italic rounded-full hover:bg-primary-container hover:text-on-primary-container hover:border-primary-container transition-colors uppercase"
          >
            Add
          </button>
        )}
      </div>
    </article>
  );
}