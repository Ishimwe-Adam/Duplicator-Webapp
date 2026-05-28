import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard, PhaseBanner } from "@/components/DashboardKpi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ShoppingBag, FileText, Clock, Sparkles } from "lucide-react";
import { formatFRW } from "@/lib/format";
import { Link } from "wouter";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  if (!user) return null;

  const greeting = user.companyName ? user.companyName : user.name;

  return (
    <DashboardLayout title={`Welcome, ${greeting}.`} subtitle="Track your orders, invoices, and quote requests.">
      <PhaseBanner />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 32 }}>
        <KpiCard label="Active Orders" value="0" trend="Place your first order" icon={ShoppingBag} accent="#00C6FF" />
        <KpiCard label="Pending Invoices" value={formatFRW(0)} trend="Nothing due" icon={FileText} accent="#F5C518" />
        <KpiCard label="Total Spent (YTD)" value={formatFRW(0)} trend="Start in 2026" icon={Sparkles} accent="#22C55E" />
        <KpiCard label="Last Order" value="—" trend="No orders yet" icon={Clock} accent="#A78BFA" />
      </div>

      <div
        style={{
          padding: 28,
          borderRadius: 16,
          background: isDark
            ? "linear-gradient(135deg, rgba(38,69,200,0.15), rgba(0,198,255,0.08))"
            : "linear-gradient(135deg, rgba(38,69,200,0.06), rgba(0,198,255,0.04))",
          border: `1px solid ${c.border}`,
          backdropFilter: "blur(16px)",
          marginBottom: 18,
        }}
      >
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: c.textPrimary, marginBottom: 8, fontWeight: 500, letterSpacing: "-0.02em" }}>
          Ready to start?
        </h2>
        <p style={{ fontSize: 14, color: c.textSecondary, marginBottom: 18, fontFamily: "'Inter', sans-serif", lineHeight: 1.6, maxWidth: 560 }}>
          Browse our full catalogue — from business cards to branded apparel and large format prints — all priced in FRW.
        </p>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            padding: "11px 22px",
            background: "linear-gradient(135deg, #2645C8, #00C6FF)",
            color: "#fff",
            borderRadius: 9,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(38,69,200,.3)",
          }}
        >
          Browse catalogue →
        </Link>
      </div>
    </DashboardLayout>
  );
}
