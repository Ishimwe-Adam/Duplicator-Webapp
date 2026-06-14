import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface KpiProps {
  label: string;
  value: string;
  trend?: string;
  icon: LucideIcon;
  accent?: string;
}

export function KpiCard({ label, value, trend, icon: Icon, accent = "#00C6FF" }: KpiProps) {
  const { c, isDark } = useTheme();
  return (
    <div
      style={{
        padding: "22px 24px",
        background: c.bgCard,
        backdropFilter: "blur(16px)",
        border: `1px solid ${isDark ? c.border : c.navBorder}`,
        borderRadius: 14,
        position: "relative",
        overflow: "hidden",
        transition: "transform .2s, box-shadow .2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isDark
          ? "0 16px 40px rgba(0,0,0,.4)"
          : "0 12px 32px rgba(38,69,200,.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, position: "relative" }}>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: c.textMuted,
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `${accent}1a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accent,
          }}
        >
          <Icon size={17} strokeWidth={1.8} />
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          fontSize: 26,
          color: c.textPrimary,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          marginBottom: trend ? 6 : 0,
        }}
      >
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>
          {trend}
        </div>
      )}
    </div>
  );
}

export function PhaseBanner() {
  const { c, isDark } = useTheme();
  return (
    <div
      style={{
        padding: "16px 22px",
        marginBottom: 28,
        background: isDark ? "rgba(0,198,255,0.06)" : "rgba(38,69,200,0.05)",
        border: `1px solid ${isDark ? "rgba(0,198,255,0.2)" : "rgba(38,69,200,0.18)"}`,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#00C6FF",
          boxShadow: "0 0 12px #00C6FF",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary, marginBottom: 2 }}>
          Phase 1 — Foundation live
        </div>
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          Authentication, role-based dashboards, and routing are ready. Orders, invoices, tasks, messaging, CRM, and analytics arrive in the upcoming phases.
        </div>
      </div>
    </div>
  );
}
