import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import AuthShell, { Field, SubmitButton, ErrorBanner } from "@/components/AuthShell";
import { useAuth } from "@/context/AuthContext";
function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === "object" && "error" in data) {
      const m = (data as { error?: unknown }).error;
      if (typeof m === "string") return m;
    }
  }
  return fallback;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login({ email, password });
      const target = roleHome(user.role);
      setLocation(target);
    } catch (err) {
      setError(errorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to manage your orders, invoices, and team workspace."
      footer={
        <>
          New to Duplicator?{" "}
          <Link
            href="/signup"
            style={{ color: "#00C6FF", textDecoration: "none", fontWeight: 500 }}
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        {error && <ErrorBanner message={error} />}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}

export function roleHome(role: string): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "client":
      return "/portal";
    default:
      return "/";
  }
}
