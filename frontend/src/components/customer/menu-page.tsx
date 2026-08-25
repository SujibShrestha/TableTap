import { useEffect, useState, useMemo } from "react";
import { getMenuItems, getCategories } from "@/api/api";
import { getErrorMessage } from "@/api/api";
import type { MenuCategory, MenuItem } from "@/types";
import { Alert } from "@/components/ui/alert";
import { CategoryTabs } from "./category-tabs";
import { MenuItemCard } from "./menu-item-card";
import { useCart } from "@/context/cart-context";
import { Loader2 } from "lucide-react";

export function MenuPage() {
  const { items: cartItems, addItem, updateQuantity } = useCart();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getCategories(), getMenuItems()])
      .then(([categoriesResult, itemsResult]) => {
        if (!cancelled) {
          setCategories(categoriesResult);
          setMenuItems(itemsResult);
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

  const itemsInCategory = useMemo(() => {
    if (activeCategoryId === "all") {
      return menuItems.filter((item) => item.isAvailable);
    }
    return menuItems.filter((item) => item.isAvailable && item.categoryId === activeCategoryId);
  }, [menuItems, activeCategoryId]);

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
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" strokeWidth={2} aria-hidden="true" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center px-6">
        <Alert className="w-full max-w-md">{error}</Alert>
      </div>
    );
  }

  return (
    <>
      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onChange={setActiveCategoryId}
      />

      {(error && <div className="max-w-7xl mx-auto px-6 pt-4"><Alert>{error}</Alert></div>)}

      <main className="px-6 pt-4 pb-12 flex flex-col gap-4">
        {itemsInCategory.length === 0 ? (
          <section className="px-6 pt-4 pb-12 flex flex-col gap-6">
            <div className="rounded-xl bg-surface-container p-12 text-center shadow-card">
              <p className="text-body-secondary text-on-surface-variant">No available items in this category.</p>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            {itemsInCategory.map((item) => {
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
      </main>
    </>
  );
}