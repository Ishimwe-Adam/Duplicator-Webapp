import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard, PhaseBanner } from "@/components/DashboardKpi";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ListChecks, ShoppingBag, MessageSquare, Clock } from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const { c } = useTheme();
  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <DashboardLayout title={`Hi ${firstName}.`} subtitle="Your tasks, assigned orders, and team chat — all in one place.">
      <PhaseBanner />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 32 }}>
        <KpiCard label="My Open Tasks" value="7" trend="2 due today" icon={ListChecks} accent="#00C6FF" />
        <KpiCard label="Assigned Orders" value="11" trend="3 in production" icon={ShoppingBag} accent="#F5C518" />
        <KpiCard label="Unread Messages" value="4" trend="From 2 channels" icon={MessageSquare} accent="#A78BFA" />
        <KpiCard label="Hours This Week" value="32h" trend="Target: 40h" icon={Clock} accent="#22C55E" />
      </div>

      <div
        style={{
          padding: 28,
          borderRadius: 16,
          background: c.bgCard,
          border: `1px solid ${c.border}`,
          backdropFilter: "blur(16px)",
        }}
      >
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: c.textPrimary, marginBottom: 8, fontWeight: 500 }}>
          Coming in upcoming phases
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Kanban task board with @mentions and attachments",
            "Real-time team chat with channels and DMs",
            "Order production timeline tracker",
            "Client communication thread per order",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 10, fontSize: 13, color: c.textSecondary, fontFamily: "'Inter', sans-serif" }}>
              <span style={{ color: "#00C6FF" }}>✦</span> {item}
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  );
}
