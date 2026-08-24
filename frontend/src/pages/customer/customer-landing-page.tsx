import { TableSessionProvider } from "@/context/table-session-context";
import { CartProvider } from "@/context/cart-context";
import { MenuPage } from "@/components/customer/menu-page";
import { useParams } from "react-router-dom";

export function CustomerLandingPage() {
  const { id: tableId } = useParams<{ id: string }>();

  if (!tableId) {
    return null;
  }

  return (
    <TableSessionProvider tableId={tableId}>
      <CartProvider>
        <MenuPage />
      </CartProvider>
    </TableSessionProvider>
  );
}