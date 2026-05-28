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
      <Route path="/staff">
        <ProtectedRoute roles={["staff"]}>
          <StaffDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/portal">
        <ProtectedRoute roles={["client"]}>
          <ClientDashboard />
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
