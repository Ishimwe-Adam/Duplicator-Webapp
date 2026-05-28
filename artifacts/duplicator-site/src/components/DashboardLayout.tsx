import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Users,
  ListChecks,
  MessageSquare,
  BarChart3,
  Megaphone,
  Calendar,
  Folder,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

function navForRole(role: string): NavItem[] {
  if (role === "client") {
    return [
      { href: "/portal", label: "Overview", icon: LayoutDashboard },
      { href: "/portal/orders", label: "My Orders", icon: ShoppingBag, badge: "Soon" },
      { href: "/portal/invoices", label: "My Invoices", icon: FileText, badge: "Soon" },
      { href: "/portal/quotes", label: "Quote Requests", icon: ListChecks, badge: "Soon" },
      { href: "/portal/profile", label: "Profile", icon: Settings, badge: "Soon" },
    ];
  }
  if (role === "staff") {
    return [
      { href: "/staff", label: "Overview", icon: LayoutDashboard },
      { href: "/staff/tasks", label: "My Tasks", icon: ListChecks, badge: "Soon" },
      { href: "/staff/orders", label: "Orders", icon: ShoppingBag, badge: "Soon" },
      { href: "/staff/messages", label: "Messages", icon: MessageSquare, badge: "Soon" },
      { href: "/staff/clients", label: "Clients", icon: Users, badge: "Soon" },
    ];
  }
  // admin & super_admin
  return [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "Soon" },
    { href: "/admin/invoices", label: "Invoices", icon: FileText, badge: "Soon" },
    { href: "/admin/tasks", label: "Tasks", icon: ListChecks, badge: "Soon" },
    { href: "/admin/clients", label: "Clients (CRM)", icon: Users, badge: "Soon" },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare, badge: "Soon" },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, badge: "Soon" },
    { href: "/admin/documents", label: "Documents", icon: Folder, badge: "Soon" },
    { href: "/admin/calendar", label: "Calendar", icon: Calendar, badge: "Soon" },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone, badge: "Soon" },
    { href: "/admin/settings", label: "Settings", icon: Settings, badge: "Soon" },
  ];
}

const roleLabel: Record<string, string> = {
  super_admin: "Owner",
  admin: "Manager",
  staff: "Staff",
  client: "Client",
};

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { c, isDark, toggle } = useTheme();
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;
  const items = navForRole(user.role);

  const sidebarW = collapsed ? 72 : 248;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarW,
          flexShrink: 0,
          background: isDark ? "rgba(4,9,26,0.85)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(20px)",
          borderRight: `1px solid ${c.border}`,
          padding: "24px 14px",
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: "width .2s",
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 28, padding: "0 6px" }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2645C8, #00C6FF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            D
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: c.textPrimary, lineHeight: 1 }}>
                DUPLICATOR
              </div>
              <div style={{ fontSize: 9, color: "#00C6FF", letterSpacing: "0.14em", marginTop: 3 }}>
                {roleLabel[user.role]?.toUpperCase()} PORTAL
              </div>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {items.map((item) => {
            const active = location === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: collapsed ? "11px 0" : "10px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: 9,
                  border: "none",
                  background: active
                    ? isDark
                      ? "rgba(38,69,200,0.22)"
                      : "rgba(38,69,200,0.1)"
                    : "transparent",
                  color: active ? (isDark ? "#fff" : "#2645C8") : c.textSecondary,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  cursor: "pointer",
                  transition: "all .15s",
                  textAlign: "left",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(38,69,200,0.05)";
                    e.currentTarget.style.color = c.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = c.textSecondary;
                  }
                }}
              >
                <Icon size={17} strokeWidth={1.8} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.08em",
                          padding: "2px 7px",
                          borderRadius: 99,
                          background: isDark ? "rgba(255,255,255,0.08)" : "rgba(38,69,200,0.1)",
                          color: c.textMuted,
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight size={14} />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User card + collapse */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
          {!collapsed && (
            <div
              style={{
                padding: "10px 12px",
                marginBottom: 8,
                borderRadius: 9,
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(38,69,200,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2645C8, #00C6FF)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {user.name[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: c.textPrimary, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 10, color: c.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {roleLabel[user.role]}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => logout().then(() => setLocation("/"))}
            title="Sign out"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: collapsed ? "10px 0" : "10px 12px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 9,
              border: "none",
              background: "transparent",
              color: c.textSecondary,
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#FCA5A5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = c.textSecondary;
            }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "20px 32px",
            borderBottom: `1px solid ${c.border}`,
            background: isDark ? "rgba(4,9,26,0.5)" : "rgba(255,255,255,0.5)",
            backdropFilter: "blur(16px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "-0.02em",
                color: c.textPrimary,
                marginBottom: subtitle ? 2 : 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 13, color: c.textSecondary, fontFamily: "'Inter', sans-serif" }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                background: "transparent",
                color: c.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
              }}
            >
              ☰
            </button>
            <button
              onClick={toggle}
              title="Toggle theme"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                background: "transparent",
                color: c.textSecondary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: "32px", overflow: "auto" }}>{children}</div>
      </main>
    </div>
  );
}
