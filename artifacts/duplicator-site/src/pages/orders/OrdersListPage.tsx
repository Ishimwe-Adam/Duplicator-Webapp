import { useState } from "react";
import { useLocation } from "wouter";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Section, StatusPill, DataTable } from "@/components/dashboard/Primitives";
import NewOrderModal from "./NewOrderModal";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  ordersBasePath,
  formatDate,
} from "@/lib/orders";
import { formatFRW } from "@/lib/format";
import { Plus, ShoppingBag, AlertCircle } from "lucide-react";

const REQ = { credentials: "include" as const };

export default function OrdersListPage() {
  const { user } = useAuth();
  const { c } = useTheme();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const ordersQ = useListOrders({
    query: {
      queryKey: getListOrdersQueryKey(),
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
    request: REQ,
  });

  if (!user) return null;

  const role = user.role;
  const base = ordersBasePath(role);
  const canCreate = role === "client" || role === "admin" || role === "super_admin";

  const title =
    role === "client"
      ? "My orders"
      : role === "staff"
        ? "Assigned to me"
        : "All orders";

  const subtitle =
    role === "client"
      ? "Every order you've placed with Duplicator."
      : role === "staff"
        ? "Orders currently assigned to you for production."
        : "Every order across the business.";

  const orders = ordersQ.data?.orders ?? [];
  const isLoading = ordersQ.isLoading;
  const error = ordersQ.error;

  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <Section
        title={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`}
        subtitle={isLoading ? "Loading…" : undefined}
        action={
          canCreate ? (
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                border: "none",
                borderRadius: 9,
                background: "linear-gradient(135deg, #2645C8, #00C6FF)",
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Plus size={14} /> New order
            </button>
          ) : undefined
        }
        noPad
      >
        {error && (
          <div
            style={{
              padding: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#FCA5A5",
              fontSize: 13,
            }}
          >
            <AlertCircle size={16} />
            <span>Could not load orders. {(error as Error).message}</span>
          </div>
        )}
        {!error && !isLoading && orders.length === 0 && (
          <div
            style={{
              padding: "44px 24px",
              textAlign: "center",
              color: c.textSecondary,
            }}
          >
            <ShoppingBag size={28} style={{ opacity: 0.5, marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: c.textPrimary, marginBottom: 4 }}>
              No orders yet
            </div>
            <div style={{ fontSize: 12.5, color: c.textMuted }}>
              {canCreate
                ? "Click \u201cNew order\u201d to create the first one."
                : role === "staff"
                  ? "Orders will appear here once an admin assigns one to you."
                  : "When you place an order it will appear here."}
            </div>
          </div>
        )}
        {!error && orders.length > 0 && (
          <DataTable
            columns={[
              {
                key: "orderNumber",
                header: "Order",
                width: "130px",
                render: (r: typeof orders[number]) => (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    {r.orderNumber}
                  </span>
                ),
              },
              {
                key: "title",
                header: "Title",
                render: (r: typeof orders[number]) => (
                  <span style={{ fontWeight: 500 }}>{r.title}</span>
                ),
              },
              ...(role !== "client"
                ? [{
                    key: "client",
                    header: "Client",
                    render: (r: typeof orders[number]) => (
                      <span style={{ color: c.textSecondary }}>{r.client.name}</span>
                    ),
                  }]
                : []),
              {
                key: "items",
                header: "Items",
                render: (r: typeof orders[number]) => (
                  <span style={{ color: c.textSecondary }}>{r.itemCount}</span>
                ),
                align: "right",
              },
              {
                key: "subtotalAmount",
                header: "Amount",
                render: (r: typeof orders[number]) => (
                  <span style={{ fontWeight: 500 }}>{formatFRW(r.subtotalAmount)}</span>
                ),
                align: "right",
              },
              {
                key: "createdAt",
                header: "Placed",
                render: (r: typeof orders[number]) => (
                  <span style={{ color: c.textMuted, fontSize: 12 }}>
                    {formatDate(r.createdAt)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right",
                render: (r: typeof orders[number]) => (
                  <StatusPill tone={ORDER_STATUS_TONE[r.status]}>
                    {ORDER_STATUS_LABEL[r.status]}
                  </StatusPill>
                ),
              },
            ]}
            rows={orders}
            onRowClick={(r) => setLocation(`${base}/${r.id}`)}
          />
        )}
      </Section>

      {modalOpen && (
        <NewOrderModal
          onClose={() => setModalOpen(false)}
          onCreated={(id) => {
            setModalOpen(false);
            setLocation(`${base}/${id}`);
          }}
        />
      )}
    </DashboardLayout>
  );
}
