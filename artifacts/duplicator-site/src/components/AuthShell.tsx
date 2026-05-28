import type { ReactNode } from "react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { c, isDark } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: isDark ? "rgba(8,16,50,0.7)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${c.border}`,
          borderRadius: 20,
          padding: "44px 40px",
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,198,255,0.08)"
            : "0 24px 64px rgba(38,69,200,0.18)",
        }}
      >
        {/* Brand mark */}
        <Link href="/" style={{ display: "block", textDecoration: "none", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: "linear-gradient(135deg, #2645C8, #00C6FF)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.03em",
              }}
            >
              D
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                  color: c.textPrimary,
                  lineHeight: 1,
                }}
              >
                DUPLICATOR LTD.
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  color: "#00C6FF",
                  marginTop: 3,
                  textTransform: "uppercase",
                }}
              >
                Printing • Branding • Sewing
              </div>
            </div>
          </div>
        </Link>

        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: 32,
            letterSpacing: "-0.03em",
            color: c.textPrimary,
            marginBottom: 8,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: c.textSecondary,
            marginBottom: 28,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>

        {children}

        {footer && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${c.border}`,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: c.textSecondary,
              textAlign: "center",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}

export function Field({ label, type = "text", value, onChange, placeholder, autoComplete, required }: FieldProps) {
  const { c } = useTheme();
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span
        style={{
          display: "block",
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: c.textMuted,
          marginBottom: 7,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        style={{
          width: "100%",
          padding: "12px 14px",
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: c.textPrimary,
          background: c.inputBg,
          border: `1px solid ${c.inputBorder}`,
          borderRadius: 10,
          outline: "none",
          transition: "border-color .2s, box-shadow .2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "#00C6FF";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,198,255,0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = c.inputBorder;
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </label>
  );
}

export function SubmitButton({ children, loading }: { children: ReactNode; loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%",
        padding: "13px 18px",
        marginTop: 8,
        fontFamily: "'Inter', sans-serif",
        fontWeight: 500,
        fontSize: 14,
        letterSpacing: "0.01em",
        color: "#fff",
        background: loading
          ? "rgba(38,69,200,.5)"
          : "linear-gradient(135deg, #2645C8, #00C6FF)",
        border: "none",
        borderRadius: 10,
        cursor: loading ? "wait" : "pointer",
        transition: "transform .15s, box-shadow .15s",
        boxShadow: "0 8px 24px rgba(38,69,200,.35)",
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(38,69,200,.45)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(38,69,200,.35)";
      }}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        marginBottom: 16,
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.4)",
        borderRadius: 8,
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        color: "#FCA5A5",
      }}
    >
      {message}
    </div>
  );
}
