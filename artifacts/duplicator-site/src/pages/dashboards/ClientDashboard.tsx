import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Section, StatusPill, DataTable, ProgressBar } from "@/components/dashboard/Primitives";
import SharedWorkspaceBoard from "@/components/SharedWorkspaceBoard";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import { formatFRW } from "@/lib/format";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  invoicesBasePath,
} from "@/lib/invoices";
import {
  ORDER_PIPELINE,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  formatDate,
  ordersBasePath,
} from "@/lib/orders";
import {
  getListInvoicesQueryKey,
  getListOrdersQueryKey,
  useListInvoices,
  useListOrders,
} from "@/lib/api-stub";
import type { OrderStatus } from "@/lib/api-stub";
import { CircleAlert as AlertCircle, ArrowUpRight, Clock, FileText, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { Link, useLocation } from "wouter";

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  draft: 10,
  quoted: 25,
  approved: 45,
  in_production: 70,
  ready: 90,
  delivered: 100,
  cancelled: 0,
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const [, setLocation] = useLocation();
  const ordersQ = useListOrders({
    query: {
      queryKey: [...getListOrdersQueryKey(), "client-dashboard"],
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });
  const invoicesQ = useListInvoices({
    query: {
      queryKey: [...getListInvoicesQueryKey(), "client-dashboard"],
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });

  if (!user) return null;

  const orders = ordersQ.data?.orders ?? [];
  const invoices = invoicesQ.data?.invoices ?? [];
  const activeOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length;
  const pendingInvoices = invoices.filter((invoice) => invoice.balanceDue > 0 && invoice.status !== "void");
  const outstanding = pendingInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0);
  const totalSpent = invoices.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const latestOrder = orders[0] ?? null;
  const greeting = user.companyName ? user.companyName : user.name;
  const orderBase = ordersBasePath(user.role);
  const invoiceBase = invoicesBasePath(user.role);

  return (
    <DashboardLayout
      title={`Welcome, ${greeting}.`}
      subtitle="Live portal data for your orders, invoices, and payment balances."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Active Orders" value={String(activeOrders)} trend={`${orders.length} total orders`} icon={ShoppingBag} accent="#00C6FF" />
        <KpiCard label="Pending Invoices" value={formatFRW(outstanding)} trend={`${pendingInvoices.length} unpaid`} icon={FileText} accent="#F5C518" />
        <KpiCard label="Amount Paid" value={formatFRW(totalSpent)} trend="Recorded payments" icon={Wallet} accent="#22C55E" />
        <KpiCard
          label="Latest Order"
          value={latestOrder ? latestOrder.orderNumber : "None yet"}
          trend={latestOrder ? ORDER_STATUS_LABEL[latestOrder.status] : "Place an order to begin"}
          icon={Clock}
          accent="#A78BFA"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <SharedWorkspaceBoard role="client" />
      </div>

      {(ordersQ.error || invoicesQ.error) && (
        <div style={{ marginBottom: 16, padding: 16, display: "flex", alignItems: "center", gap: 10, color: "#FCA5A5", border: `1px solid ${c.border}`, borderRadius: 12 }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 13 }}>
            Could not load all portal data. Make sure the API server is running on port 5000.
          </span>
        </div>
      )}

      {latestOrder && (
        <Section
          title={`Tracking ${latestOrder.orderNumber}`}
          subtitle={`${latestOrder.title} - ${formatFRW(latestOrder.subtotalAmount)}`}
          action={<Link href={`${orderBase}/${latestOrder.id}`} style={ghostLink(c.textSecondary)}>Open order <ArrowUpRight size={13} /></Link>}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            <StatusPill tone={ORDER_STATUS_TONE[latestOrder.status]}>{ORDER_STATUS_LABEL[latestOrder.status]}</StatusPill>
            <span style={{ color: c.textMuted, fontSize: 12, fontFamily: "'Inter', sans-serif" }}>
              Placed {formatDate(latestOrder.createdAt)}
            </span>
          </div>
          <ProgressBar
            value={STATUS_PROGRESS[latestOrder.status]}
            accent={latestOrder.status === "cancelled" ? "#EF4444" : "#00C6FF"}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, gap: 8, color: c.textMuted, fontSize: 11, fontFamily: "'Inter', sans-serif" }}>
            {ORDER_PIPELINE.map((status) => (
              <span key={status}>{ORDER_STATUS_LABEL[status]}</span>
            ))}
          </div>
        </Section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)", gap: 16, marginTop: 16 }} className="cl-row">
        <Section
          title="Recent backend orders"
          subtitle={ordersQ.isLoading ? "Loading..." : `${orders.length} visible to this account`}
          action={<Link href="/portal/orders" style={ghostLink(c.textSecondary)}>View all <ArrowUpRight size={13} /></Link>}
          noPad
        >
          {!ordersQ.error && !ordersQ.isLoading && orders.length === 0 && (
            <EmptyState icon={ShoppingBag} title="No orders yet" body="Orders created for this client account will appear here." />
          )}
          {!ordersQ.error && orders.length > 0 && (
            <DataTable
              columns={[
                {
                  key: "orderNumber",
                  header: "Order",
                  width: "130px",
                  render: (r: typeof orders[number]) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.orderNumber}</span>,
                },
                {
                  key: "title",
                  header: "Title",
                  render: (r: typeof orders[number]) => <span style={{ fontWeight: 500 }}>{r.title}</span>,
                },
                {
                  key: "amount",
                  header: "Amount",
                  align: "right" as const,
                  render: (r: typeof orders[number]) => <span style={{ fontWeight: 500 }}>{formatFRW(r.subtotalAmount)}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  align: "right" as const,
                  render: (r: typeof orders[number]) => (
                    <StatusPill tone={ORDER_STATUS_TONE[r.status]}>{ORDER_STATUS_LABEL[r.status]}</StatusPill>
                  ),
                },
              ]}
              rows={orders.slice(0, 5)}
              onRowClick={(row) => setLocation(`${orderBase}/${row.id}`)}
            />
          )}
        </Section>

        <Section
          title="Backend invoices"
          subtitle={invoicesQ.isLoading ? "Loading..." : `${pendingInvoices.length} unpaid - ${invoices.length} total`}
          action={<Link href="/portal/invoices" style={ghostLink(c.textSecondary)}>View all <ArrowUpRight size={13} /></Link>}
        >
          {!invoicesQ.error && !invoicesQ.isLoading && invoices.length === 0 && (
            <EmptyState icon={FileText} title="No invoices yet" body="Invoices issued to this client account will appear here." compact />
          )}
          {!invoicesQ.error && invoices.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {invoices.slice(0, 5).map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => setLocation(`${invoiceBase}/${invoice.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "11px 0",
                    border: "none",
                    borderBottom: `1px solid ${c.border}`,
                    background: "transparent",
                    color: c.textPrimary,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{invoice.invoiceNumber}</span>
                    <span style={{ display: "block", color: c.textMuted, fontSize: 11, marginTop: 2 }}>
                      Balance {formatFRW(invoice.balanceDue)}
                    </span>
                  </span>
                  <StatusPill tone={invoice.isOverdue ? "red" : INVOICE_STATUS_TONE[invoice.status]}>
                    {invoice.isOverdue ? "Overdue" : INVOICE_STATUS_LABEL[invoice.status]}
                  </StatusPill>
                </button>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Quick reorder" subtitle="The product catalogue is connected to quote/order creation." action={<Link href="/products" style={ghostLink(c.textSecondary)}>Products <ArrowUpRight size={13} /></Link>} padding={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: c.textSecondary, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: isDark ? "rgba(0,198,255,0.1)" : "rgba(38,69,200,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00C6FF" }}>
            <Sparkles size={18} />
          </div>
          <span>Use Products to start a request, then track created orders and invoices from this portal.</span>
        </div>
      </Section>

      <style>{`
        @media (max-width: 1000px) {
          .cl-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  compact,
}: {
  icon: typeof ShoppingBag;
  title: string;
  body: string;
  compact?: boolean;
}) {
  const { c } = useTheme();
  return (
    <div style={{ padding: compact ? "20px 0" : "44px 24px", textAlign: "center", color: c.textSecondary }}>
      <Icon size={28} style={{ opacity: 0.5, marginBottom: 10 }} />
      <div style={{ fontSize: 14, color: c.textPrimary, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: c.textMuted }}>{body}</div>
    </div>
  );
}

function ghostLink(color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color,
    textDecoration: "none",
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 500,
  };
}
