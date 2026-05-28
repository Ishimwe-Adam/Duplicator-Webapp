import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Section, StatusPill, DemoTag, ProgressBar } from "@/components/dashboard/Primitives";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ShoppingBag, FileText, Sparkles, Clock, ArrowUpRight, Package, Truck, CheckCircle2, RotateCcw, Award } from "lucide-react";
import { formatFRW } from "@/lib/format";
import { Link } from "wouter";

// ── Demo data ───────────────────────────────────────────────────────
type Order = {
  id: string;
  ref: string;
  title: string;
  qty: string;
  amount: number;
  placed: string;
  stage: "Quote sent" | "Confirmed" | "In production" | "Ready" | "Delivered";
  progress: number;
};

const MY_ORDERS: Order[] = [
  { id: "o1", ref: "#DPL-2087", title: "Branded notebooks (A5, hardcover)", qty: "×500", amount: 5_500_000, placed: "May 21",  stage: "In production", progress: 60 },
  { id: "o2", ref: "#DPL-2079", title: "Roll-up banners — 3 designs",       qty: "×6",   amount:   570_000, placed: "May 14",  stage: "Ready",         progress: 90 },
  { id: "o3", ref: "#DPL-2068", title: "Foil-stamped business cards",       qty: "×1,500", amount: 425_000, placed: "May 02",  stage: "Delivered",     progress: 100 },
];

const INVOICES = [
  { id: "i1", ref: "INV-1208", order: "#DPL-2087", amount: 5_500_000, due: "Jun 04", status: "Due" as const },
  { id: "i2", ref: "INV-1199", order: "#DPL-2079", amount:   570_000, due: "May 28", status: "Paid" as const },
  { id: "i3", ref: "INV-1186", order: "#DPL-2068", amount:   425_000, due: "May 12", status: "Paid" as const },
];

const REORDER = [
  { id: "r1", title: "Business Cards", price: 25_000,  unit: "per 100" },
  { id: "r2", title: "Branded Notebooks", price: 11_000, unit: "per piece" },
  { id: "r3", title: "Roll-up Banner", price: 95_000, unit: "per unit" },
];

const STAGE_TONE: Record<Order["stage"], "grey" | "blue" | "cyan" | "amber" | "green"> = {
  "Quote sent":    "grey",
  "Confirmed":     "blue",
  "In production": "cyan",
  "Ready":         "amber",
  "Delivered":     "green",
};

const TIMELINE_STAGES: Array<{ key: Order["stage"]; label: string; icon: typeof Package }> = [
  { key: "Confirmed",     label: "Confirmed",     icon: CheckCircle2 },
  { key: "In production", label: "In production", icon: Package },
  { key: "Ready",         label: "Ready",         icon: Sparkles },
  { key: "Delivered",     label: "Delivered",     icon: Truck },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  if (!user) return null;

  const activeOrders = MY_ORDERS.filter((o) => o.stage !== "Delivered").length;
  const dueInvoiceTotal = INVOICES.filter((i) => i.status === "Due").reduce((s, i) => s + i.amount, 0);
  const ytdSpend = MY_ORDERS.reduce((s, o) => s + o.amount, 0);
  const greeting = user.companyName ? user.companyName : user.name;

  // Highlight order (the first active one)
  const featured = MY_ORDERS.find((o) => o.stage === "In production") ?? MY_ORDERS[0];
  const featuredStageIdx = TIMELINE_STAGES.findIndex((s) => s.key === featured?.stage);

  return (
    <DashboardLayout title={`Welcome, ${greeting}.`} subtitle="Track your orders, invoices, and place new quote requests.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Active Orders" value={`${activeOrders}`} trend={activeOrders > 0 ? `Next ETA: Jun 04` : "Place your first order"} icon={ShoppingBag} accent="#00C6FF" />
        <KpiCard label="Pending Invoices" value={formatFRW(dueInvoiceTotal)} trend={INVOICES.filter((i) => i.status === "Due").length > 0 ? `${INVOICES.filter((i) => i.status === "Due").length} due` : "All paid"} icon={FileText} accent="#F5C518" />
        <KpiCard label="Total Spent (YTD)" value={formatFRW(ytdSpend)} trend="Across 3 orders" icon={Sparkles} accent="#22C55E" />
        <KpiCard label="Last Order" value="May 21" trend={MY_ORDERS[0]?.ref ?? "—"} icon={Clock} accent="#A78BFA" />
      </div>

      {/* Featured order tracker (full-width hero card) */}
      {featured && (
        <div
          style={{
            padding: 22,
            borderRadius: 16,
            border: `1px solid ${isDark ? "rgba(0,198,255,0.25)" : "rgba(38,69,200,0.2)"}`,
            background: isDark
              ? "linear-gradient(135deg, rgba(38,69,200,0.18), rgba(0,198,255,0.08))"
              : "linear-gradient(135deg, rgba(38,69,200,0.06), rgba(0,198,255,0.05))",
            backdropFilter: "blur(16px)",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#00C6FF", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                Tracking — {featured.ref}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 19, fontWeight: 500, color: c.textPrimary, letterSpacing: "-0.02em", marginTop: 4 }}>
                {featured.title} {featured.qty}
              </div>
              <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                Placed {featured.placed} · {formatFRW(featured.amount)}
              </div>
            </div>
            <StatusPill tone={STAGE_TONE[featured.stage]}>{featured.stage}</StatusPill>
          </div>

          {/* Timeline */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", paddingBottom: 4 }} className="cl-timeline">
            {TIMELINE_STAGES.map((s, i) => {
              const Icon = s.icon;
              const reached = i <= featuredStageIdx;
              return (
                <div key={s.key} style={{ display: "contents" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, minWidth: 72 }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: reached ? "linear-gradient(135deg, #2645C8, #00C6FF)" : (isDark ? "rgba(255,255,255,.05)" : "rgba(38,69,200,.06)"),
                        color: reached ? "#fff" : c.textMuted,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: reached ? "0 6px 18px rgba(0,198,255,.35)" : "none",
                      }}
                    >
                      <Icon size={17} />
                    </div>
                    <div style={{ fontSize: 11, color: reached ? c.textPrimary : c.textMuted, fontFamily: "'Inter', sans-serif", fontWeight: reached ? 500 : 400 }}>
                      {s.label}
                    </div>
                  </div>
                  {i < TIMELINE_STAGES.length - 1 && (
                    <div style={{ flex: 1, minWidth: 24, height: 2, background: i < featuredStageIdx ? "linear-gradient(90deg, #2645C8, #00C6FF)" : (isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"), borderRadius: 2, marginTop: -22 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Row: Orders list + Loyalty */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="cl-row">
        <Section
          title="Recent orders"
          subtitle="Your last 3 orders"
          action={<DemoTag />}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {MY_ORDERS.map((o) => (
              <div key={o.id} style={{ padding: "14px 16px", border: `1px solid ${c.border}`, borderRadius: 11, background: isDark ? "rgba(255,255,255,0.02)" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.textMuted }}>{o.ref}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: c.textPrimary, fontWeight: 500, marginTop: 2 }}>
                      {o.title} <span style={{ color: c.textMuted, fontWeight: 400 }}>{o.qty}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: c.textPrimary, fontWeight: 500 }}>{formatFRW(o.amount)}</div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>{o.placed}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={o.progress} accent={o.stage === "Delivered" ? "#22C55E" : "#00C6FF"} />
                  </div>
                  <StatusPill tone={STAGE_TONE[o.stage]}>{o.stage}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Section title="Loyalty status" subtitle="Earn 5% off at Gold tier">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: "linear-gradient(135deg, #F5C518, #FF8A00)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Award size={26} />
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontWeight: 600, color: c.textPrimary, letterSpacing: "-0.01em" }}>Silver tier</div>
                <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>{formatFRW(2_000_000)} to Gold</div>
              </div>
            </div>
            <ProgressBar value={70} accent="#F5C518" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>
              <span>{formatFRW(ytdSpend)}</span>
              <span>{formatFRW(8_500_000)}</span>
            </div>
          </Section>

          <Section title="Need it fast?">
            <p style={{ fontSize: 12.5, color: c.textSecondary, fontFamily: "'Inter', sans-serif", lineHeight: 1.55, marginBottom: 14 }}>
              Rush production available on most stationery. We deliver across Kigali within 48h for orders placed by 11 am.
            </p>
            <a
              href="https://wa.me/250788355226?text=Hi%20Duplicator%2C%20I%27d%20like%20a%20rush%20quote."
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "10px 18px",
                background: "#25D366",
                color: "#fff",
                borderRadius: 9,
                fontFamily: "'Inter', sans-serif",
                fontSize: 12.5,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Chat on WhatsApp →
            </a>
          </Section>
        </div>
      </div>

      {/* Row: Invoices + Quick reorder */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="cl-row">
        <Section
          title="Invoices"
          subtitle={`${INVOICES.filter((i) => i.status === "Due").length} due · ${INVOICES.filter((i) => i.status === "Paid").length} paid`}
          action={<a href="/portal/invoices" style={ghostLink(c.textSecondary)}>View all <ArrowUpRight size={13} /></a>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {INVOICES.map((inv) => (
              <div key={inv.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: `1px solid ${c.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.textPrimary }}>{inv.ref}</div>
                  <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>For {inv.order} · {inv.status === "Paid" ? "Paid" : "Due"} {inv.due}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: c.textPrimary, fontWeight: 500 }}>{formatFRW(inv.amount)}</span>
                  <StatusPill tone={inv.status === "Paid" ? "green" : "amber"}>{inv.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Quick reorder"
          subtitle="Popular items you've ordered before"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {REORDER.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", border: `1px solid ${c.border}`, borderRadius: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: c.textPrimary, fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>From {formatFRW(r.price)} {r.unit}</div>
                </div>
                <Link href="/products" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "7px 12px", borderRadius: 8,
                  background: "linear-gradient(135deg, #2645C8, #00C6FF)",
                  color: "#fff", textDecoration: "none",
                  fontFamily: "'Inter', sans-serif", fontSize: 11.5, fontWeight: 500,
                }}>
                  <RotateCcw size={12} /> Reorder
                </Link>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .cl-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function ghostLink(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    color, textDecoration: "none",
    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
  };
}
