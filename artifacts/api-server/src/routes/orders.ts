import { Router, type IRouter } from "express";
import {
  supabase,
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
  const { data: rows } = await supabase
    .from("users")
    .select("id, name, email")
    .in("id", unique);
  return new Map(
    (rows ?? []).map((r) => [
      r.id as number,
      { id: r.id as number, name: r.name as string, email: r.email as string | null },
    ]),
  );
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
  const { data: eventRows } = await supabase
    .from("order_status_events")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  const events = (eventRows ?? []).map((r) =>
    mapOrderStatusEvent(r as Record<string, unknown>),
  );

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
  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (user.role === "client") query = query.eq("client_id", user.id);
  else if (user.role === "staff") query = query.eq("assigned_to", user.id);

  const { data: rows } = await query;
  const orders = (rows ?? []).map((r) => mapOrder(r as Record<string, unknown>));

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
    const { data: clientRows } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", input.clientId)
      .limit(1);
    const c = clientRows?.[0];
    if (!c || c.role !== "client") {
      res.status(400).json({ error: "Specified clientId is not a client" });
      return;
    }
    clientId = c.id as number;
  } else {
    res.status(403).json({ error: "Staff cannot create orders" });
    return;
  }

  const items = input.items as OrderItemLine[];
  const subtotal = computeSubtotal(items);

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .insert({
      client_id: clientId,
      title: input.title,
      items,
      subtotal_amount: subtotal,
      notes: input.notes ?? null,
      status: "draft",
    })
    .select()
    .single();

  if (orderErr || !orderRow) {
    res.status(500).json({ error: "Failed to create order" });
    return;
  }

  await supabase.from("order_status_events").insert({
    order_id: (orderRow as Record<string, unknown>).id as number,
    status: "draft",
    note: "Order created",
    by_user_id: user.id,
  });

  const order = mapOrder(orderRow as Record<string, unknown>);
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
  const { data: rows } = await supabase.from("orders").select("*").eq("id", id).limit(1);
  const raw = rows?.[0];
  if (!raw) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const order = mapOrder(raw as Record<string, unknown>);
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

  const { data: rows } = await supabase.from("orders").select("*").eq("id", id).limit(1);
  const raw = rows?.[0];
  if (!raw) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const existing = mapOrder(raw as Record<string, unknown>);

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

  const { data: updated, error } = await supabase.rpc("transition_order_status", {
    p_order_id: id,
    p_from_status: existing.status,
    p_to_status: nextStatus,
    p_note: parsed.data.note ?? null,
    p_by_user_id: user.id,
  });

  if (error) {
    res.status(500).json({ error: "Failed to update order status" });
    return;
  }
  if (!updated || (updated as unknown[]).length === 0) {
    res.status(409).json({
      error: "Order was updated by someone else. Refresh and try again.",
    });
    return;
  }

  const updatedOrder = mapOrder((updated as Record<string, unknown>[])[0]);
  req.log.info({ orderId: id, status: nextStatus, by: user.id }, "order status updated");
  res.status(200).json(await buildDetail(updatedOrder));
});

export default router;
