import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthShell, { Field, SubmitButton, ErrorBanner } from "@/components/AuthShell";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";

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

type DemoAccount = {
  label: string;
  role: string;
  email: string;
  password: string;
  desc: string;
  accent: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: "Owner",   role: "super_admin", email: "admin@duplicator.rw",   password: "Admin@2026",   desc: "Full admin panel",        accent: "#A78BFA" },
  { label: "Manager", role: "manager",     email: "manager@duplicator.rw", password: "Manager@2026", desc: "Admin (limited)",         accent: "#2645C8" },
  { label: "Staff",   role: "staff",       email: "staff@duplicator.rw",   password: "Staff@2026",   desc: "Tasks & production view", accent: "#00C6FF" },
  { label: "Client",  role: "client",      email: "client@example.com",    password: "Client@2026",  desc: "Customer portal",         accent: "#22C55E" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { c, isDark } = useTheme();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function doLogin(e: string, p: string) {
    setError(null);
    const user = await login({ email: e, password: p });
    setLocation(roleHome(user.role));
  }

  async function onGoogleCredential(credential: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });
      const data = await res.json() as { user?: { role: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Google sign-in failed");
      setLocation(roleHome(data.user!.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await doLogin(email, password);
    } catch (err) {
      setError(errorMessage(err, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function onDemoClick(acc: DemoAccount) {
    setEmail(acc.email);
    setPassword(acc.password);
    setDemoLoading(acc.email);
    try {
      await doLogin(acc.email, acc.password);
    } catch (err) {
      setError(errorMessage(err, "Demo login failed."));
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to manage your orders, invoices, and team workspace."
      footer={
        <>
          New to Duplicator?{" "}
          <Link href="/signup" style={{ color: "#00C6FF", textDecoration: "none", fontWeight: 500 }}>
            Create an account
          </Link>
        </>
      }
    >
      {/* ── Google Sign-In ──────────────────────────────────────────── */}
      <GoogleSignInButton
        onCredential={onGoogleCredential}
        text="signin_with"
        theme={isDark ? "filled_black" : "outline"}
      />

      {/* ── Demo accounts panel — DEV BUILDS ONLY ──────────────────── */}
      {import.meta.env.DEV && (
      <div
        style={{
          marginBottom: 22,
          padding: "14px 16px",
          borderRadius: 12,
          background: isDark ? "rgba(0,198,255,0.05)" : "rgba(38,69,200,0.05)",
          border: `1px solid ${isDark ? "rgba(0,198,255,0.18)" : "rgba(38,69,200,0.18)"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: c.textPrimary, fontWeight: 500 }}>
              ⚡ Try any role instantly
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: c.textSecondary, marginTop: 2 }}>
              One click signs you in with a seeded demo account.
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {DEMO_ACCOUNTS.map((acc) => {
            const isLoading = demoLoading === acc.email;
            return (
              <button
                key={acc.email}
                onClick={() => onDemoClick(acc)}
                disabled={demoLoading !== null}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 4,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.72)",
                  border: `1px solid ${isLoading ? acc.accent : (isDark ? "rgba(255,255,255,0.1)" : "rgba(38,69,200,0.12)" )}`,
                  color: c.textPrimary,
                  cursor: demoLoading !== null ? "wait" : "pointer",
                  textAlign: "left",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all .15s",
                  opacity: demoLoading !== null && !isLoading ? 0.4 : 1,
                }}
                onMouseEnter={(e) => {
                  if (demoLoading === null) {
                    e.currentTarget.style.borderColor = acc.accent;
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(38,69,200,0.07)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(38,69,200,0.12)";
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.72)";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: acc.accent, boxShadow: `0 0 8px ${acc.accent}` }} />
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{isLoading ? "Signing in…" : acc.label}</span>
                </div>
                <span style={{ fontSize: 10.5, color: c.textSecondary, letterSpacing: "0.01em" }}>{acc.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
        <div style={{ flex: 1, height: 1, background: c.border }} />
        <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", letterSpacing: "0.12em" }}>or</span>
        <div style={{ flex: 1, height: 1, background: c.border }} />
      </div>

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
    case "manager":
      return "/admin";
    case "staff":
      return "/staff";
    case "client":
      return "/portal";
    default:
      return "/";
  }
}
