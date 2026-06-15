import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Section, StatusPill, DataTable } from "@/components/dashboard/Primitives";
import SharedWorkspaceBoard from "@/components/SharedWorkspaceBoard";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import { formatFRW } from "@/lib/format";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  formatDate,
  ordersBasePath,
} from "@/lib/orders";
import {
  getListOrdersQueryKey,
  useListOrders,
} from "@/lib/api-stub";
import type { OrderStatus } from "@/lib/api-stub";
import { CircleAlert as AlertCircle, ArrowUpRight, CircleCheck as CheckCircle2, Clock, Factory, PackageCheck, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";

const ACTIVE_STATUSES: OrderStatus[] = ["draft", "quoted", "approved", "in_production", "ready"];

export default function StaffDashboard() {
  const { user } = useAuth();
  const { c } = useTheme();
  const [, setLocation] = useLocation();
  const ordersQ = useListOrders({
    query: {
      queryKey: [...getListOrdersQueryKey(), "staff-dashboard"],
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });

  if (!user) return null;

  const firstName = user.name.split(" ")[0];
  const orders = ordersQ.data?.orders ?? [];
  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length;
  const inProduction = orders.filter((order) => order.status === "in_production").length;
  const ready = orders.filter((order) => order.status === "ready").length;
  const delivered = orders.filter((order) => order.status === "delivered").length;
  const assignedValue = orders.reduce((sum, order) => sum + order.subtotalAmount, 0);
  const base = ordersBasePath(user.role);

  return (
    <DashboardLayout
      title={`Hi ${firstName}.`}
      subtitle="Live assigned-order view from the backend."
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Assigned Orders" value={String(orders.length)} trend={`${activeOrders} active`} icon={ShoppingBag} accent="#00C6FF" />
        <KpiCard label="In Production" value={String(inProduction)} trend="Currently being worked" icon={Factory} accent="#F5C518" />
        <KpiCard label="Ready" value={String(ready)} trend="Awaiting delivery" icon={PackageCheck} accent="#22C55E" />
        <KpiCard label="Assigned Value" value={formatFRW(assignedValue)} trend={`${delivered} delivered`} icon={CheckCircle2} accent="#A78BFA" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <SharedWorkspaceBoard role="staff" />
      </div>

      <Section
        title="Backend modules available to staff"
        subtitle="Staff can view assigned orders, update workflow status, and prepare Sales Quotations."
        action={<Link href="/staff/orders" style={ghostLink(c.textSecondary)}>Open orders <ArrowUpRight size={13} /></Link>}
        noPad
      >
        {ordersQ.error && (
          <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, color: "#FCA5A5", fontSize: 13 }}>
            <AlertCircle size={16} />
            <span>Could not load assigned orders. {(ordersQ.error as Error).message}</span>
          </div>
        )}

        {!ordersQ.error && ordersQ.isLoading && (
          <div style={{ padding: 24, color: c.textSecondary, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Clock size={15} /> Loading assigned orders...
          </div>
        )}

        {!ordersQ.error && !ordersQ.isLoading && orders.length === 0 && (
          <div style={{ padding: "44px 24px", textAlign: "center", color: c.textSecondary }}>
            <ShoppingBag size={28} style={{ opacity: 0.5, marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: c.textPrimary, marginBottom: 4 }}>No assigned orders yet</div>
            <div style={{ fontSize: 12.5, color: c.textMuted }}>
              Orders appear here after an admin assigns them to this staff account.
            </div>
          </div>
        )}

        {!ordersQ.error && orders.length > 0 && (
          <DataTable
            columns={[
              {
                key: "orderNumber",
                header: "Order",
                width: "130px",
                render: (r: typeof orders[number]) => (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.orderNumber}</span>
                ),
              },
              {
                key: "title",
                header: "Title",
                render: (r: typeof orders[number]) => <span style={{ fontWeight: 500 }}>{r.title}</span>,
              },
              {
                key: "client",
                header: "Client",
                render: (r: typeof orders[number]) => <span style={{ color: c.textSecondary }}>{r.client.name}</span>,
              },
              {
                key: "amount",
                header: "Amount",
                align: "right" as const,
                render: (r: typeof orders[number]) => <span style={{ fontWeight: 500 }}>{formatFRW(r.subtotalAmount)}</span>,
              },
              {
                key: "createdAt",
                header: "Placed",
                render: (r: typeof orders[number]) => <span style={{ color: c.textMuted, fontSize: 12 }}>{formatDate(r.createdAt)}</span>,
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
            rows={orders}
            onRowClick={(row) => setLocation(`${base}/${row.id}`)}
          />
        )}
      </Section>
    </DashboardLayout>
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
