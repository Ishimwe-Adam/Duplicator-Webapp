import type { ReactNode } from "react";
import { useEffect } from "react";
import { Redirect } from "wouter";
import { useAuth, type Role } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { c } = useTheme();

  useEffect(() => {}, []);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Inter', sans-serif",
          color: c.textSecondary,
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;

  if (roles && !roles.includes(user.role)) {
    // Send user to their proper home if they hit the wrong dashboard
    const home =
      user.role === "client"
        ? "/portal"
        : user.role === "staff"
        ? "/staff"
        : "/admin";
    return <Redirect to={home} />;
  }

  return <>{children}</>;
}
