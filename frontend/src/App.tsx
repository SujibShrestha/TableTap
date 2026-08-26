import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { AdminRoute, ProtectedRoute, HomeRedirect, RoleRoute } from "@/components/layout/route-guards";
import { LoginPage } from "@/pages/login/login-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { UsersPage } from "@/pages/users/users-page";
import { UserFormPage } from "@/pages/users/user-form-page";
import { TablesPage } from "@/pages/tables/tables-page";
import { MenuPage } from "@/pages/menu/menu-page";
import { CustomerLandingPage } from "@/pages/customer/customer-landing-page";
import { SearchPage } from "@/components/customer/search-page";
import { OrdersPage } from "@/components/customer/orders-page";
import { BillPaymentPage } from "@/components/customer/bill-payment-page";
import { CustomerLayout } from "@/components/customer/customer-layout";
import { KitchenBoard } from "@/pages/kitchen/kitchen-board";
import { WaiterBoard } from "@/pages/waiter/waiter-board";
import { StaffOrdersPage } from "@/pages/orders/orders-page";
import { BillsPage } from "@/pages/bills/bills-page";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" theme="system" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<CustomerLayout />}>
            <Route path="/t/:id" element={<CustomerLandingPage />} />
            <Route path="/t/:id/search" element={<SearchPage />} />
            <Route path="/t/:id/orders" element={<OrdersPage />} />
            <Route path="/t/:id/bill" element={<BillPaymentPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<HomeRedirect />} />
              <Route element={<AdminRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/new" element={<UserFormPage />} />
                <Route path="/users/:id/edit" element={<UserFormPage />} />
                <Route path="/tables" element={<TablesPage />} />
                <Route path="/menu" element={<MenuPage />} />
              </Route>

              <Route element={<RoleRoute allowed={["KITCHEN"]} />}>
                <Route path="/kitchen" element={<KitchenBoard />} />
              </Route>
              <Route element={<RoleRoute allowed={["WAITER"]} />}>
                <Route path="/waiter" element={<WaiterBoard />} />
              </Route>
              <Route path="/orders" element={<StaffOrdersPage />} />
              <Route path="/bills" element={<BillsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
