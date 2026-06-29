import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import { useState as useReactState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { KpiCard } from "@/components/DashboardKpi";
import { Avatar, DataTable, ProgressBar, Section, StatusPill } from "@/components/dashboard/Primitives";
import { formatFRW } from "@/lib/format";
import { formatDate } from "@/lib/orders";
import {
  WORKSPACE_ANNOUNCEMENTS_KEY,
  WORKSPACE_CALENDAR_KEY,
  WORKSPACE_CUSTOMER_CARE_KEY,
  WORKSPACE_GALLERY_KEY,
  WORKSPACE_MESSAGES_KEY,
  WORKSPACE_RECOMMENDATIONS_KEY,
  WORKSPACE_TASKS_KEY,
} from "@/lib/workspaceFeed";
import {
  useGetAnalyticsSummary,
  useListInvoices,
  useListOrders,
  useListInvites,
  useCreateInvite,
  getGetAnalyticsSummaryQueryKey,
  getListInvoicesQueryKey,
  getListOrdersQueryKey,
  getListInvitesQueryKey,
} from "@/lib/api-stub";
import type { OrderStatus } from "@/lib/api-stub";
import { Bell, CalendarDays, CircleCheck as CheckCircle2, ClipboardList, Download, FileText, Megaphone, MessageSquare, FolderPlus, FileUp, Image, Plus, Save, Search, PencilLine, Settings2, ShoppingBag, Sparkles, Star, Users, Wallet, Upload, Trash2 } from "lucide-react";

type ModuleKey =
  | "admin-tasks"
  | "admin-clients"
  | "admin-messages"
  | "admin-employees"
  | "admin-calendar"
  | "admin-documents"
  | "admin-gallery"
  | "admin-announcements"
  | "admin-invites"
  | "admin-settings"
  | "staff-tasks"
  | "staff-gallery"
  | "staff-messages"
  | "portal-profile"
  | "portal-gallery"
  | "portal-recommendations"
  | "portal-messages"
  | "portal-quotes";

const MODULE_META: Record<ModuleKey, { title: string; subtitle: string }> = {
  "admin-tasks": { title: "Tasks", subtitle: "Track the work queue across production and admin." },
  "admin-clients": { title: "Clients", subtitle: "Live CRM view of your highest-value accounts." },
  "admin-messages": { title: "Messages", subtitle: "Keep internal and client conversations in one place." },
  "admin-employees": { title: "Employees", subtitle: "Track employee progress and task completion across the team." },
  "admin-calendar": { title: "Calendar", subtitle: "Production milestones, delivery dates, and meetings." },
  "admin-documents": { title: "Documents", subtitle: "Quick access to quotation, order, invoice, and catalogue files." },
  "admin-gallery": { title: "Gallery", subtitle: "Upload, edit, and rate production work shared across the company." },
  "admin-announcements": { title: "Announcements", subtitle: "Broadcast updates to the team and sales crew." },
  "admin-invites": { title: "Invitations", subtitle: "Generate one-time codes to onboard new team members." },
  "admin-settings": { title: "Settings", subtitle: "Company identity, payment details, and defaults." },
  "staff-tasks": { title: "Staff Tasks", subtitle: "Assigned work, QC checklist, and production priorities." },
  "staff-gallery": { title: "Gallery", subtitle: "Post recent work, review proofs, and rate team output." },
  "staff-messages": { title: "Team Messages", subtitle: "Production updates, client replies, and handoffs." },
  "portal-profile": { title: "Profile", subtitle: "Account details, contact info, and company identity." },
  "portal-gallery": { title: "Gallery", subtitle: "View company work, featured jobs, and rate the output." },
  "portal-recommendations": { title: "Recommendations", subtitle: "Clients can submit product ideas, requests, and feedback for the team." },
  "portal-messages": { title: "Messages", subtitle: "Talk to the customer care person assigned to your account." },
  "portal-quotes": { title: "Quote Requests", subtitle: "Submit and track quotation requests." },
};

const SIGNATURE_OPTIONS = ["Receiver", "Client Representative", "Sales Manager", "Print Operator", "Owner"] as const;

const EMPLOYEE_ROSTER = [
  "Sales",
  "Marketing",
  "Design",
  "Transportation",
  "Production",
  "Account",
  "Manager",
  "Owner",
] as const;

const TASK_ASSIGNEES = ["Unassigned", ...EMPLOYEE_ROSTER] as const;
const TASK_PRIORITIES = ["High", "Medium", "Low"] as const;
const TASK_STATUSES = ["todo", "doing", "done"] as const;
const TASK_PRESETS = [
  { title: "Approve final proof for client", owner: "Sales", due: "Today", priority: "High" as const, status: "todo" as const },
  { title: "Print roll-up banners — 2pcs", owner: "Production", due: "Tomorrow", priority: "Medium" as const, status: "todo" as const },
  { title: "Issue invoice for completed order", owner: "Account", due: "Today", priority: "High" as const, status: "doing" as const },
  { title: "Design new flyer template", owner: "Design", due: "Friday", priority: "Low" as const, status: "todo" as const },
];
const MESSAGE_RECIPIENTS = [
  "Sales Manager",
  "Production Lead",
  "Accounts",
  "Design Team",
  "Customer Care Desk",
] as const;
const PAYMENT_METHODS = ["MTN Mobile Money", "Airtel Money", "Bank Transfer", "Cash", "Other"] as const;

type Task = {
  id: number;
  title: string;
  owner: string;
  due: string;
  priority: "High" | "Medium" | "Low";
  status: "todo" | "doing" | "done";
  createdBy: string;
};

type Announcement = {
  id: number;
  title: string;
  body: string;
  audience: string;
  date: string;
  createdBy: string;
};

type MessageThread = {
  id: number;
  name: string;
  last: string;
  time: string;
  unread: number;
};

type MessageRecord = {
  id: number;
  from: string;
  to: string;
  body: string;
  time: string;
  channel: "internal" | "client";
};

type QuoteRequest = {
  id: number;
  subject: string;
  qty: string;
  status: "new" | "reviewing" | "quoted" | "closed";
  createdAt: string;
};

type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  tone: "blue" | "green" | "amber" | "red";
  createdBy: string;
};

type DocumentItem = {
  id: number;
  title: string;
  type: string;
  updatedAt: string;
  href: string;
  createdBy: string;
  content: string;
};

type GalleryRating = {
  by: string;
  value: number;
};

type GalleryItem = {
  id: number;
  title: string;
  project: string;
  client: string;
  category: string;
  notes: string;
  mediaUrl: string;
  featured: boolean;
  status: "draft" | "published";
  postedBy: string;
  createdAt: string;
  updatedAt: string;
  ratings: GalleryRating[];
};

type RecommendationItem = {
  id: number;
  title: string;
  category: string;
  summary: string;
  priority: "High" | "Medium" | "Low";
  target: string;
  poster: string;
  createdAt: string;
  status: "new" | "reviewing" | "actioned";
  contact: string;
};

function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore local storage issues
    }
  }, [key]);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore local storage issues
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export default function WorkspaceModulePage({ module }: { module: ModuleKey }) {
  const meta = MODULE_META[module];
  return (
    <DashboardLayout title={meta.title} subtitle={meta.subtitle}>
      <ModuleBody module={module} />
    </DashboardLayout>
  );
}

function ModuleBody({ module }: { module: ModuleKey }) {
  switch (module) {
    case "admin-tasks":
      return <AdminTasksModule />;
    case "admin-clients":
      return <AdminClientsModule />;
    case "admin-messages":
      return <AdminMessagesModule />;
    case "admin-employees":
      return <AdminEmployeesModule />;
    case "admin-calendar":
      return <AdminCalendarModule />;
    case "admin-documents":
      return <AdminDocumentsModule />;
    case "admin-gallery":
      return <GalleryModule role="admin" />;
    case "admin-announcements":
      return <AdminAnnouncementsModule />;
    case "admin-invites":
      return <AdminInvitesModule />;
    case "admin-settings":
      return <AdminSettingsModule />;
    case "staff-tasks":
      return <StaffTasksModule />;
    case "staff-gallery":
      return <GalleryModule role="staff" />;
    case "staff-messages":
      return <StaffMessagesModule />;
    case "portal-profile":
      return <ClientProfileModule />;
    case "portal-gallery":
      return <GalleryModule role="client" />;
    case "portal-recommendations":
      return <RecommendationsModule />;
    case "portal-messages":
      return <ClientMessagesModule />;
    case "portal-quotes":
      return <ClientQuotesModule />;
  }
}

function AdminTasksModule() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const { data: analytics } = useGetAnalyticsSummary({
    query: { queryKey: getGetAnalyticsSummaryQueryKey(), staleTime: 30_000 },
  });
  const [tasks, setTasks] = useStoredState<Task[]>("duplicator-admin-tasks", [
    {
      id: 1,
      title: "Approve final proof for Bank of Kigali",
      owner: "Sales",
      due: "Today",
      priority: "High",
      status: "doing",
      createdBy: "System",
    },
    {
      id: 2,
      title: "Confirm fabric shades for staff polos",
      owner: "Production",
      due: "Tomorrow",
      priority: "Medium",
      status: "todo",
      createdBy: "System",
    },
    {
      id: 3,
      title: "Prepare roll-up delivery note",
      owner: "Admin",
      due: "Today",
      priority: "Low",
      status: "done",
      createdBy: "System",
    },
    {
      id: 4,
      title: "Call client about invoice settlement",
      owner: "Account",
      due: "Thu",
      priority: "High",
      status: "todo",
      createdBy: "System",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [assignee, setAssignee] = useState<(typeof TASK_ASSIGNEES)[number]>("Unassigned");
  const [due, setDue] = useState("Later");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("todo");
  const [query, setQuery] = useState("");
  const canCreateTask = draft.trim().length > 0;
  const filtered = tasks.filter((task) => `${task.title} ${task.owner}`.toLowerCase().includes(query.toLowerCase()));
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(tasks[0]?.id ?? null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? filtered[0] ?? tasks[0] ?? null;
  const createTask = () => {
    const title = draft.trim();
    if (!title) return;
    setTasks((prev) => [
      {
        id: Date.now(),
        title,
        owner: assignee,
        due,
        priority,
        status: taskStatus,
        createdBy: user?.name ?? "Unknown",
      },
      ...prev,
    ]);
    setDraft("");
    setAssignee("Unassigned");
    setDue("Later");
    setPriority("Medium");
    setTaskStatus("todo");
  };

  useEffect(() => {
    if (selectedTaskId !== null && tasks.some((task) => task.id === selectedTaskId)) return;
    setSelectedTaskId(filtered[0]?.id ?? tasks[0]?.id ?? null);
  }, [filtered, selectedTaskId, tasks]);

  const counts = {
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Open tasks" value={String(counts.todo)} trend="Waiting to start" icon={ClipboardList} accent="#00C6FF" />
        <KpiCard label="In progress" value={String(counts.doing)} trend="Active work" icon={Sparkles} accent="#F5C518" />
        <KpiCard label="Completed" value={String(counts.done)} trend="This workspace" icon={CheckCircle2} accent="#22C55E" />
        <KpiCard label="Revenue" value={analytics ? formatFRW(analytics.revenue.thisMonth) : "FRW 0"} trend="This month" icon={Wallet} accent="#A78BFA" />
      </div>

      <Section title="Task board" subtitle="Local-first task queue with live filtering and quick add." noPad>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={15} className="text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent text-sm outline-none placeholder:text-white/35"
            />
          </div>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createTask();
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a new task..."
              className="min-w-[240px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/35"
            />
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value as (typeof TASK_ASSIGNEES)[number])}
              className="min-w-[180px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none task-select"
            >
              {TASK_ASSIGNEES.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
            <input
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="min-w-[120px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none placeholder:text-white/35"
              placeholder="Due date"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="min-w-[140px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none task-select"
            >
              {TASK_PRIORITIES.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <select
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value as Task["status"])}
              className="min-w-[120px] rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm outline-none task-select"
            >
              {TASK_STATUSES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!canCreateTask}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} /> Add task
            </button>
          </form>
        </div>

        <div className="px-5 pb-2">
          <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-white/45">Quick fill from sample tasks</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {TASK_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setDraft(preset.title);
                  setAssignee(preset.owner as (typeof TASK_ASSIGNEES)[number]);
                  setDue(preset.due);
                  setPriority(preset.priority);
                  setTaskStatus(preset.status);
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/5"
              >
                <div className="text-sm font-medium text-white">{preset.title}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.08em] text-white/45">
                  <span>{preset.owner}</span>
                  <span>{preset.due}</span>
                  <span>{preset.priority}</span>
                  <span>{preset.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          {(["todo", "doing", "done"] as const).map((status) => (
            <div key={status} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium capitalize text-white">{status}</h3>
                <StatusPill tone={status === "done" ? "green" : status === "doing" ? "amber" : "blue"}>{counts[status]}</StatusPill>
              </div>
              <div className="space-y-3">
                {filtered.filter((task) => task.status === status).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedTaskId(task.id);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedTask?.id === task.id
                        ? isDark
                          ? "border-white/20 bg-white/8"
                          : "border-[#2645C8]/40 bg-[#eef4ff]"
                        : "border-white/8 bg-black/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{task.title}</div>
                    <div className="mt-1 flex items-center justify-between text-xs text-white/45">
                      <span>Assigned to {task.owner}</span>
                      <span>{task.due}</span>
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.08em] text-white/35">
                      Posted by {task.createdBy}
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-white/40">Assignee</span>
                        <select
                          value={task.owner}
                          onChange={(e) =>
                            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, owner: e.target.value } : t)))
                          }
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"
                        >
                          {TASK_ASSIGNEES.map((person) => (
                            <option key={person} value={person}>
                              {person}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-white/40">Status</span>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            setTasks((prev) =>
                              prev.map((t) => (t.id === task.id ? { ...t, status: e.target.value as Task["status"] } : t)),
                            )
                          }
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"
                        >
                          {TASK_STATUSES.map((taskStatus) => (
                            <option key={taskStatus} value={taskStatus}>
                              {taskStatus}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <StatusPill tone={task.priority === "High" ? "red" : task.priority === "Medium" ? "amber" : "grey"}>{task.priority}</StatusPill>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextTaskStatus(t.status) } : t)));
                        }}
                        className={`rounded-lg border border-white/10 px-3 py-1 text-xs hover:bg-white/5 ${isDark ? "text-white/75" : "text-[#04091A]"}`}
                      >
                        Move
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedTask && (
          <div className="border-t border-white/10 px-5 pb-5">
            <Section title="Task details" subtitle="Click a task above to inspect full work details." noPad>
              <div className="grid gap-4 p-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.12em] text-white/45">Task title</div>
                    <div className="mt-2 text-lg font-medium text-white">{selectedTask.title}</div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.12em] text-white/45">Assigned to</div>
                      <div className="mt-2 text-sm text-white">{selectedTask.owner}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.12em] text-white/45">Due</div>
                      <div className="mt-2 text-sm text-white">{selectedTask.due}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.12em] text-white/45">Priority</div>
                      <div className="mt-2 text-sm text-white">{selectedTask.priority}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.12em] text-white/45">Status</div>
                      <div className="mt-2 text-sm text-white capitalize">{selectedTask.status}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/45">Posted by</div>
                    <div className="mt-2 text-sm text-white">{selectedTask.createdBy}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/45">Quick actions</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, status: nextTaskStatus(t.status) } : t)))}
                        className={`rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5 ${isDark ? "text-white/75" : "text-[#04091A]"}`}
                      >
                        Move task
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskId(tasks[0]?.id ?? null)}
                        className={`rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5 ${isDark ? "text-white/75" : "text-[#04091A]"}`}
                      >
                        Focus first task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        )}
      </Section>
    </div>
  );
}

function AdminClientsModule() {
  const { c } = useTheme();
  const { data: analytics } = useGetAnalyticsSummary({
    query: { queryKey: [...getGetAnalyticsSummaryQueryKey(), "clients"], staleTime: 30_000 },
  });
  const { data: orders } = useListOrders({
    query: { queryKey: [...getListOrdersQueryKey(), "clients"], staleTime: 30_000 },
  });
  const [query, setQuery] = useState("");
  const clients = analytics?.clients.top ?? [];
  const orderCountByClient = new Map<string, number>();
  orders?.orders.forEach((order) => {
    orderCountByClient.set(order.client.name, (orderCountByClient.get(order.client.name) ?? 0) + 1);
  });
  const filtered = clients.filter((client) => client.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Clients" value={analytics ? String(analytics.clients.total) : "0"} trend="Active accounts" icon={Users} accent="#00C6FF" />
        <KpiCard label="New this month" value={analytics ? String(analytics.clients.newThisMonth) : "0"} trend="Onboarded now" icon={Sparkles} accent="#22C55E" />
        <KpiCard label="Recent orders" value={orders ? String(orders.orders.length) : "0"} trend="Visible records" icon={ShoppingBag} accent="#F5C518" />
        <KpiCard label="Outstanding" value={analytics ? formatFRW(analytics.receivables.outstandingAmount) : "FRW 0"} trend="Open balances" icon={Wallet} accent="#A78BFA" />
      </div>

      <Section title="Client CRM" subtitle="Quick search plus live account totals from analytics." noPad>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={15} className="text-white/45" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients..."
              className="bg-transparent text-sm outline-none placeholder:text-white/35"
            />
          </div>
          <div className="text-sm text-white/55">Accounts and recent order counts stay live as the backend changes.</div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => (
            <div key={client.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={client.name} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-base font-medium text-white">{client.name}</div>
                  <div className="truncate text-xs text-white/45">{client.email}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between"><span>Revenue</span><span>{formatFRW(client.revenue)}</span></div>
                <div className="flex justify-between"><span>Invoices</span><span>{client.invoiceCount}</span></div>
                <div className="flex justify-between"><span>Orders</span><span>{orderCountByClient.get(client.name) ?? 0}</span></div>
              </div>
              <div className="mt-3">
                <ProgressBar value={Math.min(100, Math.max(12, Math.round((client.revenue / Math.max(1, clients[0]?.revenue ?? 1)) * 100)))} accent="#00C6FF" />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AdminMessagesModule() {
  const { user } = useAuth();
  const [customerCareContact] = useStoredState(WORKSPACE_CUSTOMER_CARE_KEY, "Customer Care Desk");
  const [messages, setMessages] = useStoredState<MessageRecord[]>(WORKSPACE_MESSAGES_KEY, [
    { id: 1, from: "Bank of Kigali team", to: "Sales Manager", body: "Please update the final logo on the proof.", time: "12 min", channel: "client" },
    { id: 2, from: "Sales Manager", to: "Production Lead", body: "Banners are ready for pickup.", time: "1 h", channel: "internal" },
    { id: 3, from: "Customer Care Desk", to: "Accounts", body: "Invoice PDF sent successfully.", time: "3 h", channel: "internal" },
  ]);
  const [activeRecipient, setActiveRecipient] = useState<string>(customerCareContact);
  const [draft, setDraft] = useState("");

  const recipients = useMemo(() => {
    const all = new Set<string>([customerCareContact, ...MESSAGE_RECIPIENTS, ...messages.map((m) => m.to), ...messages.map((m) => m.from)]);
    return Array.from(all);
  }, [customerCareContact, messages]);

  const activeMessages = messages.filter((m) => m.to === activeRecipient || m.from === activeRecipient);

  const lastByRecipient = useMemo(() => {
    const map = new Map<string, MessageRecord>();
    messages.forEach((msg) => {
      map.set(msg.to, msg);
      map.set(msg.from, msg);
    });
    return map;
  }, [messages]);

  const sendMessage = () => {
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      {
        id: Date.now(),
        from: user?.name ?? "Unknown",
        to: activeRecipient,
        body,
        time: "Just now",
        channel: activeRecipient === customerCareContact ? "client" : "internal",
      },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <Section title="Inbox" subtitle="Internal and client conversations in one panel." noPad>
      <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
        <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
          {recipients.map((recipient) => {
            const latest = lastByRecipient.get(recipient);
            const unread = messages.filter((msg) => msg.to === recipient && msg.channel === "client").length;
            const active = recipient === activeRecipient;
            return (
            <button
              key={recipient}
              onClick={() => setActiveRecipient(recipient)}
              className={`flex w-full items-center gap-3 border-b border-white/8 px-4 py-4 text-left transition hover:bg-white/5 ${active ? "bg-white/5" : ""}`}
            >
              <Avatar name={recipient} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium text-white">{recipient}</div>
                  <div className="text-xs text-white/35">{latest?.time ?? "Now"}</div>
                </div>
                <div className="truncate text-xs text-white/45">{latest?.body ?? (recipient === customerCareContact ? "Customer care routing ready." : "No messages yet.")}</div>
              </div>
              {unread > 0 && <StatusPill tone="cyan">{unread}</StatusPill>}
            </button>
          );
          })}
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-medium text-white">{activeRecipient}</h3>
              <p className="mt-2 text-sm text-white/55">
                Messages are routed to the correct person or customer care contact set in workspace settings.
              </p>
            </div>
            <StatusPill tone={activeRecipient === customerCareContact ? "green" : "blue"}>
              {activeRecipient === customerCareContact ? "Customer care" : "Internal"}
            </StatusPill>
          </div>
          <div className="mt-5 space-y-3">
            {activeMessages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">{message.from}</div>
                  <div className="text-xs text-white/35">{message.time}</div>
                </div>
                <p className="mt-2 text-sm text-white/80">{message.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="grid gap-3 md:grid-cols-[220px_1fr]">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                To: {activeRecipient}
              </div>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                placeholder={`Write a message to ${activeRecipient}...`}
              />
            </div>
            <button onClick={sendMessage} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-3 text-sm font-medium text-white">
              Send
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function AdminCalendarModule() {
  const { user } = useAuth();
  const [events, setEvents] = useStoredState<CalendarEvent[]>(WORKSPACE_CALENDAR_KEY, [
    { id: 1, title: "Proof approval - Bank of Kigali", date: "Today", tone: "blue", createdBy: "System" },
    { id: 2, title: "Delivery pickup - banners", date: "Tomorrow", tone: "green", createdBy: "System" },
    { id: 3, title: "Accounts review", date: "Fri", tone: "amber", createdBy: "System" },
    { id: 4, title: "Client meeting - sewing order", date: "Mon", tone: "red", createdBy: "System" },
  ]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("Today");
  const [eventTone, setEventTone] = useState<CalendarEvent["tone"]>("blue");

  const addEvent = () => {
    const title = eventTitle.trim();
    if (!title) return;
    setEvents((prev) => [
      {
        id: Date.now(),
        title,
        date: eventDate.trim() || "TBA",
        tone: eventTone,
        createdBy: user?.name ?? "Unknown",
      },
      ...prev,
    ]);
    setEventTitle("");
    setEventDate("Today");
    setEventTone("blue");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="This week" value="4" trend="Events scheduled" icon={CalendarDays} accent="#00C6FF" />
        <KpiCard label="Meetings" value="2" trend="Client calls" icon={Users} accent="#F5C518" />
        <KpiCard label="Deliveries" value="1" trend="Pending handoffs" icon={ShoppingBag} accent="#22C55E" />
        <KpiCard label="Announcements" value="3" trend="Broadcasts live" icon={Megaphone} accent="#A78BFA" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Section title="Upcoming" subtitle="Calendar and schedule overview." noPad>
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{event.title}</div>
                    <div className="mt-1 text-xs text-white/45">{event.date}</div>
                  </div>
                  <StatusPill tone={event.tone}>{event.tone}</StatusPill>
                </div>
                <div className="mt-3 text-xs text-white/35">Posted by {event.createdBy}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Add event" subtitle="Post a calendar item for all workspace accounts." noPad>
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Event title</span>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                placeholder="e.g. Client delivery pickup"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">When</span>
                <input
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                  placeholder="Today / Tomorrow / Fri"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Tone</span>
                <select
                  value={eventTone}
                  onChange={(e) => setEventTone(e.target.value as CalendarEvent["tone"])}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none task-select"
                >
                  <option value="blue">blue</option>
                  <option value="green">green</option>
                  <option value="amber">amber</option>
                  <option value="red">red</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={addEvent}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white"
            >
              <Plus size={15} /> Publish to workspace
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function AdminDocumentsModule() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [docs, setDocs] = useStoredState<DocumentItem[]>("duplicator-admin-documents", [
    {
      id: 1,
      title: "Sales Quotation Template",
      type: "PDF",
      updatedAt: "Today",
      href: "/duplicator-catalogue.pdf",
      createdBy: "System",
      content: "Duplicator Ltd Sales Quotation template.",
    },
    {
      id: 2,
      title: "Job Card Template",
      type: "PDF",
      updatedAt: "Today",
      href: "/admin/job-card",
      createdBy: "System",
      content: "Duplicator Ltd job card template for production handoff and print tracking.",
    },
    {
      id: 3,
      title: "Catalogue",
      type: "PDF",
      updatedAt: "Today",
      href: "/duplicator-catalogue.pdf",
      createdBy: "System",
      content: "Duplicator Ltd catalogue asset.",
    },
    {
      id: 4,
      title: "Invoice PDF sample",
      type: "PDF",
      updatedAt: "Yesterday",
      href: "/api/invoices/1/pdf",
      createdBy: "System",
      content: "Invoice PDF sample reference.",
    },
  ]);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<"TXT" | "MD" | "JSON">("TXT");
  const [docContent, setDocContent] = useState("");

  const makeDownload = (doc: DocumentItem) => {
    const mime = doc.type === "JSON" ? "application/json" : "text/plain;charset=utf-8";
    const content = doc.type === "JSON"
      ? JSON.stringify({ title: doc.title, content: doc.content, createdBy: doc.createdBy, updatedAt: doc.updatedAt }, null, 2)
      : doc.content;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/[^\w\-]+/g, "-").toLowerCase()}.${doc.type.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDocument = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setDocs((prev) => [
        {
          id: Date.now(),
          title: file.name.replace(/\.[^.]+$/, ""),
          type: file.name.toLowerCase().endsWith(".json") ? "JSON" : file.name.toLowerCase().endsWith(".md") ? "MD" : "TXT",
          updatedAt: "Just now",
          href: "#",
          createdBy: user?.name ?? "Unknown",
          content: text,
        },
        ...prev,
      ]);
    };
    reader.readAsText(file);
  };

  const createDocument = () => {
    const title = docTitle.trim();
    if (!title || !docContent.trim()) return;
    setDocs((prev) => [
      {
        id: Date.now(),
        title,
        type: docType,
        updatedAt: "Just now",
        href: "#",
        createdBy: user?.name ?? "Unknown",
        content: docContent.trim(),
      },
      ...prev,
    ]);
    setDocTitle("");
    setDocContent("");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Documents" value={String(docs.length)} trend="Available now" icon={FileText} accent="#00C6FF" />
        <KpiCard label="Templates" value="2" trend="Reusable formats" icon={ClipboardList} accent="#F5C518" />
        <KpiCard label="Downloads" value="Export" trend="Direct file links" icon={Download} accent="#22C55E" />
        <KpiCard label="Library" value="Live" trend="No stale copies" icon={Save} accent="#A78BFA" />
      </div>
      <Section title="Document builder" subtitle="Create, import, export, and track who uploaded each file.">
        <div className="grid gap-4 md:grid-cols-3">
          <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Document title" />
          <select value={docType} onChange={(e) => setDocType(e.target.value as "TXT" | "MD" | "JSON")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
            <option value="TXT">TXT</option>
            <option value="MD">Markdown</option>
            <option value="JSON">JSON</option>
          </select>
          <label className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm ${isDark ? "text-white" : "text-[#04091A]"}`}>
            <Upload size={15} />
            Import file
            <input type="file" accept=".txt,.md,.json" className="hidden" onChange={(e) => importDocument(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <textarea
          value={docContent}
          onChange={(e) => setDocContent(e.target.value)}
          rows={6}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35"
          placeholder="Write the document content here..."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={createDocument} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white">
            <FileText size={15} /> Create document
          </button>
        </div>
      </Section>

      <Section title="Document library" subtitle="Fast access to the files the team uses most." noPad>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <div key={doc.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-medium text-white">{doc.title}</div>
                  <div className="mt-1 text-xs text-white/45">{doc.type} · {doc.updatedAt}</div>
                </div>
                <StatusPill tone="blue">{doc.createdBy}</StatusPill>
              </div>
              <p className="mt-3 text-sm text-white/65 line-clamp-4">{doc.content}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => makeDownload(doc)} className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 ${isDark ? "text-white/80" : "text-[#04091A]"}`}>
                  <Download size={14} /> Export
                </button>
                <a href={doc.href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5 ${isDark ? "text-white/80" : "text-[#04091A]"}`}>
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function GalleryModule({ role }: { role: "admin" | "staff" | "client" }) {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const canEdit = role !== "client";
  const poster = user?.name ?? (role === "client" ? "Client viewer" : "Team member");
  const [items, setItems] = useStoredState<GalleryItem[]>(WORKSPACE_GALLERY_KEY, [
    {
      id: 1,
      title: "Bank of Kigali proof board",
      project: "Sales quotation proof",
      client: "Bank of Kigali",
      category: "Design",
      notes: "Clean proof with the approved logo lockup and balanced spacing for print review.",
      mediaUrl: "",
      featured: true,
      status: "published",
      postedBy: "Design team",
      createdAt: "Today",
      updatedAt: "Today",
      ratings: [
        { by: "Sales Manager", value: 5 },
        { by: "Print Operator", value: 4 },
      ],
    },
    {
      id: 2,
      title: "Staff polo embroidery sample",
      project: "Production sample",
      client: "Internal",
      category: "Sewing",
      notes: "First pass of stitching and fabric alignment for the staff uniform order.",
      mediaUrl: "",
      featured: false,
      status: "published",
      postedBy: "Production lead",
      createdAt: "Yesterday",
      updatedAt: "Yesterday",
      ratings: [{ by: "Manager", value: 4 }],
    },
  ]);

  const [draft, setDraft] = useState<GalleryItem>({
    id: 0,
    title: "",
    project: "",
    client: "",
    category: "Design",
    notes: "",
    mediaUrl: "",
    featured: false,
    status: "draft",
    postedBy: poster,
    createdAt: "",
    updatedAt: "",
    ratings: [],
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"All" | GalleryItem["category"]>("All");

  useEffect(() => {
    if (!canEdit) return;
    if (editingId == null) return;
    const found = items.find((item) => item.id === editingId);
    if (found) {
      setDraft(found);
    }
  }, [canEdit, editingId, items]);

  const ratingStats = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.ratings.length, 0);
    const average =
      total === 0 ? 0 : Math.round((items.reduce((sum, item) => sum + item.ratings.reduce((rSum, rating) => rSum + rating.value, 0), 0) / total) * 10) / 10;
    return { total, average };
  }, [items]);

  const updateField = <K extends keyof GalleryItem>(key: K, value: GalleryItem[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const setMediaFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateField("mediaUrl", String(reader.result ?? ""));
      if (!draft.title.trim()) {
        updateField("title", file.name.replace(/\.[^.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  const saveItem = () => {
    if (!canEdit) return;
    const title = draft.title.trim();
    const project = draft.project.trim();
    if (!title || !project) return;

    const stamp = "Just now";
    if (editingId != null) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...draft,
                title,
                project,
                updatedAt: stamp,
                postedBy: item.postedBy || poster,
                id: item.id,
              }
            : item,
        ),
      );
    } else {
      setItems((prev) => [
        {
          ...draft,
          id: Date.now(),
          title,
          project,
          status: draft.status === "published" ? "published" : "draft",
          postedBy: poster,
          createdAt: stamp,
          updatedAt: stamp,
          ratings: [],
        },
        ...prev,
      ]);
    }
    setEditingId(null);
    setDraft({
      id: 0,
      title: "",
      project: "",
      client: "",
      category: "Design",
      notes: "",
      mediaUrl: "",
      featured: false,
      status: "draft",
      postedBy: poster,
      createdAt: "",
      updatedAt: "",
      ratings: [],
    });
  };

  const editItem = (item: GalleryItem) => {
    if (!canEdit) return;
    setEditingId(item.id);
    setDraft(item);
  };

  const deleteItem = (id: number) => {
    if (!canEdit) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const rateItem = (itemId: number, value: number) => {
    const by = poster;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const ratings = item.ratings.filter((rating) => rating.by !== by);
        return {
          ...item,
          ratings: [...ratings, { by, value }],
          updatedAt: "Just now",
        };
      }),
    );
  };

  const categoryOptions = ["Design", "Printing", "Branding", "Sewing", "Packaging", "Photography"] as const;
  const orderedItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...items]
      .filter((item) => (filterCategory === "All" ? true : item.category === filterCategory))
      .filter((item) => {
        if (!needle) return true;
        return [item.title, item.project, item.client, item.category, item.notes, item.postedBy]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => Number(b.featured) - Number(a.featured) || b.id - a.id);
  }, [filterCategory, items, search]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Gallery posts" value={String(items.length)} trend="Shared across accounts" icon={Image} accent="#00C6FF" />
        <KpiCard label="Featured" value={String(items.filter((item) => item.featured).length)} trend="Pinned work samples" icon={Sparkles} accent="#F5C518" />
        <KpiCard label="Ratings" value={String(ratingStats.total)} trend={`${ratingStats.average || 0} average stars`} icon={Star} accent="#22C55E" />
        <KpiCard label="Live status" value={String(items.filter((item) => item.status === "published").length)} trend="Visible to viewers" icon={CheckCircle2} accent="#A78BFA" />
      </div>

      <div className={`grid gap-6 ${canEdit ? "xl:grid-cols-[1.15fr_0.85fr]" : "xl:grid-cols-1"}`}>
        <Section title="Gallery feed" subtitle="Latest work samples, proofs, and production posts." noPad>
          <div className="grid gap-3 border-b border-white/10 p-5 md:grid-cols-[1fr_200px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
              placeholder="Search title, client, category..."
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as "All" | GalleryItem["category"])}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none task-select"
            >
              <option value="All">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-2">
            {orderedItems.map((item) => {
              const avg = item.ratings.length === 0 ? 0 : item.ratings.reduce((sum, rating) => sum + rating.value, 0) / item.ratings.length;
              const previewStyle = item.mediaUrl
                ? { backgroundImage: `url(${item.mediaUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {
                    background: isDark
                      ? "linear-gradient(135deg, rgba(38,69,200,0.22), rgba(0,198,255,0.16))"
                      : "linear-gradient(135deg, rgba(38,69,200,0.12), rgba(0,198,255,0.08))",
                  };

              return (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${isDark ? c.border : c.navBorder}`,
                    borderRadius: 16,
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ minHeight: 180, ...previewStyle }}>
                    {!item.mediaUrl && (
                      <div style={{ minHeight: 180, display: "flex", alignItems: "end", justifyContent: "space-between", padding: 16 }}>
                        <div>
                          <div style={{ color: c.textPrimary, fontSize: 15, fontWeight: 600 }}>{item.title}</div>
                          <div style={{ color: c.textSecondary, fontSize: 12, marginTop: 3 }}>{item.project}</div>
                        </div>
                        <StatusPill tone={item.featured ? "green" : item.status === "published" ? "blue" : "grey"}>{item.status}</StatusPill>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: c.textPrimary, fontSize: 15, fontWeight: 600 }}>{item.title}</div>
                        <div style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{item.project}</div>
                      </div>
                      <StatusPill tone={item.featured ? "green" : item.status === "published" ? "blue" : "grey"}>{item.featured ? "Featured" : item.status}</StatusPill>
                    </div>

                    <div style={{ display: "grid", gap: 8, marginTop: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                      <div style={{ border: `1px solid ${isDark ? c.border : c.borderHover}`, borderRadius: 12, padding: 10 }}>
                        <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Client</div>
                        <div style={{ color: c.textPrimary, fontSize: 12.5, marginTop: 4 }}>{item.client}</div>
                      </div>
                      <div style={{ border: `1px solid ${isDark ? c.border : c.borderHover}`, borderRadius: 12, padding: 10 }}>
                        <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Category</div>
                        <div style={{ color: c.textPrimary, fontSize: 12.5, marginTop: 4 }}>{item.category}</div>
                      </div>
                    </div>

                    <p style={{ color: c.textSecondary, fontSize: 13, lineHeight: 1.5, marginTop: 12 }}>{item.notes}</p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#F5C518" }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <button key={index} type="button" onClick={() => rateItem(item.id, index + 1)} style={{ color: index < Math.round(avg || 0) ? "#F5C518" : isDark ? "rgba(255,255,255,0.18)" : "rgba(4,9,26,0.18)" }}>
                            <Star size={14} fill={index < Math.round(avg || 0) ? "#F5C518" : "none"} />
                          </button>
                        ))}
                        <span style={{ marginLeft: 6, color: c.textMuted, fontSize: 12 }}>{avg ? avg.toFixed(1) : "0.0"}</span>
                      </div>
                      <div style={{ color: c.textFaint, fontSize: 11 }}>{item.ratings.length} rating{item.ratings.length === 1 ? "" : "s"}</div>
                    </div>

                    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <StatusPill tone="blue">{item.postedBy}</StatusPill>
                      <StatusPill tone="green">{item.createdAt}</StatusPill>
                    </div>

                    {canEdit && (
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button
                          type="button"
                          onClick={() => editItem(item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 12,
                            border: `1px solid ${isDark ? c.border : c.navBorder}`,
                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)",
                            color: c.textPrimary,
                            padding: "10px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          <PencilLine size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 12,
                            border: `1px solid ${isDark ? c.border : c.navBorder}`,
                            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.8)",
                            color: c.textPrimary,
                            padding: "10px 12px",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {canEdit && (
          <Section title={editingId == null ? "Upload work" : "Edit work"} subtitle="Add new samples from production, design, or branding." noPad>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Title</span>
                  <input
                    value={draft.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    placeholder="e.g. School banner mockup"
                  />
                </label>
                <label className="block">
                  <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Project</span>
                  <input
                    value={draft.project}
                    onChange={(e) => updateField("project", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    placeholder="e.g. Client proof or production sample"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Client</span>
                  <input
                    value={draft.client}
                    onChange={(e) => updateField("client", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    placeholder="Client or internal department"
                  />
                </label>
                <label className="block">
                  <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Category</span>
                  <select
                    value={draft.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none task-select"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Notes</span>
                <textarea
                  value={draft.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35"
                  placeholder="Describe the work, print specs, or any special instructions..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Media URL or preview file</span>
                  <input
                    value={draft.mediaUrl}
                    onChange={(e) => updateField("mediaUrl", e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                    placeholder="Paste an image link or upload below"
                  />
                </label>
                <label
                  className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm ${isDark ? "text-white" : "text-[#04091A]"}`}
                >
                  <Upload size={15} />
                  Upload image
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" style={{ color: c.textPrimary }}>
                  <span>Featured in gallery</span>
                  <input type="checkbox" checked={draft.featured} onChange={(e) => updateField("featured", e.target.checked)} />
                </label>
                <label className="block">
                  <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Status</span>
                  <select
                    value={draft.status}
                    onChange={(e) => updateField("status", e.target.value as GalleryItem["status"])}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none task-select"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveItem}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white"
                >
                  <Save size={15} /> {editingId == null ? "Publish work" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setDraft({
                      id: 0,
                      title: "",
                      project: "",
                      client: "",
                      category: "Design",
                      notes: "",
                      mediaUrl: "",
                      featured: false,
                      status: "draft",
                      postedBy: poster,
                      createdAt: "",
                      updatedAt: "",
                      ratings: [],
                    });
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium ${isDark ? "text-white/80" : "text-[#04091A]"}`}
                >
                  Reset
                </button>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function RecommendationsModule() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const poster = user?.companyName ?? user?.name ?? "Client";
  const [items, setItems] = useStoredState<RecommendationItem[]>(WORKSPACE_RECOMMENDATIONS_KEY, [
    {
      id: 1,
      title: "Expand business card paper options",
      category: "Printing",
      summary: "Add more premium matte stock options to the printed business card catalog for clients that want a softer finish.",
      priority: "Medium",
      target: "Sales team",
      poster: "Acme Co.",
      createdAt: "Today",
      status: "reviewing",
      contact: "client@example.com",
    },
    {
      id: 2,
      title: "Add more shirt mockups",
      category: "Branding",
      summary: "Include two extra mockup angles for staff polos so we can approve embroidery placement more quickly.",
      priority: "Low",
      target: "Design team",
      poster: "Bank of Kigali",
      createdAt: "Yesterday",
      status: "new",
      contact: "client@example.com",
    },
  ]);

  const [draft, setDraft] = useState<RecommendationItem>({
    id: 0,
    title: "",
    category: "Printing",
    summary: "",
    priority: "Medium",
    target: "Sales team",
    poster,
    createdAt: "",
    status: "new",
    contact: user?.email ?? "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (editingId == null) return;
    const found = items.find((item) => item.id === editingId);
    if (found) setDraft(found);
  }, [editingId, items]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      newCount: items.filter((item) => item.status === "new").length,
      reviewing: items.filter((item) => item.status === "reviewing").length,
      actioned: items.filter((item) => item.status === "actioned").length,
    };
  }, [items]);

  const updateField = <K extends keyof RecommendationItem>(key: K, value: RecommendationItem[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const saveRecommendation = () => {
    const title = draft.title.trim();
    const summary = draft.summary.trim();
    if (!title || !summary) return;

    const stamp = "Just now";
    if (editingId != null) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                ...draft,
                title,
                summary,
                createdAt: item.createdAt,
                poster: item.poster || poster,
                id: item.id,
              }
            : item,
        ),
      );
    } else {
      setItems((prev) => [
        {
          ...draft,
          id: Date.now(),
          title,
          summary,
          poster,
          createdAt: stamp,
          status: "new",
        },
        ...prev,
      ]);
    }

    setEditingId(null);
    setDraft({
      id: 0,
      title: "",
      category: "Printing",
      summary: "",
      priority: "Medium",
      target: "Sales team",
      poster,
      createdAt: "",
      status: "new",
      contact: user?.email ?? "",
    });
  };

  const editRecommendation = (item: RecommendationItem) => {
    setEditingId(item.id);
    setDraft(item);
  };

  const removeRecommendation = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const setStatus = (id: number, status: RecommendationItem["status"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const priorityTone: Record<RecommendationItem["priority"], "red" | "amber" | "green"> = {
    High: "red",
    Medium: "amber",
    Low: "green",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Recommendations" value={String(stats.total)} trend="Client ideas" icon={MessageSquare} accent="#00C6FF" />
        <KpiCard label="New" value={String(stats.newCount)} trend="Awaiting review" icon={Plus} accent="#F5C518" />
        <KpiCard label="Reviewing" value={String(stats.reviewing)} trend="In the pipeline" icon={Search} accent="#22C55E" />
        <KpiCard label="Actioned" value={String(stats.actioned)} trend="Completed items" icon={CheckCircle2} accent="#A78BFA" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Section title="Client recommendation setup" subtitle="Clients can post ideas, requests, and feedback for the team." noPad>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Title</span>
                <input
                  value={draft.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="e.g. Add a foil finish option"
                />
              </label>
              <label className="block">
                <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none task-select"
                >
                  <option>Printing</option>
                  <option>Branding</option>
                  <option>Design</option>
                  <option>Sewing</option>
                  <option>Packaging</option>
                  <option>Service</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Summary</span>
              <textarea
                value={draft.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35"
                placeholder="Describe what you'd like the company to add, improve, or quote."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Priority</span>
                <select
                  value={draft.priority}
                  onChange={(e) => updateField("priority", e.target.value as RecommendationItem["priority"])}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none task-select"
                >
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </label>
              <label className="block">
                <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Target team</span>
                <input
                  value={draft.target}
                  onChange={(e) => updateField("target", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="Sales team, design team, etc."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span style={{ display: "block", marginBottom: 8, color: c.textMuted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em" }}>Contact</span>
                <input
                  value={draft.contact}
                  onChange={(e) => updateField("contact", e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
                  placeholder="Email or phone for follow-up"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm" style={{ color: c.textPrimary }}>
                <span>Posted by</span>
                <span className="font-semibold">{poster}</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveRecommendation}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white"
              >
                <Save size={15} /> {editingId == null ? "Post recommendation" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setDraft({
                    id: 0,
                    title: "",
                    category: "Printing",
                    summary: "",
                    priority: "Medium",
                    target: "Sales team",
                    poster,
                    createdAt: "",
                    status: "new",
                    contact: user?.email ?? "",
                  });
                }}
                className={`inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium ${isDark ? "text-white/80" : "text-[#04091A]"}`}
              >
                Reset
              </button>
            </div>
          </div>
        </Section>

        <Section title="Recommendation board" subtitle="Everything clients post stays visible for review and follow-up." noPad>
          <div className="space-y-3 p-5">
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${isDark ? c.border : c.navBorder}`,
                  borderRadius: 16,
                  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
                  padding: 16,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div style={{ color: c.textPrimary, fontSize: 15, fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{item.category} · Posted by {item.poster}</div>
                  </div>
                  <StatusPill tone={priorityTone[item.priority]}>{item.priority}</StatusPill>
                </div>
                <p style={{ color: c.textSecondary, fontSize: 13, lineHeight: 1.55, marginTop: 12 }}>{item.summary}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div style={{ border: `1px solid ${isDark ? c.border : c.borderHover}`, borderRadius: 12, padding: 10 }}>
                    <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Target</div>
                    <div style={{ color: c.textPrimary, fontSize: 12.5, marginTop: 4 }}>{item.target}</div>
                  </div>
                  <div style={{ border: `1px solid ${isDark ? c.border : c.borderHover}`, borderRadius: 12, padding: 10 }}>
                    <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Contact</div>
                    <div style={{ color: c.textPrimary, fontSize: 12.5, marginTop: 4 }}>{item.contact || "Not set"}</div>
                  </div>
                  <div style={{ border: `1px solid ${isDark ? c.border : c.borderHover}`, borderRadius: 12, padding: 10 }}>
                    <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Status</div>
                    <div style={{ color: c.textPrimary, fontSize: 12.5, marginTop: 4 }}>{item.status}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusPill tone="blue">{item.createdAt}</StatusPill>
                  <StatusPill tone="grey">{item.poster}</StatusPill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => editRecommendation(item)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${isDark ? "border-white/10 text-white/80" : "border-[#cad7f5] text-[#04091A]"}`}
                  >
                    <PencilLine size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(item.id, item.status === "new" ? "reviewing" : item.status === "reviewing" ? "actioned" : "new")}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${isDark ? "border-white/10 text-white/80" : "border-[#cad7f5] text-[#04091A]"}`}
                  >
                    <CheckCircle2 size={14} /> Cycle status
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRecommendation(item.id)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${isDark ? "border-white/10 text-white/80" : "border-[#cad7f5] text-[#04091A]"}`}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function AdminAnnouncementsModule() {
  const { user } = useAuth();
  const [posts, setPosts] = useStoredState<Announcement[]>("duplicator-announcements", [
    { id: 1, title: "Brand update approved", body: "Use the new quotation form for all internal sales documents.", audience: "All staff", date: "Today", createdBy: "System" },
    { id: 2, title: "Payment reminder", body: "Confirm balances before marking invoices complete.", audience: "Sales + Accounts", date: "Yesterday", createdBy: "System" },
  ]);
  const [draft, setDraft] = useState("");
  return (
    <Section title="Announcements" subtitle="Broadcast team updates without leaving the dashboard." noPad>
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-medium text-white">{post.title}</h3>
                <StatusPill tone="blue">{post.audience}</StatusPill>
              </div>
              <p className="mt-2 text-sm text-white/65">{post.body}</p>
              <div className="mt-3 text-xs text-white/35">{post.date} · Posted by {post.createdBy}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.14em] text-white/45">New broadcast</h3>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder="Write an announcement..."
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35"
          />
          <button
            onClick={() => {
              if (!draft.trim()) return;
              setPosts((prev) => [{ id: Date.now(), title: "Manual update", body: draft.trim(), audience: "All staff", date: "Just now", createdBy: user?.name ?? "Unknown" }, ...prev]);
              setDraft("");
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white"
          >
            <Megaphone size={15} /> Publish
          </button>
        </div>
      </div>
    </Section>
  );
}

function AdminSettingsModule() {
  const [receiverSignature, setReceiverSignature] = useStoredState("duplicator-receiver-signature", "Receiver");
  const [senderSignature, setSenderSignature] = useStoredState("duplicator-sender-signature", "Sales Manager");
  const [defaultPayment, setDefaultPayment] = useStoredState("duplicator-payment-method", "Bank transfer");
  const [customerCareContact, setCustomerCareContact] = useStoredState(WORKSPACE_CUSTOMER_CARE_KEY, "Customer Care Desk");
  const [taskVisibility, setTaskVisibility] = useStoredState("duplicator-task-visibility", "Owner + Manager + Assigned staff");
  const [approvalMode, setApprovalMode] = useStoredState("duplicator-approval-mode", "Manager approval");
  const [auditTrail, setAuditTrail] = useStoredState("duplicator-audit-trail", true);
  const [documentControls, setDocumentControls] = useStoredState("duplicator-document-controls", true);
  return (
    <Section title="Settings" subtitle="Business defaults that flow through the workspace." noPad>
      <div className="grid gap-4 p-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-white/45">Company defaults</h3>
          <label className="mb-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Receiver signature</span>
            <select value={receiverSignature} onChange={(e) => setReceiverSignature(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
              {SIGNATURE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="mb-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Sender signature</span>
            <select value={senderSignature} onChange={(e) => setSenderSignature(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
              {SIGNATURE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Default payment method</span>
            <select value={defaultPayment} onChange={(e) => setDefaultPayment(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
              {PAYMENT_METHODS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Customer care contact</span>
            <select value={customerCareContact} onChange={(e) => setCustomerCareContact(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
              {MESSAGE_RECIPIENTS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>
          </label>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-white/45">Management controls</h3>
          <label className="mb-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Task visibility</span>
            <select value={taskVisibility} onChange={(e) => setTaskVisibility(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
              <option>Owner + Manager + Assigned staff</option>
              <option>Owner + Manager only</option>
              <option>Everyone in workspace</option>
            </select>
          </label>
          <label className="mb-4 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.12em] text-white/45">Approval mode</span>
            <select value={approvalMode} onChange={(e) => setApprovalMode(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none">
              <option>Manager approval</option>
              <option>Owner approval</option>
              <option>Auto-approve low-risk work</option>
            </select>
          </label>
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
              <span>Audit trail</span>
              <input type="checkbox" checked={auditTrail} onChange={(e) => setAuditTrail(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
              <span>Document controls</span>
              <input type="checkbox" checked={documentControls} onChange={(e) => setDocumentControls(e.target.checked)} />
            </label>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.14em] text-white/45">Business identity</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p><span className="text-white/45">Company:</span> DUPLICATOR LTD.</p>
            <p><span className="text-white/45">Tagline:</span> PRINTING | BRANDING | SEWING</p>
            <p><span className="text-white/45">TIN/TVA:</span> 102062874</p>
            <p><span className="text-white/45">Email:</span> duplicator10@gmail.com</p>
            <p><span className="text-white/45">Phone:</span> (+250)788355226</p>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <div className="text-xs uppercase tracking-[0.12em] text-white/45">What managers can track</div>
            <ul className="mt-2 space-y-2">
              <li>All tasks, assignees, and posted-by metadata</li>
              <li>Quotation flow, document exports, and approvals</li>
              <li>Customer care routing for portal messages</li>
              <li>Receivables, order progress, and client activity</li>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

function AdminEmployeesModule() {
  const [tasks] = useStoredState<Task[]>(WORKSPACE_TASKS_KEY, []);
  const employees = useMemo(() => {
    return EMPLOYEE_ROSTER.map((name) => {
      const assigned = tasks.filter((task) => task.owner === name);
      const done = assigned.filter((task) => task.status === "done").length;
      const doing = assigned.filter((task) => task.status === "doing").length;
      const open = assigned.filter((task) => task.status === "todo").length;
      const progress = assigned.length === 0 ? 0 : Math.round((done / assigned.length) * 100);
      const latest = assigned[0]?.title ?? "No tasks assigned yet";
      return {
        name,
        assigned: assigned.length,
        done,
        doing,
        open,
        progress,
        latest,
      };
    });
  }, [tasks]);

  const totalAssigned = employees.reduce((sum, emp) => sum + emp.assigned, 0);
  const totalDone = employees.reduce((sum, emp) => sum + emp.done, 0);
  const totalDoing = employees.reduce((sum, emp) => sum + emp.doing, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Employees" value={String(employees.length)} trend="Team roster" icon={Users} accent="#00C6FF" />
        <KpiCard label="Assigned tasks" value={String(totalAssigned)} trend="All active workloads" icon={ClipboardList} accent="#F5C518" />
        <KpiCard label="Completed tasks" value={String(totalDone)} trend={`${totalDoing} in progress`} icon={CheckCircle2} accent="#22C55E" />
      </div>

      <Section title="Employee progress" subtitle="See how each person is moving through assigned work." noPad>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <div key={employee.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-medium text-white">{employee.name}</div>
                  <div className="mt-1 text-xs text-white/45">
                    {employee.assigned} task{employee.assigned === 1 ? "" : "s"} assigned
                  </div>
                </div>
                <StatusPill tone={employee.progress >= 80 ? "green" : employee.progress >= 45 ? "amber" : "blue"}>
                  {employee.progress}%
                </StatusPill>
              </div>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <div className="flex justify-between"><span>Open</span><span>{employee.open}</span></div>
                <div className="flex justify-between"><span>Doing</span><span>{employee.doing}</span></div>
                <div className="flex justify-between"><span>Done</span><span>{employee.done}</span></div>
              </div>
              <div className="mt-4">
                <ProgressBar value={employee.progress} accent="#00C6FF" />
              </div>
              <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/65">
                Latest task: {employee.latest}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function StaffTasksModule() {
  const { c } = useTheme();
  const { data: orders } = useListOrders({
    query: { queryKey: [...getListOrdersQueryKey(), "staff-work"], staleTime: 30_000 },
  });
  const rows = orders?.orders ?? [];
  const [selectedId, setSelectedId] = useState<string | number | null>(rows[0]?.id ?? null);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  return (
    <div className="space-y-6">
      <Section title="Assigned work" subtitle="Live orders assigned to this staff account. Click any row for details." noPad>
        <DataTable
          columns={[
            { key: "orderNumber", header: "Order", render: (r: typeof rows[number]) => <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.orderNumber}</span> },
            { key: "title", header: "Task", render: (r: typeof rows[number]) => <span className="font-medium text-white">{r.title}</span> },
            { key: "client", header: "Client", render: (r: typeof rows[number]) => <span className="text-white/55">{r.client.name}</span> },
            { key: "amount", header: "Amount", align: "right" as const, render: (r: typeof rows[number]) => <span>{formatFRW(r.subtotalAmount)}</span> },
            { key: "status", header: "Status", align: "right" as const, render: (r: typeof rows[number]) => <StatusPill tone={statusTone(r.status)}>{r.status}</StatusPill> },
          ]}
          rows={rows}
          emptyText="No assigned work yet."
          onRowClick={(row) => setSelectedId(row.id)}
        />
      </Section>

      {selected && (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Section title="Task details" subtitle="Opened from the selected row." noPad>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div style={{ color: c.textPrimary, fontSize: 18, fontWeight: 600 }}>{selected.title}</div>
                  <div style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>Order {selected.orderNumber}</div>
                </div>
                <StatusPill tone={statusTone(selected.status)}>{selected.status}</StatusPill>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Client</div>
                  <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>{selected.client.name}</div>
                </div>
                <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Amount</div>
                  <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>{formatFRW(selected.subtotalAmount)}</div>
                </div>
                <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Assigned to</div>
                  <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>{selected.assignedTo?.name ?? "Production team"}</div>
                </div>
                <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Placed</div>
                  <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>{formatDate(selected.createdAt)}</div>
                </div>
              </div>
              <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Summary</div>
                <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
                  Open the order detail page to see the full notes, timeline, and status controls for this job.
                </div>
              </div>
            </div>
          </Section>

          <Section title="Workspace actions" subtitle="Track progress without losing the assignment context." noPad>
            <div className="space-y-3 p-5">
              <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Move task</div>
                <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>Use the dashboard status controls to move this work when it changes stage.</div>
              </div>
              <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Posted by</div>
                <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>Sales desk</div>
              </div>
              <div style={{ border: `1px solid ${c.navBorder}`, borderRadius: 14, padding: 14 }}>
                <div style={{ color: c.textFaint, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em" }}>Items</div>
                <div style={{ color: c.textPrimary, fontSize: 13, marginTop: 4 }}>{selected.itemCount}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(rows[0]?.id ?? null)}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-3 text-sm font-medium text-white"
              >
                Focus latest task
              </button>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

function StaffMessagesModule() {
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useStoredState<MessageThread[]>("duplicator-staff-threads", [
    { id: 1, name: "Production lead", last: "Check the final cut sizes.", time: "4 min", unread: 1 },
    { id: 2, name: "Client support", last: "Awaiting proof approval.", time: "1 h", unread: 0 },
  ]);
  return (
    <Section title="Messages" subtitle="Quick production handoff conversations." noPad>
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="border-r border-white/10">
          {thread.map((t) => (
            <div key={t.id} className="border-b border-white/8 px-4 py-4">
              <div className="text-sm font-medium text-white">{t.name}</div>
              <div className="mt-1 text-xs text-white/45">{t.last}</div>
            </div>
          ))}
        </div>
        <div className="p-5">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} placeholder="Write an update..." className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35" />
          <button className="mt-3 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white">Send update</button>
        </div>
      </div>
    </Section>
  );
}

function ClientProfileModule() {
  const { user } = useAuth();
  const { c } = useTheme();
  const { data: invoices } = useListInvoices({
    query: { queryKey: [...getListInvoicesQueryKey(), "profile"], staleTime: 30_000 },
  });
  const myInvoices = invoices?.invoices ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Invoices" value={String(myInvoices.length)} trend="Visible to this account" icon={FileText} accent="#00C6FF" />
        <KpiCard label="Outstanding" value={formatFRW(myInvoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0))} trend="Balance due" icon={Wallet} accent="#F5C518" />
        <KpiCard label="Profile" value={user?.name ?? "Client"} trend={user?.companyName ?? "Account owner"} icon={Users} accent="#22C55E" />
        <KpiCard label="Quotes" value="Live" trend="Request tracker" icon={Sparkles} accent="#A78BFA" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Section title="Account profile" subtitle="Update the details that appear on orders and quotations.">
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" defaultValue={user?.name ?? ""} />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" defaultValue={user?.companyName ?? ""} />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" defaultValue={user?.email ?? ""} />
            <input className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" defaultValue={user?.phone ?? ""} />
          </div>
        </Section>

        <Section title="Company info" subtitle="What appears on your documents and the quotation paper.">
          <div className="space-y-2 text-sm text-white/70">
            <p><span className="text-white/45">Company:</span> DUPLICATOR LTD.</p>
            <p><span className="text-white/45">Email:</span> duplicator10@gmail.com</p>
            <p><span className="text-white/45">Phone:</span> (+250)788355226</p>
            <p><span className="text-white/45">Address:</span> P.O. Box 6332 Kigali / KN 78St 69</p>
          </div>
        </Section>
      </div>

      <Section title="Recent invoices" subtitle="Recent billing records for this account." noPad>
        <DataTable
          columns={[
            { key: "invoiceNumber", header: "Invoice", render: (r: typeof myInvoices[number]) => <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.invoiceNumber}</span> },
            { key: "order", header: "Order", render: (r: typeof myInvoices[number]) => <span>{r.order.orderNumber}</span> },
            { key: "balance", header: "Balance", align: "right" as const, render: (r: typeof myInvoices[number]) => <span>{formatFRW(r.balanceDue)}</span> },
            { key: "status", header: "Status", align: "right" as const, render: (r: typeof myInvoices[number]) => <StatusPill tone={r.isOverdue ? "red" : "green"}>{r.isOverdue ? "Overdue" : r.status}</StatusPill> },
          ]}
          rows={myInvoices}
          emptyText="No invoices yet."
        />
      </Section>
    </div>
  );
}

function ClientMessagesModule() {
  const { user } = useAuth();
  const [customerCareContact] = useStoredState(WORKSPACE_CUSTOMER_CARE_KEY, "Customer Care Desk");
  const [messages, setMessages] = useStoredState<MessageRecord[]>(WORKSPACE_MESSAGES_KEY, []);
  const [draft, setDraft] = useState("");
  const clientName = user?.companyName ?? user?.name ?? "Client";
  const visible = messages.filter((msg) => msg.to === customerCareContact || msg.from === customerCareContact || msg.from === clientName);

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setMessages((prev) => [
      {
        id: Date.now(),
        from: clientName,
        to: customerCareContact,
        body,
        time: "Just now",
        channel: "client",
      },
      ...prev,
    ]);
    setDraft("");
  };

  return (
    <Section title="Messages" subtitle="Your messages go directly to the customer care contact assigned by the team." noPad>
      <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
        <div className="border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs uppercase tracking-[0.12em] text-white/40">Customer care</div>
              <div className="mt-2 text-base font-medium text-white">{customerCareContact}</div>
              <div className="mt-1 text-sm text-white/55">This is the person your message will reach.</div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="space-y-3">
            {visible.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-white/55">
                No messages yet. Send your first note to customer care.
              </div>
            ) : (
              visible.map((message) => (
                <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-white">{message.from}</div>
                    <div className="text-xs text-white/35">{message.time}</div>
                  </div>
                  <p className="mt-2 text-sm text-white/80">{message.body}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
              To: {customerCareContact}
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder="Write your message to customer care..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35"
            />
            <button onClick={send} className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-3 text-sm font-medium text-white">
              Send to customer care
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ClientQuotesModule() {
  const [requests, setRequests] = useStoredState<QuoteRequest[]>("duplicator-client-quotes", [
    { id: 1, subject: "A4 branded notebooks", qty: "500 pcs", status: "reviewing", createdAt: "Today" },
    { id: 2, subject: "PVC banner rollout", qty: "6 banners", status: "quoted", createdAt: "Yesterday" },
  ]);
  const [subject, setSubject] = useState("");
  const [qty, setQty] = useState("");
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Requests" value={String(requests.length)} trend="Quote history" icon={ClipboardList} accent="#00C6FF" />
        <KpiCard label="Reviewing" value={String(requests.filter((r) => r.status === "reviewing").length)} trend="Awaiting reply" icon={Bell} accent="#F5C518" />
        <KpiCard label="Quoted" value={String(requests.filter((r) => r.status === "quoted").length)} trend="Ready to accept" icon={Sparkles} accent="#22C55E" />
        <KpiCard label="Closed" value={String(requests.filter((r) => r.status === "closed").length)} trend="Archived" icon={CheckCircle2} accent="#A78BFA" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Section title="Quote request form" subtitle="A simple internal-style form that matches the rest of the app.">
          <div className="grid gap-4 md:grid-cols-2">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Subject" />
            <input value={qty} onChange={(e) => setQty(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" placeholder="Quantity / size" />
          </div>
          <textarea rows={4} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-white/35" placeholder="Describe what you need..." />
          <button
            onClick={() => {
              if (!subject.trim()) return;
              setRequests((prev) => [{ id: Date.now(), subject: subject.trim(), qty: qty.trim(), status: "new", createdAt: "Just now" }, ...prev]);
              setSubject("");
              setQty("");
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white"
          >
            <Save size={15} /> Submit request
          </button>
        </Section>

        <Section title="Request status" subtitle="Your latest quotations at a glance.">
          <div className="space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-white">{request.subject}</div>
                    <div className="text-xs text-white/45">{request.qty}</div>
                  </div>
                  <StatusPill tone={request.status === "new" ? "grey" : request.status === "reviewing" ? "amber" : request.status === "quoted" ? "blue" : "green"}>{request.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function nextTaskStatus(status: Task["status"]): Task["status"] {
  if (status === "todo") return "doing";
  if (status === "doing") return "done";
  return "todo";
}

function statusTone(status: OrderStatus): "blue" | "green" | "amber" | "red" | "grey" | "cyan" {
  if (status === "ready" || status === "delivered") return "green";
  if (status === "in_production") return "amber";
  if (status === "cancelled") return "red";
  if (status === "quoted") return "cyan";
  if (status === "approved") return "blue";
  return "grey";
}

function AdminInvitesModule() {
  const { isDark } = useTheme();
  const { data, refetch } = useListInvites({
    query: { queryKey: getListInvitesQueryKey() }
  });
  const createInvite = useCreateInvite();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<any>("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createInvite.mutateAsync({ data: { email, role } });
      setEmail("");
      setRole("staff");
      refetch();
    } catch (err: any) {
      setError(err.data?.error || "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const invites = data?.invites || [];

  return (
    <div className="space-y-6">
      <Section title="Invite team member" subtitle="Generate a one-time code for a specific email and role.">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
            placeholder="colleague@duplicator.rw"
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
          >
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2645C8] to-[#00C6FF] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate code"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </Section>

      <Section title="Active invitations" subtitle="One-time codes that haven't been redeemed yet." noPad>
        <DataTable
          columns={[
            { key: "email", header: "Email", render: (r: any) => <span>{r.email}</span> },
            { key: "role", header: "Target Role", render: (r: any) => <StatusPill tone="blue">{r.role}</StatusPill> },
            { key: "code", header: "Code", render: (r: any) => <code className="rounded bg-white/10 px-2 py-1 font-mono text-sm">{r.code}</code> },
            { key: "status", header: "Status", align: "right" as const, render: (r: any) => r.usedAt ? <StatusPill tone="green">Used</StatusPill> : <StatusPill tone="amber">Pending</StatusPill> },
          ]}
          rows={invites}
          emptyText="No invitations found."
        />
      </Section>
    </div>
  );
}
