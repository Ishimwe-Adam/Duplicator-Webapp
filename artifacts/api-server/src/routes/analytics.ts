import { Router, type IRouter } from "express";
import {
  supabase,
  formatOrderNumber,
  ALL_ORDER_STATUSES,
  type OrderStatus,
} from "@workspace/db";
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
  const thisMonthStart  = startOfMonthUTC(now);
  const lastMonthStart  = addMonthsUTC(thisMonthStart, -1);
  const twelveMonthsAgo = addMonthsUTC(thisMonthStart, -11);
  const fourteenAgo     = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    paymentsForRevenue,
    openInvoices,
    overdueResult,
    allOrderStatuses,
    topClientsResult,
    clientCountResult,
    newClientsResult,
    recentOrderRows,
    dueSoonResult,
  ] = await Promise.all([
    supabase.from("payments").select("paid_at, amount")
      .gte("paid_at", twelveMonthsAgo.toISOString()),

    supabase.from("invoices").select("id, total_amount")
      .not("status", "in", "(paid,void)"),

    supabase.from("invoices").select("id", { count: "exact", head: true })
      .in("status", ["draft", "sent"])
      .lt("due_date", now.toISOString()),

    supabase.from("orders").select("status"),

    supabase.rpc("get_top_clients", { p_limit: 5 }),

    supabase.from("users").select("id", { count: "exact", head: true })
      .eq("role", "client"),

    supabase.from("users").select("id", { count: "exact", head: true })
      .eq("role", "client")
      .gte("created_at", thisMonthStart.toISOString()),

    supabase.from("orders")
      .select("id, title, status, subtotal_amount, client_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    supabase.from("orders").select("id", { count: "exact", head: true })
      .gte("created_at", fourteenAgo.toISOString())
      .not("status", "in", "(delivered,cancelled)"),
  ]);

  // Receivables: fetch payments only for open invoices
  const openIds = (openInvoices.data ?? []).map((i: any) => (i as Record<string, unknown>).id as number);
  const receivablesPayments = openIds.length > 0
    ? await supabase.from("payments").select("invoice_id, amount").in("invoice_id", openIds)
    : { data: [] as { invoice_id: number; amount: number }[] };

  // Client names for recent orders
  const clientIds = (recentOrderRows.data ?? []).map((o: any) => (o as Record<string, unknown>).client_id as number);
  const clientNameRows = clientIds.length > 0
    ? await supabase.from("users").select("id, name").in("id", clientIds)
    : { data: [] as { id: number; name: string }[] };
  const clientNameMap = new Map(
    (clientNameRows.data ?? []).map((r: any) => [
      (r as Record<string, unknown>).id as number,
      (r as Record<string, unknown>).name as string,
    ]),
  );

  // Revenue aggregation
  const revenueByMonth = new Map<string, number>();
  for (const p of paymentsForRevenue.data ?? []) {
    const key = ymKey(new Date((p as Record<string, unknown>).paid_at as string));
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number((p as Record<string, unknown>).amount));
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
  for (const p of receivablesPayments.data ?? []) {
    const iid = (p as Record<string, unknown>).invoice_id as number;
    paidPerInvoice.set(iid, (paidPerInvoice.get(iid) ?? 0) + Number((p as Record<string, unknown>).amount));
  }
  const outstandingAmount = (openInvoices.data ?? []).reduce((sum: number, inv: any) => {
    const i = inv as Record<string, unknown>;
    return sum + Math.max(0, Number(i.total_amount) - (paidPerInvoice.get(i.id as number) ?? 0));
  }, 0);

  // Orders by status
  const statusCountMap = new Map<string, number>();
  for (const o of allOrderStatuses.data ?? []) {
    const s = (o as Record<string, unknown>).status as string;
    statusCountMap.set(s, (statusCountMap.get(s) ?? 0) + 1);
  }
  const ordersByStatus = ALL_ORDER_STATUSES.map((s: OrderStatus) => ({
    status: s,
    count: statusCountMap.get(s) ?? 0,
  }));
  const activeOrders = ordersByStatus
    .filter((r) => r.status !== "delivered" && r.status !== "cancelled")
    .reduce((s, r) => s + r.count, 0);

  // Top clients
  const topClients = (topClientsResult.data ?? []).map((r: any) => {
    const row = r as Record<string, unknown>;
    return {
      id: row.client_id as number,
      name: row.name as string,
      email: (row.email ?? null) as string | null,
      revenue: Number(row.revenue),
      invoiceCount: Number(row.invoice_count),
    };
  });

  const body: AnalyticsSummary = {
    generatedAt: now,
    revenue: {
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      last12Months,
    },
    receivables: {
      outstandingAmount,
      overdueCount: overdueResult.count ?? 0,
    },
    orders: {
      active: activeOrders,
      dueSoon: dueSoonResult.count ?? 0,
      byStatus: ordersByStatus,
    },
    clients: {
      total: clientCountResult.count ?? 0,
      newThisMonth: newClientsResult.count ?? 0,
      top: topClients,
    },
    recentOrders: (recentOrderRows.data ?? []).map((o: any) => {
      const row = o as Record<string, unknown>;
      return {
        id: row.id as number,
        orderNumber: formatOrderNumber(row.id as number),
        title: row.title as string,
        status: row.status as OrderStatus,
        subtotalAmount: Number(row.subtotal_amount),
        clientName: clientNameMap.get(row.client_id as number) ?? "Unknown",
        createdAt: new Date(row.created_at as string),
      };
    }),
  };

  res.status(200).json(body);
});

export default router;
