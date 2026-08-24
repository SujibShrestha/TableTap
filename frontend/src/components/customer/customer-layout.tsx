"use client";

import { Outlet, useParams } from "react-router-dom";
import { TableSessionProvider } from "@/context/table-session-context";
import { CartProvider } from "@/context/cart-context";
import { useTableSession } from "@/context/table-session-context";
import { CustomerFooterNav } from "./customer-footer-nav";
import { CartButton } from "./cart-button";
import { CartDrawer } from "./cart-drawer";
import { useState } from "react";

function CustomerLayoutContent() {
  const { table } = useTableSession();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
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

      <main className="flex-1 max-w-7xl mx-auto w-full md:px-0 pb-32">
        <Outlet />
      </main>

      <CartButton
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-22 md:hidden left-0 w-full px-6 z-50 max-w-md mx-auto"
      />

      <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <CustomerFooterNav />
    </div>
  );
}

export function CustomerLayout() {
  const { id: tableId } = useParams<{ id: string }>();

  if (!tableId) {
    return null;
  }

  return (
    <TableSessionProvider tableId={tableId}>
      <CartProvider>
        <CustomerLayoutContent />
      </CartProvider>
    </TableSessionProvider>
  );
}