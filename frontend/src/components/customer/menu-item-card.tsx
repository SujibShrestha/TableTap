import { formatMoney } from "@/lib/format";
import type { MenuItem } from "@/types";
import { Image, Minus, Plus } from "lucide-react";

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
              <Image className="size-8 text-muted-foreground/50" strokeWidth={2} aria-hidden="true" />
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
              <Minus className="size-4" strokeWidth={2} aria-hidden="true" />
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
              <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
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