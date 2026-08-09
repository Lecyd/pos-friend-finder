import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import SalesPage from "@/pages/SalesPage";
import SalesListPage from "@/pages/SalesListPage";
import StockEntryPage from "@/pages/StockEntryPage";
import ExpensesPage from "@/pages/ExpensesPage";
import CreditNotesPage from "@/pages/CreditNotesPage";
import DayClosurePage from "@/pages/DayClosurePage";
import PendingInvoicesPage from "@/pages/PendingInvoicesPage";
import CancelSalesPage from "@/pages/CancelSalesPage";
import ValidateStockPage from "@/pages/ValidateStockPage";
import StatsPage from "@/pages/StatsPage";
import SettingsPage from "@/pages/SettingsPage";
import UsersPage from "@/pages/UsersPage";
import CategoriesPage from "@/pages/CategoriesPage";
import ProductsPage from "@/pages/ProductsPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminExpensesPage from "@/pages/AdminExpensesPage";
import EmployeesPage from "@/pages/EmployeesPage";
import EmployeeRolesPage from "@/pages/EmployeeRolesPage";
import BilanPage from "@/pages/BilanPage";
import SuppliersPage from "@/pages/SuppliersPage";
import ExpenseTypesPage from "@/pages/ExpenseTypesPage";
import PrinterSettingsPage from "@/pages/PrinterSettingsPage";
import NotFound from "@/pages/NotFound";

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard/stats" replace />;
  if (user.role === 'manager') return <Navigate to="/dashboard/sales-list" replace />;
  return <Navigate to="/dashboard/sales" replace />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<RoleBasedRedirect />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="sales-list" element={<SalesListPage />} />
              <Route path="stock-entry" element={<StockEntryPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="credit-notes" element={<CreditNotesPage />} />
              <Route path="day-closure" element={<DayClosurePage />} />
              <Route path="pending-invoices" element={<PendingInvoicesPage />} />

              <Route path="cancel-sales" element={<CancelSalesPage />} />
              <Route path="validate-stock" element={<ValidateStockPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin-expenses" element={<AdminExpensesPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="employee-roles" element={<EmployeeRolesPage />} />
              <Route path="bilan" element={<BilanPage />} />
              <Route path="suppliers" element={<SuppliersPage />} />
              <Route path="expense-types" element={<ExpenseTypesPage />} />
              <Route path="printers" element={<PrinterSettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
