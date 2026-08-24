import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getMenuItems, getCategories } from "@/api/api";
import { getErrorMessage } from "@/api/api";
import type { MenuCategory, MenuItem } from "@/types";
import { Alert } from "@/components/ui/alert";
import { CategoryTabs } from "./category-tabs";
import { MenuItemCard } from "./menu-item-card";
import { CartButton } from "./cart-button";
import { CartDrawer } from "./cart-drawer";
import { useCart } from "@/context/cart-context";
import { useTableSession } from "@/context/table-session-context";

export function MenuPage() {
  const { id: tableId } = useParams<{ id: string }>();
  const { table } = useTableSession();
  const { items: cartItems, addItem, updateQuantity } = useCart();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!tableId) return;

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
  }, [tableId]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <svg className="size-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Alert className="w-full max-w-md">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/40 shadow-card">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
          <img src="/logo.png" alt="TableTap Logo" className="size-10 rounded-full" />
          <h1 className="text-headline-lg-mobile font-bold text-primary text-center truncate flex-1">
            TableTap
          </h1>
          <span className="font-body-main text-body-main text-primary whitespace-nowrap">
            Table {table?.tableNumber ?? ""}
          </span>
        </div>
      </header>

      <CategoryTabs
        categories={categories}
        activeCategoryId={activeCategoryId}
        onChange={setActiveCategoryId}
      />

      {(error && <div className="max-w-7xl mx-auto px-6 pt-4"><Alert>{error}</Alert></div>)}

      <main className="max-w-7xl mx-auto w-full md:px-0 pb-40">
        {itemsInCategory.length === 0 ? (
          <section className="px-6 pt-4 pb-12 flex flex-col gap-6">
            <div className="rounded-xl bg-surface-container p-12 text-center shadow-card">
              <p className="text-body-secondary text-on-surface-variant">No available items in this category.</p>
            </div>
          </section>
        ) : (
          <section className="px-6 pt-4 pb-12 flex flex-col gap-4">
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

      <CartButton
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-[88px] md:hidden left-0 w-full px-6 z-40 max-w-md mx-auto"
      />

      <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}