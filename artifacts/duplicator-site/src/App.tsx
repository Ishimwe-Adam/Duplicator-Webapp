import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import AdminDashboard from "@/pages/dashboards/AdminDashboard";
import StaffDashboard from "@/pages/dashboards/StaffDashboard";
import ClientDashboard from "@/pages/dashboards/ClientDashboard";
import OrdersListPage from "@/pages/orders/OrdersListPage";
import OrderDetailPage from "@/pages/orders/OrderDetailPage";
import InvoicesListPage from "@/pages/invoices/InvoicesListPage";
import InvoiceDetailPage from "@/pages/invoices/InvoiceDetailPage";
import SalesQuotationPage from "@/pages/quotations/SalesQuotationPage";
import JobCardPage from "@/pages/job-card/JobCardPage";
import WorkspaceModulePage from "@/pages/workspace/WorkspaceModulePage";
import TasksKanbanPage from "@/pages/tasks/TasksKanbanPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/admin">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/tasks">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <TasksKanbanPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/employees">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-employees" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-clients" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/messages">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-messages" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/calendar">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-calendar" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/documents">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-documents" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/gallery">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-gallery" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/announcements">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-announcements" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <WorkspaceModulePage module="admin-settings" />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <OrdersListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/orders/:id">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <OrderDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/invoices">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <SalesQuotationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/job-card">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <JobCardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/invoices/:id">
        <ProtectedRoute roles={["super_admin", "admin"]}>
          <SalesQuotationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/staff">
        <ProtectedRoute roles={["staff"]}>
          <StaffDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/orders">
        <ProtectedRoute roles={["staff"]}>
          <OrdersListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/orders/:id">
        <ProtectedRoute roles={["staff"]}>
          <OrderDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/tasks">
        <ProtectedRoute roles={["staff"]}>
          <TasksKanbanPage />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/gallery">
        <ProtectedRoute roles={["staff"]}>
          <WorkspaceModulePage module="staff-gallery" />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/messages">
        <ProtectedRoute roles={["staff"]}>
          <WorkspaceModulePage module="staff-messages" />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/invoices">
        <ProtectedRoute roles={["staff"]}>
          <SalesQuotationPage />
        </ProtectedRoute>
      </Route>
      <Route path="/staff/job-card">
        <ProtectedRoute roles={["staff"]}>
          <JobCardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/portal">
        <ProtectedRoute roles={["client"]}>
          <ClientDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/orders">
        <ProtectedRoute roles={["client"]}>
          <OrdersListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/orders/:id">
        <ProtectedRoute roles={["client"]}>
          <OrderDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/invoices">
        <ProtectedRoute roles={["client"]}>
          <InvoicesListPage />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/invoices/:id">
        <ProtectedRoute roles={["client"]}>
          <InvoiceDetailPage />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/profile">
        <ProtectedRoute roles={["client"]}>
          <WorkspaceModulePage module="portal-profile" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/gallery">
        <ProtectedRoute roles={["client"]}>
          <WorkspaceModulePage module="portal-gallery" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/recommendations">
        <ProtectedRoute roles={["client"]}>
          <WorkspaceModulePage module="portal-recommendations" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/messages">
        <ProtectedRoute roles={["client"]}>
          <WorkspaceModulePage module="portal-messages" />
        </ProtectedRoute>
      </Route>
      <Route path="/portal/quotes">
        <ProtectedRoute roles={["client"]}>
          <SalesQuotationPage mode="client" />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
