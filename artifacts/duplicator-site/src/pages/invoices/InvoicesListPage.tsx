import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListInvoices,
  getListInvoicesQueryKey,
} from "@/lib/api-stub";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Section, StatusPill, DataTable } from "@/components/dashboard/Primitives";
import CreateInvoiceModal from "./CreateInvoiceModal";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  invoicesBasePath,
} from "@/lib/invoices";
import { formatDate } from "@/lib/orders";
import { formatFRW } from "@/lib/format";
import { Plus, FileText, CircleAlert as AlertCircle } from "lucide-react";

export default function InvoicesListPage() {
  const { user } = useAuth();
  const { c } = useTheme();
  const [, setLocation] = useLocation();
  const [modalOpen, setModalOpen] = useState(false);

  const invQ = useListInvoices({
    query: {
      queryKey: getListInvoicesQueryKey(),
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
  });

  if (!user) return null;

  const role = user.role;
  const base = invoicesBasePath(role);
  const canCreate = role === "admin" || role === "super_admin";

  const title = role === "client" ? "My invoices" : "Invoices";
  const subtitle =
    role === "client"
      ? "Every invoice issued to you."
      : "Every invoice across the business.";

  const invoices = invQ.data?.invoices ?? [];

  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <Section
        title={`${invoices.length} ${invoices.length === 1 ? "invoice" : "invoices"}`}
        subtitle={invQ.isLoading ? "Loading…" : undefined}
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
              <Plus size={14} /> New invoice
            </button>
          ) : undefined
        }
        noPad
      >
        {invQ.error && (
          <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, color: "#FCA5A5", fontSize: 13 }}>
            <AlertCircle size={16} />
            <span>Could not load invoices. {(invQ.error as Error).message}</span>
          </div>
        )}
        {!invQ.error && !invQ.isLoading && invoices.length === 0 && (
          <div style={{ padding: "44px 24px", textAlign: "center", color: c.textSecondary }}>
            <FileText size={28} style={{ opacity: 0.5, marginBottom: 10 }} />
            <div style={{ fontSize: 14, color: c.textPrimary, marginBottom: 4 }}>No invoices yet</div>
            <div style={{ fontSize: 12.5, color: c.textMuted }}>
              {canCreate
                ? "Click \u201cNew invoice\u201d to issue one against an existing order."
                : "Invoices we issue you will appear here."}
            </div>
          </div>
        )}
        {!invQ.error && invoices.length > 0 && (
          <DataTable
            columns={[
              {
                key: "invoiceNumber",
                header: "Invoice",
                width: "130px",
                render: (r: typeof invoices[number]) => (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{r.invoiceNumber}</span>
                ),
              },
              {
                key: "order",
                header: "Order",
                render: (r: typeof invoices[number]) => (
                  <span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.textMuted }}>
                      {r.order.orderNumber}
                    </span>{" "}
                    <span style={{ color: c.textSecondary }}>{r.order.title}</span>
                  </span>
                ),
              },
              ...(role !== "client"
                ? [{
                    key: "client",
                    header: "Client",
                    render: (r: typeof invoices[number]) => (
                      <span style={{ color: c.textSecondary }}>{r.client.name}</span>
                    ),
                  }]
                : []),
              {
                key: "total",
                header: "Total",
                align: "right" as const,
                render: (r: typeof invoices[number]) => (
                  <span style={{ fontWeight: 500 }}>{formatFRW(r.totalAmount)}</span>
                ),
              },
              {
                key: "balance",
                header: "Balance",
                align: "right" as const,
                render: (r: typeof invoices[number]) => (
                  <span
                    style={{
                      fontWeight: 500,
                      color:
                        r.balanceDue === 0
                          ? "#86EFAC"
                          : r.amountPaid > 0
                          ? "#FCD34D"
                          : c.textSecondary,
                    }}
                  >
                    {r.balanceDue === 0 ? "Paid in full" : formatFRW(r.balanceDue)}
                  </span>
                ),
              },
              {
                key: "due",
                header: "Due",
                render: (r: typeof invoices[number]) => (
                  <span style={{ color: r.isOverdue ? "#FCA5A5" : c.textMuted, fontSize: 12 }}>
                    {formatDate(r.dueDate)}
                    {r.isOverdue && " · overdue"}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                align: "right" as const,
                render: (r: typeof invoices[number]) => (
                  <StatusPill tone={r.isOverdue ? "red" : INVOICE_STATUS_TONE[r.status]}>
                    {r.isOverdue ? "Overdue" : INVOICE_STATUS_LABEL[r.status]}
                  </StatusPill>
                ),
              },
            ]}
            rows={invoices}
            onRowClick={(r) => setLocation(`${base}/${r.id}`)}
          />
        )}
      </Section>

      {modalOpen && (
        <CreateInvoiceModal
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
