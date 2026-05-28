import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Section, StatusPill, Avatar, DemoTag, ProgressBar } from "@/components/dashboard/Primitives";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import { ListChecks, ShoppingBag, MessageSquare, Clock, ArrowUpRight, Flame } from "lucide-react";
import { formatFRW } from "@/lib/format";

// ── Demo data ───────────────────────────────────────────────────────
type Task = {
  id: string;
  title: string;
  order: string;
  due: string;
  priority: "High" | "Med" | "Low";
  done?: boolean;
};

const INITIAL_TASKS: Task[] = [
  { id: "t1", title: "Send final proofs to Bank of Kigali",   order: "#DPL-2087", due: "Today, 4 pm",    priority: "High" },
  { id: "t2", title: "Check fabric delivery for hospital scrubs", order: "#DPL-2086", due: "Today, 6 pm",    priority: "High" },
  { id: "t3", title: "Print sample roll-up for Mara Phones",  order: "#DPL-2085", due: "Tomorrow, 10 am", priority: "Med" },
  { id: "t4", title: "QC pass on pilot polos before pickup",  order: "#DPL-2084", due: "Tomorrow, 2 pm",  priority: "Med" },
  { id: "t5", title: "Reply to Rwanda Tea Authority quote",   order: "#DPL-2083", due: "Wed",             priority: "Low" },
];

type AssignedOrder = {
  id: string;
  ref: string;
  client: string;
  stage: string;
  progress: number;
  due: string;
  accent: string;
};

const ASSIGNED: AssignedOrder[] = [
  { id: "o1", ref: "#DPL-2087", client: "Bank of Kigali",       stage: "Design proofs",  progress: 70, due: "Fri", accent: "#00C6FF" },
  { id: "o2", ref: "#DPL-2086", client: "King Faisal Hospital", stage: "Cutting & sew",  progress: 35, due: "Mon", accent: "#A78BFA" },
  { id: "o3", ref: "#DPL-2085", client: "Mara Phones Rwanda",   stage: "Ready to print", progress: 90, due: "Tue", accent: "#F5C518" },
  { id: "o4", ref: "#DPL-2084", client: "Akagera Aviation",     stage: "QC + packing",   progress: 95, due: "Today", accent: "#22C55E" },
];

const THREADS = [
  { id: "m1", name: "Adam (Owner)",         msg: "Can you confirm the BK proof set is ready?",        when: "12 min", unread: 2 },
  { id: "m2", name: "Bank of Kigali team",  msg: "Please use the updated logo from brand guide v3.",  when: "1 h",   unread: 1 },
  { id: "m3", name: "Eric Habimana",        msg: "Heading to QC now — see you upstairs.",             when: "2 h",   unread: 0 },
  { id: "m4", name: "King Faisal Hospital", msg: "Sizes updated to L/XL across the board.",           when: "3 h",   unread: 1 },
];

const PRIORITY_TONE: Record<Task["priority"], "red" | "amber" | "grey"> = {
  High: "red", Med: "amber", Low: "grey",
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  const doneCount = tasks.filter((t) => t.done).length;
  const overdueCount = 1; // demo
  const hoursWeek = 32;
  const targetHours = 40;

  return (
    <DashboardLayout title={`Hi ${firstName}.`} subtitle="Your tasks, assigned orders, and team chat — all in one place.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
        <KpiCard label="My Open Tasks" value={`${tasks.length - doneCount}`} trend={`${doneCount} done today`} icon={ListChecks} accent="#00C6FF" />
        <KpiCard label="Assigned Orders" value={`${ASSIGNED.length}`} trend="3 in production" icon={ShoppingBag} accent="#F5C518" />
        <KpiCard label="Unread Messages" value={`${THREADS.filter((t) => t.unread > 0).length}`} trend={`from ${THREADS.length} threads`} icon={MessageSquare} accent="#A78BFA" />
        <KpiCard label="Hours This Week" value={`${hoursWeek}h`} trend={`Target ${targetHours}h`} icon={Clock} accent="#22C55E" />
      </div>

      {/* Row: Today's tasks + Time tracker */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="sf-row">
        <Section
          title="Today's tasks"
          subtitle={`${doneCount}/${tasks.length} complete · ${overdueCount} overdue`}
          action={<DemoTag />}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px",
                  border: `1px solid ${c.border}`,
                  background: t.done ? (isDark ? "rgba(34,197,94,.05)" : "rgba(34,197,94,.04)") : "transparent",
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background .15s, border-color .15s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? "rgba(0,198,255,.3)" : "rgba(38,69,200,.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = c.border; }}
              >
                <span
                  style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `1.5px solid ${t.done ? "#22C55E" : c.textMuted}`,
                    background: t.done ? "#22C55E" : "transparent",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                  }}
                >
                  {t.done ? "✓" : ""}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: c.textPrimary, fontWeight: 500, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.5 : 1 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, display: "flex", gap: 8 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.order}</span>
                    <span>·</span>
                    <span>Due {t.due}</span>
                  </div>
                </div>
                <StatusPill tone={PRIORITY_TONE[t.priority]}>{t.priority}</StatusPill>
              </button>
            ))}
          </div>
        </Section>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Section title="This week" subtitle="Time tracked vs target">
            <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 36, fontWeight: 600, color: c.textPrimary, letterSpacing: "-0.02em" }}>
                {hoursWeek}<span style={{ fontSize: 18, color: c.textMuted }}>/{targetHours}h</span>
              </div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
                {Math.round((hoursWeek / targetHours) * 100)}% of weekly target
              </div>
            </div>
            <ProgressBar value={(hoursWeek / targetHours) * 100} accent="#22C55E" />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, gap: 8 }}>
              {["M","T","W","T","F","S","S"].map((d, i) => {
                const filled = i < 4;
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: 28, borderRadius: 6, background: filled ? "linear-gradient(180deg, #22C55E, #15803D)" : (isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)"), marginBottom: 4 }} />
                    <div style={{ fontSize: 10, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>{d}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Streak" subtitle="Keep it up!">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #F5C518, #F97066)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                <Flame size={28} />
              </div>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 22, color: c.textPrimary, letterSpacing: "-0.02em" }}>12 days</div>
                <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>on-time task completion</div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Row: Assigned orders + Messages */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: 16 }} className="sf-row">
        <Section
          title="Assigned orders"
          subtitle="Your current production load"
          action={<a href="/staff/orders" style={ghostLink(c.textSecondary)}>All orders <ArrowUpRight size={13} /></a>}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {ASSIGNED.map((o) => (
              <div key={o.id} style={{ padding: "14px 16px", border: `1px solid ${c.border}`, borderRadius: 11, background: isDark ? "rgba(255,255,255,0.02)" : "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: c.textMuted }}>{o.ref}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: c.textPrimary, fontWeight: 500, marginTop: 2 }}>
                      {o.client}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>Due {o.due}</span>
                </div>
                <div style={{ fontSize: 12, color: c.textSecondary, fontFamily: "'Inter', sans-serif", marginBottom: 8 }}>{o.stage}</div>
                <ProgressBar value={o.progress} accent={o.accent} />
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 6, fontFamily: "'Inter', sans-serif" }}>{o.progress}% complete</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Messages" subtitle="Latest from team & clients" action={<DemoTag />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {THREADS.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "8px 0", borderBottom: `1px solid ${c.border}`, cursor: "pointer" }}>
                <Avatar name={t.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12.5, color: c.textPrimary, fontFamily: "'Inter', sans-serif", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</span>
                    <span style={{ fontSize: 10, color: c.textMuted, fontFamily: "'Inter', sans-serif", flexShrink: 0 }}>{t.when}</span>
                  </div>
                  <div style={{ fontSize: 12, color: c.textSecondary, fontFamily: "'Inter', sans-serif", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.msg}
                  </div>
                </div>
                {t.unread > 0 && (
                  <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: "#00C6FF", color: "#04091A", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>
                    {t.unread}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Small earnings widget (demo) */}
      <div style={{ marginTop: 16 }}>
        <Section title="This month's contribution" subtitle="Estimated revenue you helped ship">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <Mini stat={formatFRW(2_840_000)} label="Shipped revenue" />
            <Mini stat="18" label="Orders touched" />
            <Mini stat="96%" label="On-time delivery" />
            <Mini stat="4.9 / 5" label="Client rating" />
          </div>
        </Section>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .sf-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}

function Mini({ stat, label }: { stat: string; label: string }) {
  const { c } = useTheme();
  return (
    <div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: c.textPrimary }}>{stat}</div>
      <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
    </div>
  );
}

function ghostLink(color: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 4,
    color, textDecoration: "none",
    fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500,
  };
}
