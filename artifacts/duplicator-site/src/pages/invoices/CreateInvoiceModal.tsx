import { useMemo, useState, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrders,
  useCreateInvoice,
  getListInvoicesQueryKey,
  getListOrdersQueryKey,
} from "@/lib/api-stub";
import { useTheme } from "@/context/ThemeContext";
import { formatFRW } from "@/lib/format";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreated: (invoiceId: number) => void;
}

function defaultDueDateIso(): string {
  // Default: 14 days from today
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export default function CreateInvoiceModal({ onClose, onCreated }: Props) {
  const { c, isDark } = useTheme();
  const qc = useQueryClient();
  const ordersQ = useListOrders({
    query: { queryKey: getListOrdersQueryKey(), staleTime: 10_000 },
  });
  const createM = useCreateInvoice();

  const [orderId, setOrderId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState(defaultDueDateIso());
  const [taxRatePercent, setTaxRatePercent] = useState(18);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invoiceable = useMemo(
    () =>
      (ordersQ.data?.orders ?? []).filter(
        (o) => o.status !== "cancelled" && o.status !== "draft",
      ),
    [ordersQ.data],
  );

  const selectedOrder = invoiceable.find((o) => o.id === orderId);

  const submit = async () => {
    setError(null);
    if (typeof orderId !== "number") {
      setError("Please pick an order to invoice.");
      return;
    }
    if (!dueDate) {
      setError("Please choose a due date.");
      return;
    }
    try {
      const created = await createM.mutateAsync({
        data: {
          orderId,
          dueDate: new Date(`${dueDate}T23:59:59`).toISOString(),
          taxRatePercent: Math.max(0, Math.min(100, taxRatePercent)),
          notes: notes.trim() || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      onCreated((created as { id: number }).id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invoice.");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: isDark ? "rgba(10,18,40,0.95)" : "#fff",
          border: `1px solid ${c.border}`,
          borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0,0,0,.5)",
          padding: 22,
          color: c.textPrimary,
          fontFamily: "'Inter', sans-serif",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
              New invoice
            </h2>
            <p style={{ fontSize: 12.5, color: c.textSecondary, marginTop: 4 }}>
              Generate an invoice from an existing order. Items + amounts are snapshotted.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtn(c)}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Order">
            {ordersQ.isLoading ? (
              <div style={{ fontSize: 13, color: c.textMuted }}>Loading orders…</div>
            ) : invoiceable.length === 0 ? (
              <div style={{ fontSize: 12.5, color: c.textMuted }}>
                No invoiceable orders. Orders must be at least "quoted" (not draft, not cancelled).
              </div>
            ) : (
              <select
                value={orderId === "" ? "" : String(orderId)}
                onChange={(e) =>
                  setOrderId(e.target.value === "" ? "" : Number.parseInt(e.target.value, 10))
                }
                style={inputStyle(c, isDark)}
              >
                <option value="">— Pick an order —</option>
                {invoiceable.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.title} ({formatFRW(o.subtotalAmount)})
                  </option>
                ))}
              </select>
            )}
          </Field>

          {selectedOrder && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 9,
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(38,69,200,0.05)",
                fontSize: 12.5,
                color: c.textSecondary,
              }}
            >
              <div>Client: <strong style={{ color: c.textPrimary }}>{selectedOrder.client.name}</strong></div>
              <div>Items: {selectedOrder.itemCount} · Subtotal: <strong style={{ color: c.textPrimary }}>{formatFRW(selectedOrder.subtotalAmount)}</strong></div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Due date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={inputStyle(c, isDark)}
              />
            </Field>
            <Field label="VAT %">
              <input
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(Math.max(0, Math.min(100, Number.parseInt(e.target.value || "0", 10))))}
                inputMode="numeric"
                style={inputStyle(c, isDark)}
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Payment instructions, reference, anything to add to the PDF…"
              style={{ ...inputStyle(c, isDark), resize: "vertical", fontFamily: "'Inter', sans-serif" }}
            />
          </Field>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 9,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#FCA5A5",
                fontSize: 12.5,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} type="button" style={ghostBtn(c)}>Cancel</button>
            <button
              onClick={submit}
              type="button"
              disabled={createM.isPending || invoiceable.length === 0}
              style={primaryBtn(createM.isPending)}
            >
              {createM.isPending ? "Creating…" : "Create invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

function inputStyle(c: { border: string; textPrimary: string }, isDark: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
    border: `1px solid ${c.border}`,
    borderRadius: 9,
    color: c.textPrimary,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    outline: "none",
  };
}

function iconBtn(c: { border: string; textSecondary: string }): CSSProperties {
  return {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${c.border}`,
    background: "transparent",
    color: c.textSecondary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function ghostBtn(c: { border: string; textPrimary: string }): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    border: `1px solid ${c.border}`,
    borderRadius: 9,
    background: "transparent",
    color: c.textPrimary,
    fontFamily: "'Inter', sans-serif",
    fontSize: 12.5,
    cursor: "pointer",
  };
}

function primaryBtn(pending: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 18px",
    border: "none",
    borderRadius: 9,
    background: pending ? "rgba(38,69,200,0.5)" : "linear-gradient(135deg, #2645C8, #00C6FF)",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: pending ? "not-allowed" : "pointer",
  };
}
