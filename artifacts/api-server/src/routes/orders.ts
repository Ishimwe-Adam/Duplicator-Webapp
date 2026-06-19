import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  ordersTable,
  orderStatusEventsTable,
} from "@workspace/db";
import { eq, inArray, desc, sql } from "drizzle-orm";
import {
  mapOrder,
  mapOrderStatusEvent,
  formatOrderNumber,
  nextAllowedOrderStatuses,
  type OrderStatus,
  type Order,
  type OrderItemLine,
} from "@workspace/db";
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

type UserRow = { id: number; name: string; email: string | null };

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
  return new Map(rows.map((r) => [r.id, { id: r.id, name: r.name, email: r.email }]));
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
  const eventRows = await db
    .select()
    .from(orderStatusEventsTable)
    .where(eq(orderStatusEventsTable.orderId, order.id))
    .orderBy(orderStatusEventsTable.createdAt);

  const events = eventRows.map((r) => mapOrderStatusEvent(r as any));

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

router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = req.user!;
  let query = db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));

  if (user.role === "client") {
    query = query.where(eq(ordersTable.clientId, user.id)) as any;
  } else if (user.role === "staff") {
    query = query.where(eq(ordersTable.assignedTo, user.id)) as any;
  }

  const rows = await query;
  const orders = rows.map((r) => mapOrder(r as any));

  const userIds = orders.flatMap((o) => [
    o.clientId,
    ...(o.assignedTo ? [o.assignedTo] : []),
  ]);
  const userMap = await fetchUserMap(userIds);

  const body: OrderListResponse = { orders: orders.map((o) => summarize(o, userMap)) };
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
    const [clientRow] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, input.clientId))
      .limit(1);
    if (!clientRow || clientRow.role !== "client") {
      res.status(400).json({ error: "Specified clientId is not a client" });
      return;
    }
    clientId = clientRow.id;
  } else {
    res.status(403).json({ error: "Staff cannot create orders" });
    return;
  }

  const items = input.items as OrderItemLine[];
  const subtotal = computeSubtotal(items);

  const [orderRow] = await db
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

  if (!orderRow) {
    res.status(500).json({ error: "Failed to create order" });
    return;
  }

  await db.insert(orderStatusEventsTable).values({
    orderId: orderRow.id,
    status: "draft",
    note: "Order created",
    byUserId: user.id,
  });

  const order = mapOrder(orderRow as any);
  req.log.info({ orderId: order.id, clientId, by: user.id }, "order created");
  res.status(201).json(await buildDetail(order));
});

router.get("/:id", async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [raw] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id))
    .limit(1);
  if (!raw) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = mapOrder(raw as any);
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

  const [raw] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id))
    .limit(1);
  if (!raw) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const existing = mapOrder(raw as any);

  if (user.role === "staff" && existing.assignedTo !== user.id) {
    res.status(403).json({ error: "You can only update orders assigned to you" });
    return;
  }
  if (existing.status === nextStatus) {
    res.status(200).json(await buildDetail(existing));
    return;
  }
  const allowed = nextAllowedOrderStatuses(existing.status);
  if (!allowed.includes(nextStatus)) {
    res.status(400).json({
      error: `Cannot move order from "${existing.status}" to "${nextStatus}".`,
    });
    return;
  }

  // Atomic transition using a transaction
  let updatedOrder: Order | null = null;
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(ordersTable)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!updated) return;

    await tx.insert(orderStatusEventsTable).values({
      orderId: id,
      status: nextStatus,
      note: parsed.data.note ?? null,
      byUserId: user.id,
    });

    updatedOrder = mapOrder(updated as any);
  });

  if (!updatedOrder) {
    res.status(409).json({
      error: "Order was updated by someone else. Refresh and try again.",
    });
    return;
  }

  req.log.info({ orderId: id, status: nextStatus, by: user.id }, "order status updated");
  res.status(200).json(await buildDetail(updatedOrder));
});

export default router;
