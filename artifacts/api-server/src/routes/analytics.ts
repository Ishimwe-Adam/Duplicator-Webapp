import { Router, type IRouter } from "express";
import {
  db,
  invoicesTable,
  ordersTable,
  usersTable,
  paymentsTable,
  formatOrderNumber,
  ALL_ORDER_STATUSES,
  type OrderStatus,
} from "@workspace/db";
import { and, desc, eq, gte, lt, ne, sql, inArray, notInArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import type { AnalyticsSummary } from "@workspace/api-zod";

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
  const thisMonthStart = startOfMonthUTC(now);
  const lastMonthStart = addMonthsUTC(thisMonthStart, -1);
  const twelveMonthsAgo = addMonthsUTC(thisMonthStart, -11);
  const fourteenAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Run all independent aggregation queries in parallel.
  const [
    monthlyRevenueRows,
    receivablesAgg,
    overdueAgg,
    ordersByStatusRows,
    topClientRows,
    clientCountAgg,
    newClientsAgg,
    recentOrders,
    dueWeekAgg,
  ] = await Promise.all([
    // Revenue = sum of payments amount, grouped by paidAt month (UTC)
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${paymentsTable.paidAt} AT TIME ZONE 'UTC'), 'YYYY-MM')`,
        amount: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
      })
      .from(paymentsTable)
      .where(gte(paymentsTable.paidAt, twelveMonthsAgo))
      .groupBy(sql`date_trunc('month', ${paymentsTable.paidAt} AT TIME ZONE 'UTC')`),

    // Outstanding receivables: single query — LEFT JOIN a pre-aggregated payments
    // subquery on the open invoices, then sum (total - paid) per invoice.
    // Consistent: one snapshot, no N+1, no parameter explosion.
    db
      .select({
        outstanding: sql<string>`COALESCE(SUM(${invoicesTable.totalAmount} - COALESCE(p.paid, 0)), 0)`,
      })
      .from(invoicesTable)
      .leftJoin(
        sql`(SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id) AS p`,
        sql`p.invoice_id = ${invoicesTable.id}`,
      )
      .where(notInArray(invoicesTable.status, ["paid", "void"])),

    // Overdue invoice count (status draft/sent AND dueDate < now)
    db
      .select({ n: sql<string>`COUNT(*)` })
      .from(invoicesTable)
      .where(and(
        inArray(invoicesTable.status, ["draft", "sent"]),
        lt(invoicesTable.dueDate, now),
      )),

    // Orders by status
    db
      .select({
        status: ordersTable.status,
        count: sql<string>`COUNT(*)`,
      })
      .from(ordersTable)
      .groupBy(ordersTable.status),

    // Top clients by lifetime payments received (single query, join users in)
    db
      .select({
        clientId: invoicesTable.clientId,
        name: usersTable.name,
        email: usersTable.email,
        revenue: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
        invoiceCount: sql<string>`COUNT(DISTINCT ${invoicesTable.id})`,
      })
      .from(paymentsTable)
      .innerJoin(invoicesTable, eq(paymentsTable.invoiceId, invoicesTable.id))
      .innerJoin(usersTable, eq(usersTable.id, invoicesTable.clientId))
      .groupBy(invoicesTable.clientId, usersTable.name, usersTable.email)
      .orderBy(desc(sql`SUM(${paymentsTable.amount})`))
      .limit(5),

    db
      .select({ n: sql<string>`COUNT(*)` })
      .from(usersTable)
      .where(eq(usersTable.role, "client")),

    db
      .select({ n: sql<string>`COUNT(*)` })
      .from(usersTable)
      .where(and(eq(usersTable.role, "client"), gte(usersTable.createdAt, thisMonthStart))),

    // Recent orders (last 5)
    db
      .select({
        id: ordersTable.id,
        title: ordersTable.title,
        status: ordersTable.status,
        subtotal: ordersTable.subtotalAmount,
        clientId: ordersTable.clientId,
        clientName: usersTable.name,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .innerJoin(usersTable, eq(usersTable.id, ordersTable.clientId))
      .orderBy(desc(ordersTable.createdAt))
      .limit(5),

    // Active orders created in last 14 days (loose "due soon" proxy until orders have a delivery date)
    db
      .select({ n: sql<string>`COUNT(*)` })
      .from(ordersTable)
      .where(and(
        gte(ordersTable.createdAt, fourteenAgo),
        ne(ordersTable.status, "delivered"),
        ne(ordersTable.status, "cancelled"),
      )),
  ]);

  const revenueByMonth = new Map(monthlyRevenueRows.map((r) => [r.month, Number(r.amount)]));
  const last12Months: { month: string; amount: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = addMonthsUTC(twelveMonthsAgo, i);
    const key = ymKey(d);
    last12Months.push({ month: key, amount: revenueByMonth.get(key) ?? 0 });
  }
  const revenueThisMonth = revenueByMonth.get(ymKey(thisMonthStart)) ?? 0;
  const revenueLastMonth = revenueByMonth.get(ymKey(lastMonthStart)) ?? 0;

  const outstandingAmount = Math.max(0, Number(receivablesAgg[0]?.outstanding ?? 0));
  const overdueCount = Number(overdueAgg[0]?.n ?? 0);
  const statusCountMap = new Map(ordersByStatusRows.map((r) => [r.status, Number(r.count)]));
  const ordersByStatus = ALL_ORDER_STATUSES.map((s: OrderStatus) => ({
    status: s,
    count: statusCountMap.get(s) ?? 0,
  }));
  const activeOrders = ordersByStatus
    .filter((r) => r.status !== "delivered" && r.status !== "cancelled")
    .reduce((s, r) => s + r.count, 0);

  const topClients = topClientRows.map((r) => ({
    id: r.clientId,
    name: r.name,
    email: r.email,
    revenue: Number(r.revenue),
    invoiceCount: Number(r.invoiceCount),
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
      dueSoon: Number(dueWeekAgg[0]?.n ?? 0),
      byStatus: ordersByStatus,
    },
    clients: {
      total: Number(clientCountAgg[0]?.n ?? 0),
      newThisMonth: Number(newClientsAgg[0]?.n ?? 0),
      top: topClients,
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: formatOrderNumber(o.id),
      title: o.title,
      status: o.status,
      subtotalAmount: o.subtotal,
      clientName: o.clientName,
      createdAt: o.createdAt,
    })),
  };
  res.status(200).json(body);
});

export default router;
