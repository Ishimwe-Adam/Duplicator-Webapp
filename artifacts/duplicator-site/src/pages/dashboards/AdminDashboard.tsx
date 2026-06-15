import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Section, StatusPill, Avatar, MiniBarChart, DataTable, ProgressBar } from "@/components/dashboard/Primitives";
import SharedWorkspaceBoard from "@/components/SharedWorkspaceBoard";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import { ShoppingBag, FileText, Users, TrendingUp, DollarSign, ArrowUpRight, AlertCircle, Loader2 } from "lucide-react";
import { formatFRW } from "@/lib/format";
import { useGetAnalyticsSummary, getGetAnalyticsSummaryQueryKey } from "@/lib/api-stub";
import type { AnalyticsSummary, OrderStatus } from "@/lib/api-stub";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/orders";
import { Link } from "wouter";

const STATUS_ACCENT: Record<OrderStatus, string> = {
  draft: "#94A3B8",
  quoted: "#94A3B8",
  approved: "#2645C8",
  in_production: "#00C6FF",
  ready: "#F5C518",
  delivered: "#22C55E",
  cancelled: "#EF4444",
};

function pctDelta(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? "↑ new revenue" : "no change";
  const d = ((curr - prev) / prev) * 100;
  const sign = d >= 0 ? "↑" : "↓";
  return `${sign} ${Math.abs(d).toFixed(0)}% vs last month`;
}

function shortMonth(ym: string): string {
  // ym like "2026-05"
  const [y, m] = ym.split("-");
  const d = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  return d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const { data, isLoading, isError, refetch } = useGetAnalyticsSummary({
    query: {
      queryKey: getGetAnalyticsSummaryQueryKey(),
      refetchInterval: 60_000,
    },
    request: { credentials: "include" },
  });

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <DashboardLayout title={`Welcome back, ${firstName}.`} subtitle="Live snapshot of Duplicator Ltd operations.">
      {isLoading && !data ? (
        <LoadingState c={c} />
      ) : isError || !data ? (
        <ErrorState c={c} onRetry={() => refetch()} />
      ) : (
        <Body data={data as AnalyticsSummary} c={c} isDark={isDark} />
      )}
    </DashboardLayout>
  );
}

function LoadingState({ c }: { c: ReturnType<typeof useTheme>["c"] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: c.textSecondary, gap: 10, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      Loading analytics…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorState({ c, onRetry }: { c: ReturnType<typeof useTheme>["c"]; onRetry: () => void }) {
  return (
    <div style={{ padding: 24, border: `1px solid ${c.border}`, borderRadius: 12, color: c.textSecondary, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>
      Couldn't load analytics.{" "}
      <button onClick={onRetry} style={{ background: "transparent", border: "none", color: "#00C6FF", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>
        Try again
      </button>
    </div>
  );
}

function Body({ data, c, isDark }: { data: AnalyticsSummary; c: ReturnType<typeof useTheme>["c"]; isDark: boolean }) {
  const revenueChartData = data.revenue.last12Months.map((m) => ({
    label: shortMonth(m.month),
    value: m.amount / 1_000_000, // FRW → millions
  }));
  const topClientMax = data.clients.top.reduce((max, t) => Math.max(max, t.revenue), 0);

  return (
    <>
      {/* KPI strip */}
      <div className="ad-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard
          label="Revenue (this month)"
          value={formatFRW(data.revenue.thisMonth)}
          trend={pctDelta(data.revenue.thisMonth, data.revenue.lastMonth)}
          icon={DollarSign}
          accent="#22C55E"
        />
        <KpiCard
          label="Active orders"
          value={String(data.orders.active)}
          trend={`${data.orders.dueSoon} active in last 14 days`}
          icon={ShoppingBag}
          accent="#00C6FF"
        />
        <KpiCard
          label="Outstanding receivables"
          value={formatFRW(data.receivables.outstandingAmount)}
          trend={data.receivables.overdueCount > 0 ? `${data.receivables.overdueCount} overdue` : "All current"}
          icon={FileText}
          accent={data.receivables.overdueCount > 0 ? "#F97066" : "#F5C518"}
        />
        <KpiCard
          label="Clients"
          value={String(data.clients.total)}
          trend={`+${data.clients.newThisMonth} this month`}
          icon={Users}
          accent="#A78BFA"
        />
        <KpiCard
          label="Last month revenue"
          value={formatFRW(data.revenue.lastMonth)}
          trend="Prior calendar month"
          icon={TrendingUp}
          accent="#00C6FF"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <SharedWorkspaceBoard role="admin" />
      </div>

      {/* Row: Revenue chart + Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="ad-row">
        <Section title="Revenue — last 12 months" subtitle="FRW (millions) by paid date">
          <MiniBarChart
            data={revenueChartData}
            accent="#00C6FF"
            formatY={(v) => `${v.toFixed(1)}M`}
          />
        </Section>

        <Section title="Production pipeline" subtitle="Live order counts by stage">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(() => {
              const max = Math.max(1, ...data.orders.byStatus.map((x) => x.count));
              return data.orders.byStatus.map((p) => {
                const pct = (p.count / max) * 100;
                return (
                  <div key={p.status}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: "'Inter', sans-serif" }}>
                        {ORDER_STATUS_LABEL[p.status]}
                      </span>
                      <span style={{ fontSize: 12, color: c.textPrimary, fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                        {p.count}
                      </span>
                    </div>
                    <ProgressBar value={pct} accent={STATUS_ACCENT[p.status]} />
                  </div>
                );
              });
            })()}
          </div>
        </Section>
      </div>

      {/* Row: Recent orders + Overdue alert */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="ad-row">
        <Section
          title="Recent orders"
          subtitle="Latest 5 orders across all stages"
          action={<Link href="/admin/orders" style={ghostLink(c.textSecondary)}>View all <ArrowUpRight size={13} /></Link>}
          noPad
        >
          <DataTable
            columns={[
              { key: "orderNumber", header: "Order", render: (r) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.orderNumber}</span>, width: "120px" },
              { key: "clientName", header: "Client", render: (r) => <span style={{ fontWeight: 500 }}>{r.clientName}</span> },
              { key: "title", header: "Title", render: (r) => <span style={{ color: c.textSecondary }}>{r.title}</span> },
              { key: "subtotalAmount", header: "Amount", render: (r) => <span style={{ fontWeight: 500 }}>{formatFRW(r.subtotalAmount)}</span>, align: "right" as const },
              { key: "status", header: "Status", render: (r) => <StatusPill tone={ORDER_STATUS_TONE[r.status]}>{ORDER_STATUS_LABEL[r.status]}</StatusPill>, align: "right" as const },
            ]}
            rows={data.recentOrders.map((o) => ({ ...o, id: o.id }))}
            emptyText="No orders yet."
          />
        </Section>

        <Section
          title="Receivables snapshot"
          subtitle="Outstanding balance across unpaid invoices"
          action={<Link href="/admin/invoices" style={ghostLink(c.textSecondary)}>Sales quotation <ArrowUpRight size={13} /></Link>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "16px 18px", background: isDark ? "rgba(249,112,102,0.08)" : "rgba(249,112,102,0.06)", borderRadius: 11, border: `1px solid ${data.receivables.overdueCount > 0 ? "rgba(249,112,102,0.35)" : c.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <AlertCircle size={16} style={{ color: data.receivables.overdueCount > 0 ? "#F97066" : c.textMuted }} />
                <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: "'Inter', sans-serif" }}>Outstanding</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 600, color: c.textPrimary, fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}>
                {formatFRW(data.receivables.outstandingAmount)}
              </div>
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                {data.receivables.overdueCount > 0 ? `${data.receivables.overdueCount} invoice(s) past due` : "No overdue invoices"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>Revenue trend</div>
              <div style={{ fontSize: 13, color: c.textPrimary, fontFamily: "'Inter', sans-serif" }}>
                {pctDelta(data.revenue.thisMonth, data.revenue.lastMonth)}
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Top clients */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <Section
          title="Top clients by lifetime revenue"
          subtitle="Based on payments received (FRW)"
        >
          {data.clients.top.length === 0 ? (
            <div style={{ padding: "24px 0", color: c.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 13, textAlign: "center" }}>
              No payments recorded yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {data.clients.top.map((cl) => {
                const share = topClientMax > 0 ? (cl.revenue / topClientMax) * 100 : 0;
                return (
                  <div key={cl.id} style={{ padding: "14px 16px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(38,69,200,0.04)", borderRadius: 11, border: `1px solid ${c.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <Avatar name={cl.name} size={36} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, color: c.textPrimary, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "'Inter', sans-serif" }}>{cl.name}</div>
                        <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>
                          {formatFRW(cl.revenue)} · {cl.invoiceCount} invoice{cl.invoiceCount === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <ProgressBar value={share} accent="#00C6FF" />
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .ad-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function ghostLink(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    color, textDecoration: "none",
    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
  };
}
