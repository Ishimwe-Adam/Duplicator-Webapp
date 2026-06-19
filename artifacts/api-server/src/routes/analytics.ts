import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  ordersTable,
  invoicesTable,
  paymentsTable,
} from "@workspace/db";
import {
  formatOrderNumber,
  ALL_ORDER_STATUSES,
  type OrderStatus,
} from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import type { AnalyticsSummary } from "@workspace/api-zod";
import { eq, gte, lt, not, inArray, desc, sql, count, sum, and } from "drizzle-orm";

const router: IRouter = Router();
const ADMIN_ROLES = ["super_admin", "admin"] as const;

router.use(requireAuth);
router.use(requireRole(...ADMIN_ROLES));

function startOfMonthUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function addMonthsUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}
function ymKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

router.get("/summary", async (_req, res) => {
  const now = new Date();
  const thisMonthStart  = startOfMonthUTC(now);
  const lastMonthStart  = addMonthsUTC(thisMonthStart, -1);
  const twelveMonthsAgo = addMonthsUTC(thisMonthStart, -11);
  const fourteenAgo     = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const OPEN_STATUSES = ["draft", "sent"] as const;
  const CLOSED_STATUSES = ["delivered", "cancelled"] as const;

  const [
    paymentsForRevenue,
    openInvoices,
    overdueCount,
    allOrderStatuses,
    topClientsResult,
    clientCount,
    newClientsCount,
    recentOrderRows,
    dueSoonCount,
  ] = await Promise.all([
    db
      .select({ paidAt: paymentsTable.paidAt, amount: paymentsTable.amount })
      .from(paymentsTable)
      .where(gte(paymentsTable.paidAt, twelveMonthsAgo)),

    db
      .select({ id: invoicesTable.id, totalAmount: invoicesTable.totalAmount })
      .from(invoicesTable)
      .where(not(inArray(invoicesTable.status, ["paid", "void"]))),

    db
      .select({ id: invoicesTable.id })
      .from(invoicesTable)
      .where(
        and(
          inArray(invoicesTable.status, [...OPEN_STATUSES]),
          lt(invoicesTable.dueDate, now)
        )
      )
      .then((rows) => rows.length),

    db.select({ status: ordersTable.status }).from(ordersTable),

    // Top clients via raw SQL (equivalent to the get_top_clients RPC)
    db.execute(sql`
      SELECT
        i.client_id,
        u.name,
        u.email,
        COALESCE(SUM(p.amount), 0)::BIGINT AS revenue,
        COUNT(DISTINCT i.id)::BIGINT AS invoice_count
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN users u ON u.id = i.client_id
      GROUP BY i.client_id, u.name, u.email
      ORDER BY SUM(p.amount) DESC
      LIMIT 5
    `),

    db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "client"))
      .then((rows) => rows.length),

    db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.role, "client"), gte(usersTable.createdAt, thisMonthStart)))
      .then((rows) => rows.length),

    db
      .select({
        id: ordersTable.id,
        title: ordersTable.title,
        status: ordersTable.status,
        subtotalAmount: ordersTable.subtotalAmount,
        clientId: ordersTable.clientId,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt))
      .limit(5),

    db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(
        and(
          gte(ordersTable.createdAt, fourteenAgo),
          not(inArray(ordersTable.status, [...CLOSED_STATUSES]))
        )
      )
      .then((rows) => rows.length),
  ]);

  // Receivables: fetch payments only for open invoices
  const openIds = openInvoices.map((i) => i.id);
  const receivablesPayments = openIds.length > 0
    ? await db
        .select({ invoiceId: paymentsTable.invoiceId, amount: paymentsTable.amount })
        .from(paymentsTable)
        .where(inArray(paymentsTable.invoiceId, openIds))
    : [];

  // Client names for recent orders
  const clientIds = recentOrderRows.map((o) => o.clientId);
  const clientNameRows = clientIds.length > 0
    ? await db
        .select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(inArray(usersTable.id, clientIds))
    : [];
  const clientNameMap = new Map(clientNameRows.map((r) => [r.id, r.name]));

  // Revenue aggregation
  const revenueByMonth = new Map<string, number>();
  for (const p of paymentsForRevenue) {
    const key = ymKey(new Date(p.paidAt as any));
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(p.amount));
  }
  const last12Months: { month: string; amount: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = addMonthsUTC(twelveMonthsAgo, i);
    const key = ymKey(d);
    last12Months.push({ month: key, amount: revenueByMonth.get(key) ?? 0 });
  }
  const revenueThisMonth = revenueByMonth.get(ymKey(thisMonthStart)) ?? 0;
  const revenueLastMonth = revenueByMonth.get(ymKey(lastMonthStart)) ?? 0;

  // Receivables aggregation
  const paidPerInvoice = new Map<number, number>();
  for (const p of receivablesPayments) {
    const iid = p.invoiceId;
    paidPerInvoice.set(iid, (paidPerInvoice.get(iid) ?? 0) + Number(p.amount));
  }
  const outstandingAmount = openInvoices.reduce((sum, inv) => {
    return sum + Math.max(0, Number(inv.totalAmount) - (paidPerInvoice.get(inv.id) ?? 0));
  }, 0);

  // Orders by status
  const statusCountMap = new Map<string, number>();
  for (const o of allOrderStatuses) {
    statusCountMap.set(o.status, (statusCountMap.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus = ALL_ORDER_STATUSES.map((s: OrderStatus) => ({
    status: s,
    count: statusCountMap.get(s) ?? 0,
  }));
  const activeOrders = ordersByStatus
    .filter((r) => r.status !== "delivered" && r.status !== "cancelled")
    .reduce((s, r) => s + r.count, 0);

  // Top clients
  const topClients = (topClientsResult.rows ?? []).map((r: any) => ({
    id: r.client_id as number,
    name: r.name as string,
    email: (r.email ?? null) as string | null,
    revenue: Number(r.revenue),
    invoiceCount: Number(r.invoice_count),
  }));

  const body: AnalyticsSummary = {
    generatedAt: now,
    revenue: {
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      last12Months,
    },
    receivables: {
      outstandingAmount,
      overdueCount,
    },
    orders: {
      active: activeOrders,
      dueSoon: dueSoonCount,
      byStatus: ordersByStatus,
    },
    clients: {
      total: clientCount,
      newThisMonth: newClientsCount,
      top: topClients,
    },
    recentOrders: recentOrderRows.map((o) => ({
      id: o.id,
      orderNumber: formatOrderNumber(o.id),
      title: o.title,
      status: o.status as OrderStatus,
      subtotalAmount: Number(o.subtotalAmount),
      clientName: clientNameMap.get(o.clientId) ?? "Unknown",
      createdAt: new Date(o.createdAt as any),
    })),
  };

  res.status(200).json(body);
});

export default router;
