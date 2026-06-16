import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetInvoiceDetail,
  useUpdateInvoiceStatus,
  getGetInvoiceDetailQueryKey,
  getListInvoicesQueryKey,
  type InvoiceStatus,
} from "@/lib/api-stub";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Section, StatusPill, DataTable } from "@/components/dashboard/Primitives";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_TONE,
  nextAllowedInvoiceStatuses,
  invoicesBasePath,
  pdfUrlFor,
} from "@/lib/invoices";
import { formatDateTime } from "@/lib/orders";
import { formatFRW } from "@/lib/format";
import { ChevronLeft, CircleAlert as AlertCircle, Download, Wallet } from "lucide-react";
import { PAYMENT_METHOD_LABEL } from "@/lib/payments";
import RecordPaymentModal from "./RecordPaymentModal";

export default function InvoiceDetailPage() {
  const { user } = useAuth();
  const { c } = useTheme();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const [, params] = useRoute<{ id: string }>("/:base*/invoices/:id");
  const id = Number.parseInt(params?.id ?? "", 10);

  const invQ = useGetInvoiceDetail(id, {
    query: {
      queryKey: getGetInvoiceDetailQueryKey(id),
      enabled: Number.isFinite(id),
      staleTime: 5_000,
    },
  });
  const updateM = useUpdateInvoiceStatus();
  const [pendingTo, setPendingTo] = useState<InvoiceStatus | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  if (!user) return null;
  const base = invoicesBasePath(user.role);

  if (!Number.isFinite(id)) {
    return (
      <DashboardLayout title="Invoice">
        <div style={{ color: c.textSecondary }}>Invalid invoice id.</div>
      </DashboardLayout>
    );
  }
  if (invQ.isLoading) {
    return (
      <DashboardLayout title="Invoice">
        <div style={{ color: c.textSecondary }}>Loading…</div>
      </DashboardLayout>
    );
  }
  if (invQ.error || !invQ.data) {
    return (
      <DashboardLayout title="Invoice">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 14,
            borderRadius: 10,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#FCA5A5",
            fontSize: 13,
          }}
        >
          <AlertCircle size={16} />
          <span>{(invQ.error as Error | undefined)?.message ?? "Invoice not found."}</span>
        </div>
        <Link href={base} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, color: "#00C6FF" }}>
          <ChevronLeft size={14} /> Back to invoices
        </Link>
      </DashboardLayout>
    );
  }

  const inv = invQ.data;
  const canChange = user.role === "admin" || user.role === "super_admin";
  const allowedNext = canChange ? nextAllowedInvoiceStatuses(inv.status) : [];

  const setStatus = async (next: InvoiceStatus) => {
    setPendingTo(next);
    try {
      await updateM.mutateAsync({ id: inv.id, data: { status: next } });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetInvoiceDetailQueryKey(inv.id) }),
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }),
      ]);
    } finally {
      setPendingTo(null);
    }
  };

  return (
    <DashboardLayout title={inv.invoiceNumber} subtitle={`For ${inv.order.orderNumber} — ${inv.order.title}`}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setLocation(base)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            background: "transparent",
            color: c.textSecondary,
            fontFamily: "'Inter', sans-serif",
            fontSize: 12.5,
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={14} /> All invoices
        </button>
        <a
          href={pdfUrlFor(inv.id)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            border: "none",
            borderRadius: 9,
            background: "linear-gradient(135deg, #2645C8, #00C6FF)",
            color: "#fff",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Download size={14} /> Download PDF
        </a>
      </div>

      <div className="iv-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Section
            title="Items"
            action={
              <StatusPill tone={inv.isOverdue ? "red" : INVOICE_STATUS_TONE[inv.status]}>
                {inv.isOverdue ? "Overdue" : INVOICE_STATUS_LABEL[inv.status]}
              </StatusPill>
            }
            noPad
          >
            <DataTable
              columns={[
                { key: "description", header: "Description", render: (r) => <span style={{ fontWeight: 500 }}>{r.description}</span> },
                { key: "qty", header: "Qty", align: "right", render: (r) => <span>{r.qty}</span> },
                { key: "unit", header: "Unit price", align: "right", render: (r) => <span>{formatFRW(r.unitPrice)}</span> },
                { key: "line", header: "Line", align: "right", render: (r) => <span style={{ fontWeight: 500 }}>{formatFRW(r.qty * r.unitPrice)}</span> },
              ]}
              rows={inv.items.map((it, i) => ({ id: i, ...it }))}
            />
            <div
              style={{
                padding: "14px 22px",
                borderTop: `1px solid ${c.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 13,
                alignItems: "flex-end",
              }}
            >
              <Row label="Subtotal" value={formatFRW(inv.subtotalAmount)} c={c} />
              {inv.taxRatePercent > 0 && (
                <Row label={`VAT (${inv.taxRatePercent}%)`} value={formatFRW(inv.taxAmount)} c={c} />
              )}
              <Row label="Total" value={formatFRW(inv.totalAmount)} c={c} />
              {inv.amountPaid > 0 && (
                <Row label="Paid" value={`− ${formatFRW(inv.amountPaid)}`} c={c} />
              )}
              <Row label="Balance due" value={formatFRW(inv.balanceDue)} bold c={c} />
            </div>
          </Section>

          <Section
            title="Payments"
            action={
              canChange && inv.balanceDue > 0 && inv.status !== "void" ? (
                <button
                  onClick={() => setPayOpen(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", border: "none", borderRadius: 8,
                    background: "linear-gradient(135deg, #2645C8, #00C6FF)",
                    color: "#fff", fontFamily: "'Inter', sans-serif",
                    fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                  }}
                >
                  <Wallet size={13} /> Record payment
                </button>
              ) : undefined
            }
            noPad
          >
            {inv.payments.length === 0 ? (
              <div style={{ padding: "22px 22px", textAlign: "center", color: c.textMuted, fontSize: 12.5 }}>
                No payments recorded yet.
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "date", header: "Date", render: (r: typeof inv.payments[number]) => <span style={{ fontSize: 12.5 }}>{formatDateTime(r.paidAt)}</span> },
                  { key: "method", header: "Method", render: (r) => <span>{PAYMENT_METHOD_LABEL[r.method]}</span> },
                  { key: "ref", header: "Reference", render: (r) => <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.textMuted }}>{r.reference || "—"}</span> },
                  { key: "by", header: "Recorded by", render: (r) => <span style={{ color: c.textSecondary, fontSize: 12.5 }}>{r.recordedBy.name}</span> },
                  { key: "amt", header: "Amount", align: "right", render: (r) => <span style={{ fontWeight: 500, color: "#7FE8FF" }}>{formatFRW(r.amount)}</span> },
                ]}
                rows={inv.payments}
              />
            )}
          </Section>

          {inv.notes && (
            <Section title="Notes">
              <p style={{ fontSize: 13.5, color: c.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {inv.notes}
              </p>
            </Section>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Section title="Details">
            <DetailRow label="Client" value={inv.client.name} />
            {inv.client.email && <DetailRow label="Email" value={inv.client.email} mono />}
            <DetailRow label="Issued" value={formatDateTime(inv.issueDate)} />
            <DetailRow label="Due" value={formatDateTime(inv.dueDate)} />
            {inv.sentAt && <DetailRow label="Sent" value={formatDateTime(inv.sentAt)} />}
            {inv.paidAt && <DetailRow label="Paid" value={formatDateTime(inv.paidAt)} />}
          </Section>

          {canChange && (
            <Section title="Update status">
              {allowedNext.length === 0 ? (
                <p style={{ fontSize: 12.5, color: c.textMuted }}>
                  This invoice is closed — no further status changes.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allowedNext.map((s) => {
                    const isVoid = s === "void";
                    const pending = pendingTo === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        disabled={updateM.isPending}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          border: isVoid ? "1px solid rgba(239,68,68,0.4)" : "none",
                          borderRadius: 9,
                          background: isVoid
                            ? "rgba(239,68,68,0.1)"
                            : "linear-gradient(135deg, #2645C8, #00C6FF)",
                          color: isVoid ? "#FCA5A5" : "#fff",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: updateM.isPending ? "not-allowed" : "pointer",
                          opacity: updateM.isPending && !pending ? 0.5 : 1,
                        }}
                      >
                        {pending ? "Updating…" : `Mark ${INVOICE_STATUS_LABEL[s]}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .iv-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {payOpen && (
        <RecordPaymentModal
          invoiceId={inv.id}
          balanceDue={inv.balanceDue}
          onClose={() => setPayOpen(false)}
          onRecorded={() => setPayOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}

function Row({
  label,
  value,
  bold,
  c,
}: {
  label: string;
  value: string;
  bold?: boolean;
  c: { textSecondary: string; textPrimary: string };
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 28, minWidth: 220 }}>
      <span style={{ color: bold ? c.textPrimary : c.textSecondary, fontWeight: bold ? 600 : 400 }}>
        {label}
      </span>
      <span style={{ fontWeight: bold ? 700 : 500, fontSize: bold ? 16 : 13 }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 12 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>{label}</span>
      <span
        style={{
          fontSize: 12.5,
          color: "#fff",
          textAlign: "right",
          fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}
