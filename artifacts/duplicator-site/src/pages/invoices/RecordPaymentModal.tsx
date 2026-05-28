import { useState, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useRecordPayment,
  getGetInvoiceQueryKey,
  getListInvoicesQueryKey,
  type PaymentMethod,
} from "@workspace/api-client-react";
import { useTheme } from "@/context/ThemeContext";
import { formatFRW } from "@/lib/format";
import { ALL_PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/payments";
import { X } from "lucide-react";

const REQ = { credentials: "include" as const };

interface Props {
  invoiceId: number;
  balanceDue: number;
  onClose: () => void;
  onRecorded: () => void;
}

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function RecordPaymentModal({ invoiceId, balanceDue, onClose, onRecorded }: Props) {
  const { c, isDark } = useTheme();
  const qc = useQueryClient();
  const recordM = useRecordPayment({ request: REQ });

  const [amount, setAmount] = useState<number | "">(balanceDue);
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (typeof amount !== "number" || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (amount > balanceDue) {
      setError(`Amount cannot exceed the outstanding balance (${formatFRW(balanceDue)}).`);
      return;
    }
    try {
      await recordM.mutateAsync({
        id: invoiceId,
        data: {
          amount,
          method,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          paidAt: paidAt ? new Date(`${paidAt}T12:00:00`).toISOString() : undefined,
        },
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId) }),
        qc.invalidateQueries({ queryKey: getListInvoicesQueryKey() }),
      ]);
      onRecorded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record payment.");
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)",
        zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: isDark ? "rgba(10,18,40,0.95)" : "#fff",
          border: `1px solid ${c.border}`, borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0,0,0,.5)", padding: 22,
          color: c.textPrimary, fontFamily: "'Inter', sans-serif",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
              Record payment
            </h2>
            <p style={{ fontSize: 12.5, color: c.textSecondary, marginTop: 4 }}>
              Outstanding balance: <strong style={{ color: "#00C6FF" }}>{formatFRW(balanceDue)}</strong>
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtn(c)}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Amount (FRW)">
              <input
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmount(v === "" ? "" : Math.max(0, Number.parseInt(v.replace(/[^0-9]/g, "") || "0", 10)));
                }}
                inputMode="numeric"
                style={inputStyle(c, isDark)}
              />
            </Field>
            <Field label="Method">
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} style={inputStyle(c, isDark)}>
                {ALL_PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{PAYMENT_METHOD_LABEL[m]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Reference (txn id / slip / cheque #)">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === "momo" ? "MoMo transaction ID" : method === "airtel" ? "Airtel txn ID" : ""}
              style={inputStyle(c, isDark)}
            />
          </Field>

          <Field label="Date received">
            <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} style={inputStyle(c, isDark)} />
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...inputStyle(c, isDark), resize: "vertical", fontFamily: "'Inter', sans-serif" }}
            />
          </Field>

          {error && (
            <div style={{
              padding: "10px 12px", borderRadius: 9,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              color: "#FCA5A5", fontSize: 12.5,
            }}>{error}</div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button onClick={onClose} type="button" style={ghostBtn(c)}>Cancel</button>
            <button onClick={submit} type="button" disabled={recordM.isPending} style={primaryBtn(recordM.isPending)}>
              {recordM.isPending ? "Recording…" : "Record payment"}
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
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>{label}</span>
      {children}
    </label>
  );
}
function inputStyle(c: { border: string; textPrimary: string }, isDark: boolean): CSSProperties {
  return {
    width: "100%", padding: "10px 12px",
    background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
    border: `1px solid ${c.border}`, borderRadius: 9,
    color: c.textPrimary, fontFamily: "'Inter', sans-serif", fontSize: 13, outline: "none",
  };
}
function iconBtn(c: { border: string; textSecondary: string }): CSSProperties {
  return {
    width: 32, height: 32, borderRadius: 8, border: `1px solid ${c.border}`,
    background: "transparent", color: c.textSecondary, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
}
function ghostBtn(c: { border: string; textPrimary: string }): CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px",
    border: `1px solid ${c.border}`, borderRadius: 9, background: "transparent",
    color: c.textPrimary, fontFamily: "'Inter', sans-serif", fontSize: 12.5, cursor: "pointer",
  };
}
function primaryBtn(pending: boolean): CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px",
    border: "none", borderRadius: 9,
    background: pending ? "rgba(38,69,200,0.5)" : "linear-gradient(135deg, #2645C8, #00C6FF)",
    color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
    cursor: pending ? "not-allowed" : "pointer",
  };
}
