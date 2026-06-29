import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import AuthShell, { Field, SubmitButton, ErrorBanner } from "@/components/AuthShell";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/auth";
import { roleHome } from "./LoginPage";
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

export default function SignupPage() {
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const { c } = useTheme();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        name,
        email,
        password,
        ...({ role: role as any } as any),
        companyName: companyName || undefined,
        phone: phone || undefined,
        inviteCode: inviteCode || undefined,
      });
      setLocation(roleHome(user.role));
    } catch (err) {
      setError(errorMessage(err, "Signup failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account."
      subtitle="Place orders, request quotes, and track invoices — all in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "#00C6FF", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in
          </Link>
        </>
      }
    >
      {/* ── Google Sign-Up ──────────────────────────────────────────── */}
      <GoogleSignInButton
        onCredential={onGoogleCredential}
        text="signup_with"
        theme="outline"
      />

      <form onSubmit={onSubmit}>
        {error && <ErrorBanner message={error} />}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ display: "block", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: c.textMuted, marginBottom: 7 }}>Account Type</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              color: c.textPrimary,
              background: c.inputBg,
              border: `1px solid ${c.inputBorder}`,
              borderRadius: 10,
              outline: "none",
            }}
          >
            <option value="client">Client (Standard)</option>
            <option value="staff">Staff (Team)</option>
            <option value="manager">Manager (Admin)</option>
            <option value="super_admin">Owner (Full Access)</option>
          </select>
        </label>
        <Field label="Full name" value={name} onChange={setName} placeholder="Your name" autoComplete="name" required />
        <Field label="Company (optional)" value={companyName} onChange={setCompanyName} placeholder="Acme Co." autoComplete="organization" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoComplete="email" required />
        <Field label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="+250 7xx xxx xxx" autoComplete="tel" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoComplete="new-password" required />
        <Field label="Invite Code (required for team accounts)" value={inviteCode} onChange={setInviteCode} placeholder="8-character code" />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}
