import { TableSessionProvider } from "@/context/table-session-context";
import { CartProvider } from "@/context/cart-context";
import { CustomerFooterNav } from "./customer-footer-nav";
import { useParams } from "react-router-dom";
import type { ReactNode } from "react";

interface CustomerPageWrapperProps {
  children: ReactNode;
}

export function CustomerPageWrapper({ children }: CustomerPageWrapperProps) {
  const { id: tableId } = useParams<{ id: string }>();

  if (!tableId) {
    return null;
  }

  return (
    <TableSessionProvider tableId={tableId}>
      <CartProvider>
        {children}
        <CustomerFooterNav />
      </CartProvider>
    </TableSessionProvider>
  );
}