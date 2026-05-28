import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Section, StatusPill, Avatar, MiniBarChart, DataTable, DemoTag, ProgressBar } from "@/components/dashboard/Primitives";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import { ShoppingBag, FileText, ListChecks, Users, TrendingUp, DollarSign, ArrowUpRight, Plus, CheckCircle2, AlertCircle, Clock4 } from "lucide-react";
import { formatFRW } from "@/lib/format";

// ── Demo data ───────────────────────────────────────────────────────
const REVENUE_7D = [
  { label: "Mon", value: 1.8 },
  { label: "Tue", value: 2.4 },
  { label: "Wed", value: 1.6 },
  { label: "Thu", value: 3.1 },
  { label: "Fri", value: 2.9 },
  { label: "Sat", value: 1.2 },
  { label: "Sun", value: 0.6 },
];

type OrderRow = {
  id: string;
  order: string;
  client: string;
  items: string;
  amount: number;
  status: "Quote" | "Confirmed" | "In production" | "Ready" | "Delivered";
};

const RECENT_ORDERS: OrderRow[] = [
  { id: "1", order: "#DPL-2087", client: "Bank of Kigali",        items: "Branded notebooks ×500",    amount: 1_850_000, status: "In production" },
  { id: "2", order: "#DPL-2086", client: "King Faisal Hospital",  items: "Hospital scrubs ×120",      amount: 2_880_000, status: "Confirmed" },
  { id: "3", order: "#DPL-2085", client: "Mara Phones Rwanda",    items: "Roll-up banners ×4",        amount:   380_000, status: "Ready" },
  { id: "4", order: "#DPL-2084", client: "Akagera Aviation",      items: "Pilot polos ×80",           amount: 1_120_000, status: "Delivered" },
  { id: "5", order: "#DPL-2083", client: "Rwanda Tea Authority",  items: "Brochures ×2,000",          amount:   450_000, status: "Quote" },
];

const PIPELINE = [
  { label: "Quotes",        count: 18, accent: "#94A3B8" },
  { label: "Confirmed",     count: 24, accent: "#2645C8" },
  { label: "In production", count: 31, accent: "#00C6FF" },
  { label: "QC",            count:  7, accent: "#A78BFA" },
  { label: "Ready",         count: 12, accent: "#F5C518" },
  { label: "Delivered MTD", count: 84, accent: "#22C55E" },
];

const TOP_CLIENTS = [
  { id: "a", name: "Bank of Kigali",         spend: 6_400_000, share: 92 },
  { id: "b", name: "King Faisal Hospital",   spend: 4_850_000, share: 70 },
  { id: "c", name: "Akagera Aviation",       spend: 3_180_000, share: 46 },
  { id: "d", name: "Rwanda Tea Authority",   spend: 2_240_000, share: 32 },
  { id: "e", name: "Mara Phones Rwanda",     spend: 1_920_000, share: 28 },
];

const ACTIVITY = [
  { id: 1, who: "Jeanne Mukamana", what: "marked",   target: "#DPL-2084 as delivered", when: "8 min ago", tone: "green"  as const, icon: CheckCircle2 },
  { id: 2, who: "Eric Habimana",   what: "uploaded", target: "5 design proofs to #DPL-2087", when: "32 min ago", tone: "cyan"   as const, icon: Plus },
  { id: 3, who: "Adam (Owner)",    what: "approved", target: "quote for Rwanda Tea Authority", when: "1 h ago",  tone: "violet" as const, icon: CheckCircle2 },
  { id: 4, who: "System",          what: "flagged",  target: "Invoice #INV-1190 overdue 4 days", when: "2 h ago",  tone: "red"    as const, icon: AlertCircle },
  { id: 5, who: "Claire Iradukunda", what: "scheduled", target: "site visit for MTN Rwanda", when: "3 h ago",   tone: "amber"  as const, icon: Clock4 },
];

const STATUS_TONE: Record<OrderRow["status"], "grey" | "blue" | "cyan" | "amber" | "green"> = {
  "Quote":         "grey",
  "Confirmed":     "blue",
  "In production": "cyan",
  "Ready":         "amber",
  "Delivered":     "green",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <DashboardLayout title={`Welcome back, ${firstName}.`} subtitle="Here's what's happening at Duplicator Ltd today.">
      {/* KPI strip */}
      <div className="ad-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Revenue (Month)" value={formatFRW(12_450_000)} trend="↑ 18% vs last month" icon={DollarSign} accent="#22C55E" />
        <KpiCard label="Active Orders" value="47" trend="12 due this week" icon={ShoppingBag} accent="#00C6FF" />
        <KpiCard label="Pending Invoices" value={formatFRW(3_280_000)} trend="9 unpaid" icon={FileText} accent="#F5C518" />
        <KpiCard label="Open Tasks" value="23" trend="5 overdue" icon={ListChecks} accent="#F97066" />
        <KpiCard label="New Clients (MTD)" value="14" trend="↑ 22%" icon={Users} accent="#A78BFA" />
        <KpiCard label="Top Service" value="Apparel" trend={`${formatFRW(4_200_000)} this month`} icon={TrendingUp} accent="#00C6FF" />
      </div>

      {/* Row: Revenue chart + Production pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="ad-row">
        <Section
          title="Revenue — last 7 days"
          subtitle="FRW (millions). Hover bars in production build."
          action={<DemoTag />}
        >
          <MiniBarChart
            data={REVENUE_7D}
            accent="#00C6FF"
            formatY={(v) => `${v.toFixed(1)}M`}
          />
        </Section>

        <Section title="Production pipeline" subtitle="Live order counts by stage" action={<DemoTag />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {PIPELINE.map((p) => {
              const max = Math.max(...PIPELINE.map((x) => x.count));
              const pct = (p.count / max) * 100;
              return (
                <div key={p.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: "'Inter', sans-serif" }}>{p.label}</span>
                    <span style={{ fontSize: 12, color: c.textPrimary, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{p.count}</span>
                  </div>
                  <ProgressBar value={pct} accent={p.accent} />
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Row: Recent orders + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="ad-row">
        <Section
          title="Recent orders"
          subtitle="Latest 5 orders across all stages"
          action={<button style={primaryBtn(isDark)}><Plus size={14} /> New order</button>}
          noPad
        >
          <DataTable
            columns={[
              { key: "order",  header: "Order",  render: (r: OrderRow) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.order}</span>, width: "110px" },
              { key: "client", header: "Client", render: (r: OrderRow) => <span style={{ fontWeight: 500 }}>{r.client}</span> },
              { key: "items",  header: "Items",  render: (r: OrderRow) => <span style={{ color: c.textSecondary }}>{r.items}</span> },
              { key: "amount", header: "Amount", render: (r: OrderRow) => <span style={{ fontWeight: 500 }}>{formatFRW(r.amount)}</span>, align: "right" },
              { key: "status", header: "Status", render: (r: OrderRow) => <StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill>, align: "right" },
            ]}
            rows={RECENT_ORDERS}
          />
        </Section>

        <Section title="Activity" subtitle="Across your team today" action={<DemoTag />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {ACTIVITY.map((a) => {
              const Icon = a.icon;
              const tones: Record<string, string> = { green: "#22C55E", cyan: "#00C6FF", violet: "#A78BFA", red: "#EF4444", amber: "#F5C518" };
              const dotColor = tones[a.tone];
              return (
                <div key={a.id} style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `${dotColor}1f`, color: dotColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Icon size={15} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: c.textPrimary, fontFamily: "'Inter', sans-serif", lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 500 }}>{a.who}</span>{" "}
                      <span style={{ color: c.textSecondary }}>{a.what}</span>{" "}
                      <span style={{ color: c.textPrimary }}>{a.target}</span>
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3, fontFamily: "'Inter', sans-serif" }}>
                      {a.when}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Top clients */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <Section
          title="Top clients this month"
          subtitle="By total spend (FRW)"
          action={<a href="/admin/clients" style={ghostLink(c.textSecondary)}>View all <ArrowUpRight size={13} /></a>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {TOP_CLIENTS.map((cl) => (
              <div key={cl.id} style={{ padding: "14px 16px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(38,69,200,0.04)", borderRadius: 11, border: `1px solid ${c.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <Avatar name={cl.name} size={36} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, color: c.textPrimary, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Inter', sans-serif" }}>{cl.name}</div>
                    <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>{formatFRW(cl.spend)} this month</div>
                  </div>
                </div>
                <ProgressBar value={cl.share} accent="#00C6FF" />
              </div>
            ))}
          </div>
        </Section>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .ad-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function primaryBtn(isDark: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: 9,
    background: isDark ? "#fff" : "#2645C8",
    color: isDark ? "#000" : "#fff",
    border: "none", cursor: "pointer",
    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
  };
}

function ghostLink(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    color, textDecoration: "none",
    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
  };
}
