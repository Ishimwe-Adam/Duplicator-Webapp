import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasksTable, usersTable } from "@workspace/db";
import { eq, inArray, desc } from "drizzle-orm";
import type { TaskStatus, TaskPriority } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const ADMIN_ROLES = ["super_admin", "admin", "manager"] as const;
const STAFF_OR_ADMIN = ["super_admin", "admin", "staff"] as const;

const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

function isTaskStatus(v: unknown): v is TaskStatus {
  return typeof v === "string" && (TASK_STATUSES as readonly string[]).includes(v);
}
function isTaskPriority(v: unknown): v is TaskPriority {
  return typeof v === "string" && (TASK_PRIORITIES as readonly string[]).includes(v);
}

function parseCreateBody(body: unknown): { ok: true; data: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; assigneeId?: number | null; orderId?: number | null; dueDate?: string | null } } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || b.title.trim().length === 0 || b.title.length > 300)
    return { ok: false, error: "title is required (max 300 chars)" };
  if (b.status !== undefined && !isTaskStatus(b.status))
    return { ok: false, error: "Invalid status" };
  if (b.priority !== undefined && !isTaskPriority(b.priority))
    return { ok: false, error: "Invalid priority" };
  if (b.assigneeId !== undefined && b.assigneeId !== null && (typeof b.assigneeId !== "number" || !Number.isInteger(b.assigneeId) || b.assigneeId <= 0))
    return { ok: false, error: "assigneeId must be a positive integer or null" };
  if (b.orderId !== undefined && b.orderId !== null && (typeof b.orderId !== "number" || !Number.isInteger(b.orderId) || b.orderId <= 0))
    return { ok: false, error: "orderId must be a positive integer or null" };
  return { ok: true, data: b as any };
}

function parseUpdateBody(body: unknown): { ok: true; data: Record<string, unknown> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Body must be an object" };
  const b = body as Record<string, unknown>;
  if (b.title !== undefined && (typeof b.title !== "string" || b.title.trim().length === 0 || b.title.length > 300))
    return { ok: false, error: "title must be a non-empty string (max 300 chars)" };
  if (b.status !== undefined && !isTaskStatus(b.status))
    return { ok: false, error: "Invalid status" };
  if (b.priority !== undefined && !isTaskPriority(b.priority))
    return { ok: false, error: "Invalid priority" };
  if (b.assigneeId !== undefined && b.assigneeId !== null && (typeof b.assigneeId !== "number" || !Number.isInteger(b.assigneeId) || b.assigneeId <= 0))
    return { ok: false, error: "assigneeId must be a positive integer or null" };
  return { ok: true, data: b };
}

type UserRow = { id: number; name: string };

async function fetchUserMap(ids: number[]): Promise<Map<number, UserRow>> {
  const unique = Array.from(new Set(ids.filter((n): n is number => typeof n === "number")));
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(inArray(usersTable.id, unique));
  return new Map(rows.map((r) => [r.id, { id: r.id, name: r.name }]));
}

function toDTO(task: typeof tasksTable.$inferSelect, userMap: Map<number, UserRow>) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status as TaskStatus,
    priority: task.priority as TaskPriority,
    assignee: task.assigneeId ? (userMap.get(task.assigneeId) ?? null) : null,
    createdBy: task.createdById ? (userMap.get(task.createdById) ?? null) : null,
    orderId: task.orderId ?? null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

router.get("/", requireAuth, requireRole(...STAFF_OR_ADMIN), async (req, res) => {
  const user = (req as any).user;
  const isAdmin = ADMIN_ROLES.includes(user.role);

  const rows = await db
    .select()
    .from(tasksTable)
    .orderBy(desc(tasksTable.createdAt));

  const visible = isAdmin ? rows : rows.filter((t) => t.assigneeId === user.id);

  const userIds: number[] = [];
  for (const t of visible) {
    if (t.assigneeId) userIds.push(t.assigneeId);
    if (t.createdById) userIds.push(t.createdById);
  }
  const userMap = await fetchUserMap(userIds);

  res.json({ tasks: visible.map((t) => toDTO(t, userMap)) });
});

router.post("/", requireAuth, requireRole(...ADMIN_ROLES), async (req, res) => {
  const user = (req as any).user;
  const parsed = parseCreateBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const body = parsed.data;

  const [task] = await db
    .insert(tasksTable)
    .values({
      title: body.title,
      description: body.description ?? null,
      status: (body.status ?? "todo") as TaskStatus,
      priority: (body.priority ?? "medium") as TaskPriority,
      assigneeId: body.assigneeId ?? null,
      createdById: user.id,
      orderId: body.orderId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    })
    .returning();

  const userIds: number[] = [];
  if (task.assigneeId) userIds.push(task.assigneeId);
  if (task.createdById) userIds.push(task.createdById);
  const userMap = await fetchUserMap(userIds);

  res.status(201).json(toDTO(task, userMap));
});

router.patch("/:id", requireAuth, requireRole(...STAFF_OR_ADMIN), async (req, res) => {
  const user = (req as any).user;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const isAdmin = ADMIN_ROLES.includes(user.role);
  if (!isAdmin && existing.assigneeId !== user.id) {
    res.status(403).json({ error: "You can only update tasks assigned to you" });
    return;
  }

  const parsed = parseUpdateBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const body = parsed.data;

  const patch: Partial<typeof tasksTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (isAdmin) {
    if (body.title !== undefined) patch.title = body.title;
    if ("description" in body) patch.description = body.description ?? null;
    if ("assigneeId" in body) patch.assigneeId = body.assigneeId ?? null;
    if ("orderId" in body) patch.orderId = body.orderId ?? null;
    if ("dueDate" in body) patch.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.priority !== undefined) patch.priority = body.priority as TaskPriority;
  }
  if (body.status !== undefined) patch.status = body.status as TaskStatus;

  const [updated] = await db
    .update(tasksTable)
    .set(patch)
    .where(eq(tasksTable.id, id))
    .returning();

  const userIds: number[] = [];
  if (updated.assigneeId) userIds.push(updated.assigneeId);
  if (updated.createdById) userIds.push(updated.createdById);
  const userMap = await fetchUserMap(userIds);

  res.json(toDTO(updated, userMap));
});

router.delete("/:id", requireAuth, requireRole(...ADMIN_ROLES), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const [existing] = await db.select({ id: tasksTable.id }).from(tasksTable).where(eq(tasksTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).send();
});

export default router;
