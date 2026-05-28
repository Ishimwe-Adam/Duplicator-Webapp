import { Router, type IRouter } from "express";
import {
  db,
  ordersTable,
  orderStatusEventsTable,
  usersTable,
  formatOrderNumber,
  nextAllowedOrderStatuses,
  type OrderStatus,
  type Order,
  type OrderItemLine,
} from "@workspace/db";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import {
  CreateOrderBody,
  UpdateOrderStatusBody,
  type OrderDetail,
  type OrderSummary,
  type OrderListResponse,
  type OrderPartyRef,
  type OrderStatusEvent as OrderStatusEventDTO,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const STAFF_OR_ADMIN = ["super_admin", "admin", "staff"] as const;

// Helpers -------------------------------------------------------------------

type UserRow = {
  id: number;
  name: string;
  email: string | null;
};

function partyRef(u: UserRow | null | undefined): OrderPartyRef | null {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email ?? null };
}

function computeSubtotal(items: OrderItemLine[]): number {
  return items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
}

async function fetchUserMap(ids: number[]): Promise<Map<number, UserRow>> {
  const unique = Array.from(new Set(ids.filter((n): n is number => typeof n === "number")));
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(inArray(usersTable.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
}

function summarize(order: Order, userMap: Map<number, UserRow>): OrderSummary {
  const items = (order.items ?? []) as OrderItemLine[];
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.id),
    title: order.title,
    status: order.status,
    subtotalAmount: order.subtotalAmount,
    itemCount: items.reduce((n, it) => n + it.qty, 0),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    client: partyRef(userMap.get(order.clientId)) ?? {
      id: order.clientId,
      name: "Unknown",
      email: null,
    },
    assignedTo: order.assignedTo ? partyRef(userMap.get(order.assignedTo)) : null,
  };
}

async function buildDetail(order: Order): Promise<OrderDetail> {
  const events = await db
    .select()
    .from(orderStatusEventsTable)
    .where(eq(orderStatusEventsTable.orderId, order.id))
    .orderBy(asc(orderStatusEventsTable.createdAt));

  const userIds = [
    order.clientId,
    ...(order.assignedTo ? [order.assignedTo] : []),
    ...events.map((e) => e.byUserId).filter((x): x is number => x !== null),
  ];
  const userMap = await fetchUserMap(userIds);

  const timeline: OrderStatusEventDTO[] = events.map((e) => ({
    id: e.id,
    status: e.status,
    note: e.note ?? null,
    createdAt: e.createdAt,
    by: e.byUserId ? partyRef(userMap.get(e.byUserId)) : null,
  }));

  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.id),
    title: order.title,
    status: order.status,
    items: (order.items ?? []) as OrderItemLine[],
    subtotalAmount: order.subtotalAmount,
    notes: order.notes ?? null,
    client: partyRef(userMap.get(order.clientId)) ?? {
      id: order.clientId,
      name: "Unknown",
      email: null,
    },
    assignedTo: order.assignedTo ? partyRef(userMap.get(order.assignedTo)) : null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    timeline,
  };
}

function parseIdParam(raw: string | string[] | undefined): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

// Routes --------------------------------------------------------------------

// All order routes require auth
router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = req.user!;
  const baseSelect = db.select().from(ordersTable);

  const orders: Order[] = await (user.role === "client"
    ? baseSelect.where(eq(ordersTable.clientId, user.id)).orderBy(desc(ordersTable.createdAt))
    : user.role === "staff"
      ? baseSelect.where(eq(ordersTable.assignedTo, user.id)).orderBy(desc(ordersTable.createdAt))
      : baseSelect.orderBy(desc(ordersTable.createdAt)));

  const userIds = orders.flatMap((o) => [o.clientId, ...(o.assignedTo ? [o.assignedTo] : [])]);
  const userMap = await fetchUserMap(userIds);

  const body: OrderListResponse = {
    orders: orders.map((o) => summarize(o, userMap)),
  };
  res.status(200).json(body);
});

router.post("/", async (req, res) => {
  const user = req.user!;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const input = parsed.data;

  let clientId: number;
  if (user.role === "client") {
    clientId = user.id;
  } else if (user.role === "super_admin" || user.role === "admin") {
    if (typeof input.clientId !== "number") {
      res.status(400).json({ error: "clientId is required when admins create orders" });
      return;
    }
    const [c] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, input.clientId))
      .limit(1);
    if (!c || c.role !== "client") {
      res.status(400).json({ error: "Specified clientId is not a client" });
      return;
    }
    clientId = c.id;
  } else {
    res.status(403).json({ error: "Staff cannot create orders" });
    return;
  }

  const items = input.items as OrderItemLine[];
  const subtotal = computeSubtotal(items);

  const inserted = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(ordersTable)
      .values({
        clientId,
        title: input.title,
        items,
        subtotalAmount: subtotal,
        notes: input.notes ?? null,
        status: "draft",
      })
      .returning();
    await tx.insert(orderStatusEventsTable).values({
      orderId: order.id,
      status: "draft",
      note: "Order created",
      byUserId: user.id,
    });
    return order;
  });

  req.log.info({ orderId: inserted.id, clientId, by: user.id }, "order created");
  const detail = await buildDetail(inserted);
  res.status(201).json(detail);
});

router.get("/:id", async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (user.role === "client" && order.clientId !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (user.role === "staff" && order.assignedTo !== user.id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.status(200).json(await buildDetail(order));
});

router.patch("/:id/status", requireRole(...STAFF_OR_ADMIN), async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const nextStatus = parsed.data.status as OrderStatus;
  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (user.role === "staff" && existing.assignedTo !== user.id) {
    res.status(403).json({ error: "You can only update orders assigned to you" });
    return;
  }
  if (existing.status === nextStatus) {
    res.status(200).json(await buildDetail(existing));
    return;
  }
  // Enforce workflow rules server-side (UI is advisory only).
  const allowed = nextAllowedOrderStatuses(existing.status);
  if (!allowed.includes(nextStatus)) {
    res.status(400).json({
      error: `Cannot move order from "${existing.status}" to "${nextStatus}".`,
    });
    return;
  }

  // Atomic precondition update — guards against concurrent transitions.
  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(ordersTable)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(and(eq(ordersTable.id, id), eq(ordersTable.status, existing.status)))
      .returning();
    if (rows.length === 0) return null;
    await tx.insert(orderStatusEventsTable).values({
      orderId: id,
      status: nextStatus,
      note: parsed.data.note ?? null,
      byUserId: user.id,
    });
    return rows[0];
  });

  if (!updated) {
    res.status(409).json({
      error: "Order was updated by someone else. Refresh and try again.",
    });
    return;
  }

  req.log.info({ orderId: id, status: nextStatus, by: user.id }, "order status updated");
  res.status(200).json(await buildDetail(updated));
});

export default router;
