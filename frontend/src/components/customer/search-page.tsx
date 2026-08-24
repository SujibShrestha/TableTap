
import { useEffect, useState, useMemo } from "react";
import { getMenuItems, getCategories } from "@/api/api";
import { getErrorMessage } from "@/api/api";
import { useCart } from "@/context/cart-context";
import { CategoryTabs } from "./category-tabs";
import { MenuItemCard } from "./menu-item-card";
import { Search, X, AlertCircle } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/types";

export function SearchPage() {
  const { items: cartItems, addItem, updateQuantity } = useCart();

  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getMenuItems()])
      .then(([categoriesResult, itemsResult]) => {
        if (!cancelled) {
          setCategories(categoriesResult);
          setAllItems(itemsResult);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to load menu"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || activeCategory === null || item.categoryId === activeCategory;
      const matchesQuery =
        query === "" ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery && item.isAvailable;
    });
  }, [allItems, activeCategory, query]);

  const categoryOptions = useMemo(() => [
    { id: "all", name: "All", createdAt: "", updatedAt: "" },
    ...categories,
  ], [categories]);

  const handleAddToCart = (menuItem: MenuItem) => {
    addItem(menuItem);
  };

  const handleUpdateQuantity = (menuItemId: string, delta: number) => {
    const item = cartItems.find((i) => i.menuItemId === menuItemId);
    const newQuantity = (item?.quantity ?? 0) + delta;
    updateQuantity(menuItemId, newQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-100 flex items-center justify-center">
        <div className="mx-auto size-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-100 flex items-center justify-center px-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto size-12 text-destructive mb-4" strokeWidth={2} />
          <p className="font-body-main text-body-main text-on-surface">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-headline-lg font-bold italic text-primary">Search Menu</h2>
        <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 italic mt-1">
          Find your favorite dishes
        </p>
      </div>

      <div className="px-6 mb-6">
        <label htmlFor="search-input" className="sr-only">Search menu</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-on-surface-variant/50" strokeWidth={2} aria-hidden="true" />
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes, ingredients..."
            className="w-full pl-12 pr-12 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface placeholder-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-body-main"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors"
              aria-label="Clear search"
            >
              <X className="size-5" strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <CategoryTabs
        categories={categoryOptions}
        activeCategoryId={activeCategory}
        onChange={(catId) => setActiveCategory(catId ?? "all")}
      />

      {query && (
        <div className="px-6 mb-4">
          <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 italic">
            Showing {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <section className="px-6 pt-4 pb-12 flex flex-col gap-6">
          <div className="rounded-xl bg-surface-container p-12 text-center shadow-card">
            <Search className="mx-auto size-16 text-on-surface-variant/30 mb-4" strokeWidth={1.5} aria-hidden="true" />
            <h3 className="text-headline-lg-mobile text-on-surface mb-2">No results found</h3>
            <p className="font-body-secondary text-body-secondary text-on-surface-variant/70 italic">
              {query ? `Try a different search term or browse all categories` : "No available items in this category"}
            </p>
          </div>
        </section>
      ) : (
        <section className="px-6 pt-4 pb-12 flex flex-col gap-4">
          {filteredItems.map((item) => {
            const cartItem = cartItems.find((c) => c.menuItemId === item.id);
            const quantity = cartItem?.quantity ?? 0;
            return (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={quantity}
                onAddToCart={() => handleAddToCart(item)}
                onUpdateQuantity={(delta) => handleUpdateQuantity(item.id, delta)}
              />
            );
          })}
        </section>
      )}
    </>
  );
}