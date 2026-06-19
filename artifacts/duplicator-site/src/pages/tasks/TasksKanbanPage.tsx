import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Section } from "@/components/dashboard/Primitives";
import { useAuth } from "@/context/auth";
import { useTheme } from "@/context/ThemeContext";
import {
  useListTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  getListTasksQueryKey,
  type TaskSummary,
  type TaskStatus,
  type TaskPriority,
  type CreateTaskInput,
} from "@/lib/api-stub";
import {
  Plus,
  Clock,
  CircleAlert as AlertCircle,
  ListChecks,
  CheckCircle2,
  ArrowRight,
  Eye,
  Trash2,
  X,
  ChevronDown,
  CalendarDays,
  User,
  Loader2,
} from "lucide-react";

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "todo",        label: "To Do",       accent: "#94A3B8" },
  { status: "in_progress", label: "In Progress",  accent: "#00C6FF" },
  { status: "review",      label: "Review",       accent: "#F5C518" },
  { status: "done",        label: "Done",         accent: "#22C55E" },
];

const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  low: "#94A3B8",
  medium: "#2645C8",
  high: "#F5C518",
  urgent: "#EF4444",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function formatDueDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

interface CreateModalProps {
  onClose: () => void;
  onCreate: (data: CreateTaskInput) => void;
  loading: boolean;
  error: string | null;
  isDark: boolean;
  c: ReturnType<typeof useTheme>["c"];
}

function CreateTaskModal({ onClose, onCreate, loading, error, isDark, c }: CreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    color: c.textPrimary,
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "100%", maxWidth: 480,
          background: isDark ? "rgba(4,9,26,0.96)" : "#fff",
          border: `1px solid ${c.border}`,
          borderRadius: 16, padding: 28,
          backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: c.textPrimary }}>
            New Task
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: c.textMuted, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: 5, display: "block" }}>
              Title *
            </label>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: 5, display: "block" }}>
              Description
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: 5, display: "block" }}>
                Priority
              </label>
              <select style={selectStyle} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: 5, display: "block" }}>
                Column
              </label>
              <select style={selectStyle} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                {COLUMNS.map((col) => (
                  <option key={col.status} value={col.status}>{col.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: c.textMuted, fontFamily: "'Inter', sans-serif", marginBottom: 5, display: "block" }}>
              Due date
            </label>
            <input
              type="date"
              style={inputStyle}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#FCA5A5", display: "flex", gap: 6, alignItems: "center" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px", borderRadius: 8, border: `1px solid ${c.border}`,
                background: "transparent", color: c.textSecondary,
                fontFamily: "'Inter', sans-serif", fontSize: 13, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              style={{
                padding: "9px 20px", borderRadius: 8, border: "none",
                background: loading ? "rgba(38,69,200,0.5)" : "#2645C8",
                color: "#fff", fontFamily: "'Inter', sans-serif",
                fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={13} />}
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CardMenuProps {
  task: TaskSummary;
  isAdmin: boolean;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
  isDark: boolean;
  c: ReturnType<typeof useTheme>["c"];
}

function CardMenu({ task, isAdmin, onMove, onDelete, isDark, c }: CardMenuProps) {
  const [open, setOpen] = useState(false);
  const nextCols = COLUMNS.filter((col) => col.status !== task.status);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          background: "none", border: "none", color: c.textMuted,
          cursor: "pointer", padding: "2px 4px", borderRadius: 5,
          display: "flex", alignItems: "center",
        }}
      >
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute", right: 0, top: "100%", zIndex: 60,
              background: isDark ? "rgba(8,14,40,0.97)" : "#fff",
              border: `1px solid ${c.border}`, borderRadius: 10,
              padding: "6px 0", minWidth: 160,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ padding: "4px 12px 2px", fontSize: 10, color: c.textMuted, fontFamily: "'Inter', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Move to
            </div>
            {nextCols.map((col) => (
              <button
                key={col.status}
                onClick={(e) => { e.stopPropagation(); onMove(col.status); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", background: "none", border: "none",
                  color: c.textSecondary, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  fontSize: 13, textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.accent, flexShrink: 0 }} />
                {col.label}
              </button>
            ))}
            {isAdmin && (
              <>
                <div style={{ margin: "4px 12px", borderTop: `1px solid ${c.border}` }} />
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", background: "none", border: "none",
                    color: "#FCA5A5", cursor: "pointer", fontFamily: "'Inter', sans-serif",
                    fontSize: 13, textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: TaskSummary;
  isAdmin: boolean;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
  isDark: boolean;
  c: ReturnType<typeof useTheme>["c"];
}

function TaskCard({ task, isAdmin, onMove, onDelete, isDark, c }: TaskCardProps) {
  const dueTxt = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate) && task.status !== "done";

  return (
    <div
      style={{
        background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${isDark ? c.border : c.navBorder}`,
        borderLeft: `3px solid ${PRIORITY_ACCENT[task.priority]}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 8,
        transition: "border-color 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.14)" : "#CBD5E1")}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderTopColor = isDark ? c.border : c.navBorder;
        e.currentTarget.style.borderRightColor = isDark ? c.border : c.navBorder;
        e.currentTarget.style.borderBottomColor = isDark ? c.border : c.navBorder;
        e.currentTarget.style.borderLeftColor = PRIORITY_ACCENT[task.priority];
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: c.textPrimary, lineHeight: 1.4, flex: 1 }}>
          {task.title}
        </div>
        <CardMenu task={task} isAdmin={isAdmin} onMove={onMove} onDelete={onDelete} isDark={isDark} c={c} />
      </div>

      {task.description && (
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 5, lineHeight: 1.45, fontFamily: "'Inter', sans-serif" }}>
          {task.description.length > 90 ? task.description.slice(0, 90) + "…" : task.description}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600,
              letterSpacing: "0.05em", textTransform: "uppercase",
              color: PRIORITY_ACCENT[task.priority],
              background: `${PRIORITY_ACCENT[task.priority]}18`,
              padding: "2px 7px", borderRadius: 20,
            }}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
          {dueTxt && (
            <span
              style={{
                fontSize: 11, fontFamily: "'Inter', sans-serif",
                color: overdue ? "#FCA5A5" : c.textMuted,
                display: "flex", alignItems: "center", gap: 3,
              }}
            >
              <CalendarDays size={11} /> {dueTxt}
            </span>
          )}
        </div>
        {task.assignee && (
          <div
            style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "linear-gradient(135deg,#2645C8,#00C6FF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif",
              flexShrink: 0,
            }}
            title={task.assignee.name}
          >
            {task.assignee.name[0]?.toUpperCase()}
          </div>
        )}
        {!task.assignee && (
          <div style={{ color: c.textMuted, opacity: 0.4 }} title="Unassigned">
            <User size={14} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TasksKanbanPage() {
  const { user } = useAuth();
  const { c, isDark } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const tasksQ = useListTasks({ query: { queryKey: getListTasksQueryKey(), staleTime: 10_000, refetchOnWindowFocus: true } });
  const createM = useCreateTask();
  const updateM = useUpdateTask();
  const deleteM = useDeleteTask();

  if (!user) return null;
  const isAdmin = user.role === "super_admin" || user.role === "admin";

  const tasks = tasksQ.data?.tasks ?? [];

  function handleCreate(data: CreateTaskInput) {
    setCreateError(null);
    createM.mutate({ data }, {
      onSuccess: () => setShowCreate(false),
      onError: (err) => setCreateError((err as Error).message),
    });
  }

  function handleMove(task: TaskSummary, status: TaskStatus) {
    updateM.mutate({ id: task.id, data: { status } });
  }

  function handleDelete(task: TaskSummary) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    deleteM.mutate({ id: task.id });
  }

  const subtitle = isAdmin
    ? "Manage all tasks across the team."
    : "Your assigned tasks — move cards when you progress.";

  return (
    <DashboardLayout title="Tasks" subtitle={subtitle}>
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tasksQ.isLoading && (
            <span style={{ fontSize: 12, color: c.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
              <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Loading…
            </span>
          )}
          {tasksQ.isError && (
            <span style={{ fontSize: 12, color: "#FCA5A5", display: "flex", alignItems: "center", gap: 5 }}>
              <AlertCircle size={13} /> {(tasksQ.error as Error).message}
            </span>
          )}
          {!tasksQ.isLoading && !tasksQ.isError && (
            <span style={{ fontSize: 12, color: c.textMuted, fontFamily: "'Inter', sans-serif" }}>
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 9, border: "none",
              background: "#2645C8", color: "#fff",
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> New Task
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          alignItems: "start",
          overflowX: "auto",
          minWidth: 0,
        }}
        className="kanban-grid"
      >
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status}>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
                  padding: "10px 14px",
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                  border: `1px solid ${isDark ? c.border : c.navBorder}`,
                  borderTop: `3px solid ${col.accent}`,
                  borderRadius: "0 0 10px 10px",
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: c.textPrimary, flex: 1 }}>
                  {col.label}
                </span>
                <span
                  style={{
                    fontSize: 11, fontWeight: 700, fontFamily: "'Inter', sans-serif",
                    background: `${col.accent}22`, color: col.accent,
                    padding: "2px 8px", borderRadius: 20,
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {colTasks.length === 0 && !tasksQ.isLoading && (
                <div
                  style={{
                    padding: "24px 14px", textAlign: "center",
                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                    border: `1px dashed ${isDark ? "rgba(255,255,255,0.08)" : "#CBD5E1"}`,
                    borderRadius: 10,
                    color: c.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 12,
                  }}
                >
                  Empty
                </div>
              )}

              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isAdmin={isAdmin}
                  onMove={(status) => handleMove(task, status)}
                  onDelete={() => handleDelete(task)}
                  isDark={isDark}
                  c={c}
                />
              ))}
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateTaskModal
          onClose={() => { setShowCreate(false); setCreateError(null); }}
          onCreate={handleCreate}
          loading={createM.isPending}
          error={createError}
          isDark={isDark}
          c={c}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .kanban-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .kanban-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </DashboardLayout>
  );
}
