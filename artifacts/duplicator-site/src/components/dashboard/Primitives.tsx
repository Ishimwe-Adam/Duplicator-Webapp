import type { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";

// ─────────────────────────────────────────────────────────────────────
// Section — glass card with optional header + action
// ─────────────────────────────────────────────────────────────────────
interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  padding?: number | string;
  noPad?: boolean;
}

export function Section({ title, subtitle, action, children, padding, noPad }: SectionProps) {
  const { c } = useTheme();
  return (
    <div
      style={{
        background: c.bgCard,
        backdropFilter: "blur(16px)",
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 22px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div>
            {title && (
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: c.textPrimary,
                  letterSpacing: "-0.01em",
                }}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2, fontFamily: "'Inter', sans-serif" }}>
                {subtitle}
              </div>
            )}
          </div>
          {action}
        </div>
      )}
      <div style={{ padding: noPad ? 0 : (padding ?? "20px 22px") }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// StatusPill — coloured status chip
// ─────────────────────────────────────────────────────────────────────
type Tone = "blue" | "green" | "amber" | "red" | "violet" | "grey" | "cyan";
const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  blue:   { bg: "rgba(38,69,200,.14)",  fg: "#8AB4FF", dot: "#2645C8" },
  cyan:   { bg: "rgba(0,198,255,.14)",  fg: "#7FE8FF", dot: "#00C6FF" },
  green:  { bg: "rgba(34,197,94,.14)",  fg: "#7EE2A8", dot: "#22C55E" },
  amber:  { bg: "rgba(245,197,24,.14)", fg: "#FCD34D", dot: "#F5C518" },
  red:    { bg: "rgba(239,68,68,.14)",  fg: "#FCA5A5", dot: "#EF4444" },
  violet: { bg: "rgba(167,139,250,.16)", fg: "#C4B5FD", dot: "#A78BFA" },
  grey:   { bg: "rgba(148,163,184,.14)", fg: "#94A3B8", dot: "#94A3B8" },
};

export function StatusPill({ tone = "grey", children }: { tone?: Tone; children: ReactNode }) {
  const t = TONE[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 99,
        background: t.bg,
        color: t.fg,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.dot }} />
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Avatar — initials circle with brand gradient
// ─────────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #2645C8, #00C6FF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 600,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MiniBarChart — lightweight SVG bar chart, no deps
// ─────────────────────────────────────────────────────────────────────
interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  accent?: string;
  formatY?: (v: number) => string;
}

export function MiniBarChart({ data, height = 180, accent = "#00C6FF", formatY }: BarChartProps) {
  const { c, isDark } = useTheme();
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100; // viewBox width per bar slot
  const barW = w * 0.45;
  const gap = w * 0.55;
  const total = data.length * (barW + gap);
  const innerH = height - 30; // leave room for labels

  return (
    <div style={{ width: "100%" }}>
      <svg
        viewBox={`0 0 ${total} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.18" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * innerH, 2);
          const x = i * (barW + gap) + gap / 2;
          const y = innerH - h;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                fill="url(#barGrad)"
                stroke={accent}
                strokeOpacity="0.35"
                strokeWidth="0.5"
              />
              <text
                x={x + barW / 2}
                y={innerH + 18}
                textAnchor="middle"
                fontSize="10"
                fill={isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)"}
                fontFamily="'Inter', sans-serif"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      {formatY && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>
          <span>{formatY(0)}</span>
          <span>Peak {formatY(max)}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DataTable — responsive table that becomes card list on mobile
// ─────────────────────────────────────────────────────────────────────
interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({ columns, rows, emptyText = "No data yet.", onRowClick }: DataTableProps<T>) {
  const { c } = useTheme();
  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, fontSize: 13, color: c.textMuted, fontFamily: "'Inter', sans-serif", textAlign: "center" }}>
        {emptyText}
      </div>
    );
  }
  return (
    <div className="dt-wrap" style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Inter', sans-serif" }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  padding: "12px 22px",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: c.textMuted,
                  fontWeight: 500,
                  borderBottom: `1px solid ${c.border}`,
                  width: col.width,
                  whiteSpace: "nowrap",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: i === rows.length - 1 ? "none" : `1px solid ${c.border}`,
                cursor: onRowClick ? "pointer" : "default",
                transition: "background .15s",
              }}
              onMouseEnter={onRowClick ? (e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)") : undefined}
              onMouseLeave={onRowClick ? (e) => (e.currentTarget.style.background = "transparent") : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "14px 22px",
                    fontSize: 13,
                    color: c.textPrimary,
                    textAlign: col.align ?? "left",
                    verticalAlign: "middle",
                  }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ProgressBar — simple progress visualisation
// ─────────────────────────────────────────────────────────────────────
export function ProgressBar({ value, accent = "#00C6FF" }: { value: number; accent?: string }) {
  const { c } = useTheme();
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        width: "100%",
        height: 6,
        borderRadius: 99,
        background: c.border,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${accent}, ${accent}aa)`,
          borderRadius: 99,
          transition: "width .4s",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// DemoTag — subtle "Demo data" indicator
// ─────────────────────────────────────────────────────────────────────
export function DemoTag() {
  const { isDark } = useTheme();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 99,
        background: isDark ? "rgba(255,255,255,.06)" : "rgba(38,69,200,.07)",
        color: isDark ? "rgba(255,255,255,.55)" : "rgba(38,69,200,.7)",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00C6FF" }} />
      Demo data
    </span>
  );
}
