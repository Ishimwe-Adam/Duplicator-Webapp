import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth";
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
  Image,
  Settings,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Menu,
  X,
  Bell,
  Search,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function navForRole(role: string): NavItem[] {
  if (role === "client") {
    return [
      { href: "/portal", label: "Overview", icon: LayoutDashboard },
      { href: "/portal/orders", label: "My Orders", icon: ShoppingBag },
      { href: "/portal/invoices", label: "My Invoices", icon: FileText },
      { href: "/portal/gallery", label: "Gallery", icon: Image },
      { href: "/portal/recommendations", label: "Recommendations", icon: MessageSquare },
      { href: "/portal/messages", label: "Messages", icon: MessageSquare },
      { href: "/portal/profile", label: "Profile", icon: Settings },
      { href: "/portal/quotes", label: "Sales Quotation", icon: MessageSquare },
    ];
  }

  if (role === "staff") {
    return [
      { href: "/staff", label: "Overview", icon: LayoutDashboard },
      { href: "/staff/orders", label: "Assigned Orders", icon: ShoppingBag },
      { href: "/staff/tasks", label: "Tasks", icon: ListChecks },
      { href: "/staff/job-card", label: "Job Card", icon: FileText },
      { href: "/staff/gallery", label: "Gallery", icon: Image },
      { href: "/staff/messages", label: "Messages", icon: MessageSquare },
      { href: "/staff/invoices", label: "Sales Quotation", icon: FileText },
    ];
  }

  return [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/invoices", label: "Sales Quotation", icon: FileText },
    { href: "/admin/job-card", label: "Job Card", icon: FileText },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/tasks", label: "Tasks", icon: ListChecks },
    { href: "/admin/employees", label: "Employees", icon: Users },
    { href: "/admin/clients", label: "Clients (CRM)", icon: Users },
    { href: "/admin/messages", label: "Messages", icon: MessageSquare },
    { href: "/admin/documents", label: "Documents", icon: Folder },
    { href: "/admin/gallery", label: "Gallery", icon: Image },
    { href: "/admin/calendar", label: "Calendar", icon: Calendar },
    { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    { href: "/admin/invites", label: "Invitations", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];
}

const roleLabel: Record<string, string> = {
  super_admin: "Owner",
  admin: "Admin",
  manager: "Manager",
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (!user) return null;

  const items = navForRole(user.role);
  const sidebarW = collapsed ? 72 : 248;

  const Sidebar = (
    <aside
      className={`dl-sidebar ${mobileOpen ? "dl-sidebar-open" : ""}`}
      style={{
        width: sidebarW,
        background: isDark ? "rgba(4,9,26,0.92)" : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(20px)",
        borderRight: `1px solid ${isDark ? c.border : c.navBorder}`,
        padding: "24px 14px",
        display: "flex",
        flexDirection: "column",
        transition: "width .2s, transform .25s ease",
      }}
    >
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
                background: active ? (isDark ? "rgba(38,69,200,0.22)" : "rgba(38,69,200,0.1)") : "transparent",
                color: active ? (isDark ? "#fff" : "#04091A") : c.textSecondary,
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                cursor: "pointer",
                opacity: 1,
                transition: "all .15s",
                textAlign: "left",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(38,69,200,0.05)";
                  e.currentTarget.style.color = isDark ? c.textPrimary : "#04091A";
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
                  {active && <ChevronRight size={14} />}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
        {!collapsed && (
          <div
            style={{
              padding: "10px 12px",
              marginBottom: 8,
              borderRadius: 9,
              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(38,69,200,0.04)",
              border: `1px solid ${isDark ? c.border : c.navBorder}`,
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
            border: `1px solid ${isDark ? "transparent" : c.navBorder}`,
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
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: isDark ? "#04091A" : "#F5F7FB" }}>
      {Sidebar}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            backdropFilter: "blur(4px)",
            zIndex: 90,
          }}
        />
      )}

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "18px 24px",
            borderBottom: `1px solid ${isDark ? c.border : c.borderHover}`,
            background: isDark ? "rgba(4,9,26,0.65)" : "rgba(255,255,255,0.7)",
            backdropFilter: "blur(16px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            <button
              className="dl-mobile-only"
              onClick={() => setMobileOpen(true)}
              style={{
                display: "none",
                width: 38,
                height: 38,
                borderRadius: 9,
                border: `1px solid ${isDark ? c.border : c.navBorder}`,
                background: "transparent",
                color: c.textPrimary,
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Menu size={18} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1
                className="dl-title"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  fontSize: 22,
                  letterSpacing: "-0.02em",
                  color: c.textPrimary,
                  marginBottom: subtitle ? 2 : 0,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="dl-subtitle" style={{ fontSize: 13, color: c.textSecondary, fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button className="dl-desktop-only" title="Search (demo)" style={iconBtn(isDark ? c.border : c.navBorder, c.textSecondary)}>
              <Search size={16} />
            </button>
            <button title="Notifications (demo)" style={{ ...iconBtn(isDark ? c.border : c.navBorder, c.textSecondary), position: "relative" }}>
              <Bell size={16} />
              <span style={{ position: "absolute", top: 8, right: 9, width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
            </button>
            <button
              className="dl-desktop-only"
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={iconBtn(isDark ? c.border : c.navBorder, c.textSecondary)}
            >
              <Menu size={16} />
            </button>
            <button onClick={toggle} title="Toggle theme" style={iconBtn(isDark ? c.border : c.navBorder, c.textSecondary)}>
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: "28px 24px", overflow: "auto" }} className="dl-content">
          {children}
        </div>
      </main>

      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          className="dl-mobile-only"
          style={{
            position: "fixed",
            top: 16,
            left: 204,
            width: 36,
            height: 36,
            borderRadius: 9,
            border: `1px solid ${isDark ? c.border : c.navBorder}`,
            background: isDark ? "rgba(4,9,26,0.9)" : "#fff",
            color: c.textPrimary,
            cursor: "pointer",
            zIndex: 110,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>
      )}

      <style>{`
        .dl-sidebar {
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
        }
        .dl-mobile-only { display: none !important; }

        @media (max-width: 900px) {
          .dl-sidebar {
            position: fixed !important;
            top: 0; left: 0;
            height: 100vh;
            width: 248px !important;
            z-index: 100;
            transform: translateX(-100%);
            box-shadow: 0 30px 60px rgba(0,0,0,.4);
          }
          .dl-sidebar.dl-sidebar-open { transform: translateX(0); }
          .dl-desktop-only { display: none !important; }
          .dl-mobile-only { display: inline-flex !important; }
          .dl-content { padding: 20px 16px !important; }
          .dl-title { font-size: 18px !important; }
          .dl-subtitle { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function iconBtn(border: string, color: string): React.CSSProperties {
  return {
    width: 38,
    height: 38,
    borderRadius: 9,
    border: `1px solid ${border}`,
    background: "transparent",
    color,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}
