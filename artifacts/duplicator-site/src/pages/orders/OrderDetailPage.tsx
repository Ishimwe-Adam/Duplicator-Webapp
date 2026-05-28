import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOrder,
  useUpdateOrderStatus,
  getGetOrderQueryKey,
  getListOrdersQueryKey,
  type OrderStatus,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Section, StatusPill, DataTable } from "@/components/dashboard/Primitives";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  nextAllowedStatuses,
  ordersBasePath,
  formatDateTime,
} from "@/lib/orders";
import { formatFRW } from "@/lib/format";
import { ChevronLeft, AlertCircle, MessageCircle } from "lucide-react";

const REQ = { credentials: "include" as const };

export default function OrderDetailPage() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [, params] = useRoute<{ id: string }>("/:base*/orders/:id");
  const id = Number.parseInt(params?.id ?? "", 10);

  const orderQ = useGetOrder(id, {
    query: {
      queryKey: getGetOrderQueryKey(id),
      enabled: Number.isFinite(id),
      staleTime: 5_000,
    },
    request: REQ,
  });
  const updateM = useUpdateOrderStatus({ request: REQ });

  const [note, setNote] = useState("");
  const [pendingTo, setPendingTo] = useState<OrderStatus | null>(null);

  if (!user) return null;

  const base = ordersBasePath(user.role);

  if (!Number.isFinite(id)) {
    return (
      <DashboardLayout title="Order">
        <div style={{ color: c.textSecondary }}>Invalid order id.</div>
      </DashboardLayout>
    );
  }

  if (orderQ.isLoading) {
    return (
      <DashboardLayout title="Order">
        <div style={{ color: c.textSecondary }}>Loading…</div>
      </DashboardLayout>
    );
  }

  if (orderQ.error || !orderQ.data) {
    return (
      <DashboardLayout title="Order">
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
          <span>{(orderQ.error as Error | undefined)?.message ?? "Order not found."}</span>
        </div>
        <Link
          href={base}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, color: "#00C6FF" }}
        >
          <ChevronLeft size={14} /> Back to orders
        </Link>
      </DashboardLayout>
    );
  }

  const order = orderQ.data;
  const canChangeStatus = user.role !== "client";
  const staffMayThis =
    user.role !== "staff" || order.assignedTo?.id === user.id;
  const allowedNext = canChangeStatus && staffMayThis ? nextAllowedStatuses(order.status) : [];

  const submitStatus = async (next: OrderStatus) => {
    setPendingTo(next);
    try {
      await updateM.mutateAsync({
        id: order.id,
        data: { status: next, note: note.trim() || undefined },
      });
      setNote("");
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetOrderQueryKey(order.id) }),
        qc.invalidateQueries({ queryKey: getListOrdersQueryKey() }),
      ]);
    } finally {
      setPendingTo(null);
    }
  };

  return (
    <DashboardLayout title={order.orderNumber} subtitle={order.title}>
      <div style={{ marginBottom: 16 }}>
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
          <ChevronLeft size={14} /> All orders
        </button>
      </div>

      <div className="od-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
        {/* LEFT — items + meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Section
            title="Items"
            action={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <StatusPill tone={ORDER_STATUS_TONE[order.status]}>
                  {ORDER_STATUS_LABEL[order.status]}
                </StatusPill>
              </div>
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
              rows={order.items.map((it, i) => ({ id: i, ...it }))}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 24,
                padding: "14px 18px",
                borderTop: `1px solid ${c.border}`,
                fontSize: 13,
              }}
            >
              <span style={{ color: c.textSecondary }}>Subtotal</span>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{formatFRW(order.subtotalAmount)}</span>
            </div>
          </Section>

          {order.notes && (
            <Section title="Notes">
              <p style={{ fontSize: 13.5, color: c.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {order.notes}
              </p>
            </Section>
          )}
        </div>

        {/* RIGHT — meta + timeline + status panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Section title="Details">
            <DetailRow label="Client" value={order.client.name} />
            {order.client.email && <DetailRow label="Email" value={order.client.email} mono />}
            <DetailRow
              label="Assigned to"
              value={order.assignedTo?.name ?? "Unassigned"}
              muted={!order.assignedTo}
            />
            <DetailRow label="Placed" value={formatDateTime(order.createdAt)} />
            <DetailRow label="Updated" value={formatDateTime(order.updatedAt)} />
          </Section>

          {canChangeStatus && (
            <Section title="Update status" subtitle={staffMayThis ? undefined : "Only the assigned staff can update this."}>
              {allowedNext.length === 0 ? (
                <p style={{ fontSize: 12.5, color: c.textMuted }}>
                  This order is closed — no further status changes.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="Optional note (e.g. \u201cBatch 1 printed, drying overnight\u201d)"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
                      border: `1px solid ${c.border}`,
                      borderRadius: 9,
                      color: c.textPrimary,
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 13,
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {allowedNext.map((s) => {
                      const isCancel = s === "cancelled";
                      const pending = pendingTo === s;
                      return (
                        <button
                          key={s}
                          onClick={() => submitStatus(s)}
                          disabled={updateM.isPending || !staffMayThis}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            border: isCancel ? "1px solid rgba(239,68,68,0.4)" : "none",
                            borderRadius: 9,
                            background: isCancel
                              ? "rgba(239,68,68,0.1)"
                              : "linear-gradient(135deg, #2645C8, #00C6FF)",
                            color: isCancel ? "#FCA5A5" : "#fff",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 12.5,
                            fontWeight: 500,
                            cursor: updateM.isPending ? "not-allowed" : "pointer",
                            opacity: updateM.isPending && !pending ? 0.5 : 1,
                          }}
                        >
                          {pending ? "Updating…" : `Mark ${ORDER_STATUS_LABEL[s]}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>
          )}

          <Section title="Timeline">
            {order.timeline.length === 0 ? (
              <p style={{ fontSize: 12.5, color: c.textMuted }}>No events yet.</p>
            ) : (
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                {order.timeline
                  .slice()
                  .reverse()
                  .map((ev, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    return (
                      <li key={ev.id} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: isLast ? 0 : 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 99,
                              background: idx === 0 ? "#00C6FF" : isDark ? "rgba(255,255,255,0.2)" : "rgba(38,69,200,0.4)",
                              border: idx === 0 ? "2px solid rgba(0,198,255,0.3)" : "none",
                              flexShrink: 0,
                              marginTop: 4,
                            }}
                          />
                          {!isLast && (
                            <span
                              style={{
                                flex: 1,
                                width: 1,
                                background: isDark ? "rgba(255,255,255,0.1)" : "rgba(38,69,200,0.2)",
                                marginTop: 2,
                              }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <StatusPill tone={ORDER_STATUS_TONE[ev.status]}>
                              {ORDER_STATUS_LABEL[ev.status]}
                            </StatusPill>
                            <span style={{ fontSize: 11.5, color: c.textMuted }}>{formatDateTime(ev.createdAt)}</span>
                          </div>
                          {ev.note && (
                            <div style={{ display: "flex", alignItems: "start", gap: 6, fontSize: 12.5, color: c.textSecondary }}>
                              <MessageCircle size={12} style={{ marginTop: 3, opacity: 0.6, flexShrink: 0 }} />
                              <span style={{ lineHeight: 1.45 }}>{ev.note}</span>
                            </div>
                          )}
                          {ev.by && (
                            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>
                              by {ev.by.name}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ol>
            )}
          </Section>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .od-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function DetailRow({ label, value, mono, muted }: { label: string; value: string; mono?: boolean; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", gap: 12 }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>{label}</span>
      <span
        style={{
          fontSize: 12.5,
          color: muted ? "rgba(255,255,255,0.45)" : "#fff",
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
