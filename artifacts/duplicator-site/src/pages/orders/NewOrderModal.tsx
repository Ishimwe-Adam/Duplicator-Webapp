import { useState, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateOrder,
  getListOrdersQueryKey,
} from "@/lib/api-stub";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/auth";
import { formatFRW } from "@/lib/format";
import { Plus, Trash2, X } from "lucide-react";

interface DraftLine {
  description: string;
  qty: number;
  unitPrice: number;
}

interface Props {
  onClose: () => void;
  onCreated: (orderId: number) => void;
}

export default function NewOrderModal({ onClose, onCreated }: Props) {
  const { c, isDark } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();
  const createM = useCreateOrder();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [lines, setLines] = useState<DraftLine[]>([
    { description: "", qty: 1, unitPrice: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const updateLine = (i: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  };
  const addLine = () =>
    setLines((p) => [...p, { description: "", qty: 1, unitPrice: 0 }]);
  const removeLine = (i: number) =>
    setLines((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Please give the order a title.");
      return;
    }
    const cleanLines = lines
      .map((l) => ({
        description: l.description.trim(),
        qty: Number(l.qty) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      }))
      .filter((l) => l.description && l.qty > 0);
    if (cleanLines.length === 0) {
      setError("Add at least one item line with a description and quantity.");
      return;
    }
    let parsedClientId: number | undefined;
    if (isAdmin) {
      const n = Number.parseInt(clientId, 10);
      if (!Number.isFinite(n) || n <= 0) {
        setError("Enter the client's user id (admins must specify a client).");
        return;
      }
      parsedClientId = n;
    }
    try {
      const created = await createM.mutateAsync({
        data: {
          title: title.trim(),
          items: cleanLines,
          notes: notes.trim() || undefined,
          clientId: parsedClientId,
        },
      });
      await qc.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      onCreated(created.id);
    } catch (e) {
      const msg =
        e instanceof Error && e.message ? e.message : "Could not create order.";
      setError(msg);
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
          maxWidth: 640,
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
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
              New order
            </h2>
            <p style={{ fontSize: 12.5, color: c.textSecondary, marginTop: 4 }}>
              Create a draft. You can update status and assign later.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={iconBtn(c)}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 200 branded notebooks"
              style={inputStyle(c, isDark)}
            />
          </Field>

          {isAdmin && (
            <Field label="Client user id" hint="Admins must specify which client this order is for.">
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 4"
                style={inputStyle(c, isDark)}
                inputMode="numeric"
              />
            </Field>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={labelStyle(c)}>Items</span>
              <button onClick={addLine} type="button" style={ghostBtn(c)}>
                <Plus size={13} /> Add line
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 110px 32px", gap: 8 }}>
                  <input
                    value={l.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    placeholder="Description"
                    style={inputStyle(c, isDark)}
                  />
                  <input
                    value={l.qty}
                    onChange={(e) =>
                      updateLine(i, { qty: Math.max(0, Number.parseInt(e.target.value || "0", 10)) })
                    }
                    inputMode="numeric"
                    style={{ ...inputStyle(c, isDark), textAlign: "right" }}
                    placeholder="Qty"
                  />
                  <input
                    value={l.unitPrice}
                    onChange={(e) =>
                      updateLine(i, {
                        unitPrice: Math.max(0, Number.parseInt(e.target.value || "0", 10)),
                      })
                    }
                    inputMode="numeric"
                    style={{ ...inputStyle(c, isDark), textAlign: "right" }}
                    placeholder="Unit FRW"
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    aria-label="Remove line"
                    style={iconBtn(c)}
                    disabled={lines.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                borderRadius: 9,
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(38,69,200,0.05)",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: c.textSecondary }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{formatFRW(subtotal)}</span>
            </div>
          </div>

          <Field label="Notes (optional)">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything we should know — deadlines, artwork notes, delivery preferences…"
              rows={3}
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button onClick={onClose} type="button" style={ghostBtn(c)}>Cancel</button>
            <button
              onClick={submit}
              type="button"
              disabled={createM.isPending}
              style={primaryBtn(createM.isPending)}
            >
              {createM.isPending ? "Creating…" : "Create order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{hint}</span>}
    </label>
  );
}

function labelStyle(_c: { textSecondary: string }): CSSProperties {
  return { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" };
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
