import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard, PhaseBanner } from "@/components/DashboardKpi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ShoppingBag, FileText, ListChecks, Users, TrendingUp, DollarSign } from "lucide-react";
import { formatFRW } from "@/lib/format";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { c } = useTheme();
  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <DashboardLayout title={`Welcome back, ${firstName}.`} subtitle="Here's what's happening at Duplicator Ltd today.">
      <PhaseBanner />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 32 }}>
        <KpiCard label="Revenue (Month)" value={formatFRW(12_450_000)} trend="↑ 18% vs last month" icon={DollarSign} accent="#22C55E" />
        <KpiCard label="Active Orders" value="47" trend="12 due this week" icon={ShoppingBag} accent="#00C6FF" />
        <KpiCard label="Pending Invoices" value={formatFRW(3_280_000)} trend="9 unpaid" icon={FileText} accent="#F5C518" />
        <KpiCard label="Open Tasks" value="23" trend="5 overdue" icon={ListChecks} accent="#F97066" />
        <KpiCard label="New Clients (MTD)" value="14" trend="↑ 22%" icon={Users} accent="#A78BFA" />
        <KpiCard label="Top Service" value="Branded Apparel" trend={`${formatFRW(4_200_000)} this month`} icon={TrendingUp} accent="#00C6FF" />
      </div>

      <div
        style={{
          padding: 28,
          borderRadius: 16,
          background: c.bgCard,
          border: `1px solid ${c.border}`,
          backdropFilter: "blur(16px)",
        }}
      >
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: c.textPrimary, marginBottom: 8, fontWeight: 500 }}>
          Quick actions
        </h2>
        <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 18, fontFamily: "'Inter', sans-serif" }}>
          The full management modules (invoicing, orders, CRM, analytics) come online in Phase 2 onward.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["New Invoice", "New Order", "Add Client", "Post Announcement"].map((action) => (
            <button
              key={action}
              disabled
              style={{
                padding: "10px 16px",
                borderRadius: 9,
                border: `1px solid ${c.border}`,
                background: "transparent",
                color: c.textMuted,
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                cursor: "not-allowed",
                opacity: 0.6,
              }}
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
