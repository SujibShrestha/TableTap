import { cn } from "@/lib/utils";
import type { MenuCategory } from "@/types";

interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onChange: (categoryId: string | null) => void;
  showAll?: boolean;
  allLabel?: string;
}

export function CategoryTabs({
  categories,
  activeCategoryId,
  onChange,
  showAll = true,
  allLabel = "All",
}: CategoryTabsProps) {
  return (
    <nav
      className="sticky top-16 z-30 pt-4 pb-4 bg-background px-6"
      style={{ WebkitOverflowScrolling: "touch" }}
      aria-label="Menu categories"
    >
      <ul className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {showAll && (
          <li>
            <button
              type="button"
              onClick={() => onChange("all")}
              className={cn(
                "px-6 py-2 rounded-full font-bold text-primary whitespace-nowrap transition-colors shadow-sm",
                activeCategoryId === "all"
                  ? "bg-primary-container text-on-primary-container"
                  : "border border-outline bg-transparent text-on-surface-variant hover:bg-surface-container-low"
              )}
              aria-pressed={activeCategoryId === "all"}
            >
              {allLabel}
            </button>
          </li>
        )}
        {categories.map((category) => (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onChange(category.id)}
              className={cn(
                "px-6 py-2 font-bold rounded-full font-cta-label text-cta-label italic whitespace-nowrap transition-colors shadow-sm",
                activeCategoryId === category.id
                  ? "bg-primary-container text-on-primary-container"
                  : "border border-outline bg-transparent text-on-surface-variant hover:bg-surface-container-low"
              )}
              aria-pressed={activeCategoryId === category.id}
            >
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}