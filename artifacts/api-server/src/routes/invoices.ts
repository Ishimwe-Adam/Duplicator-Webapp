import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";
import {
  db,
  invoicesTable,
  ordersTable,
  usersTable,
  paymentsTable,
  formatInvoiceNumber,
  formatOrderNumber,
  nextAllowedInvoiceStatuses,
  computeInvoiceTotals,
  isInvoiceOverdue,
  type Invoice,
  type InvoiceStatus,
  type OrderItemLine,
  type Payment,
} from "@workspace/db";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  CreateInvoiceBody,
  UpdateInvoiceStatusBody,
  RecordPaymentBody,
  type InvoiceDetail,
  type InvoiceSummary,
  type InvoiceListResponse,
  type OrderPartyRef,
  type InvoiceOrderRef,
  type Payment as PaymentDto,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// silence unused-import lint when sql isn't needed elsewhere
void sql;

const router: IRouter = Router();

const ADMIN_ROLES = ["super_admin", "admin"] as const;

type UserRow = { id: number; name: string; email: string | null };
type OrderRow = { id: number; title: string };

function partyRef(u: UserRow | null | undefined): OrderPartyRef | null {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email ?? null };
}

async function fetchUserMap(ids: number[]): Promise<Map<number, UserRow>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(inArray(usersTable.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
}

async function fetchOrderMap(ids: number[]): Promise<Map<number, OrderRow>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ id: ordersTable.id, title: ordersTable.title })
    .from(ordersTable)
    .where(inArray(ordersTable.id, unique));
  return new Map(rows.map((r) => [r.id, r]));
}

function orderRef(o: OrderRow | null | undefined, orderId: number): InvoiceOrderRef {
  return {
    id: orderId,
    orderNumber: formatOrderNumber(orderId),
    title: o?.title ?? "Order",
  };
}

async function fetchPaidByInvoice(invoiceIds: number[]): Promise<Map<number, number>> {
  const unique = Array.from(new Set(invoiceIds));
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({
      invoiceId: paymentsTable.invoiceId,
      paid: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)`,
    })
    .from(paymentsTable)
    .where(inArray(paymentsTable.invoiceId, unique))
    .groupBy(paymentsTable.invoiceId);
  return new Map(rows.map((r) => [r.invoiceId, Number(r.paid)]));
}

async function fetchPaymentsForInvoice(invoiceId: number): Promise<Payment[]> {
  return db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.invoiceId, invoiceId))
    .orderBy(asc(paymentsTable.paidAt));
}

function paymentDto(p: Payment, recordedBy: UserRow | null): PaymentDto {
  return {
    id: p.id,
    amount: p.amount,
    method: p.method,
    reference: p.reference ?? null,
    notes: p.notes ?? null,
    paidAt: p.paidAt,
    recordedBy: partyRef(recordedBy) ?? {
      id: p.recordedById,
      name: "Unknown",
      email: null,
    },
    createdAt: p.createdAt,
  };
}

function summarize(
  inv: Invoice,
  userMap: Map<number, UserRow>,
  orderMap: Map<number, OrderRow>,
  paidMap: Map<number, number>,
): InvoiceSummary {
  const amountPaid = paidMap.get(inv.id) ?? 0;
  return {
    id: inv.id,
    invoiceNumber: formatInvoiceNumber(inv.id),
    status: inv.status,
    subtotalAmount: inv.subtotalAmount,
    taxRatePercent: inv.taxRatePercent,
    taxAmount: inv.taxAmount,
    totalAmount: inv.totalAmount,
    amountPaid,
    balanceDue: Math.max(0, inv.totalAmount - amountPaid),
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    isOverdue: isInvoiceOverdue(inv),
    client: partyRef(userMap.get(inv.clientId)) ?? {
      id: inv.clientId,
      name: "Unknown",
      email: null,
    },
    order: orderRef(orderMap.get(inv.orderId), inv.orderId),
    createdAt: inv.createdAt,
  };
}

async function buildDetail(inv: Invoice): Promise<InvoiceDetail> {
  const payments = await fetchPaymentsForInvoice(inv.id);
  const userMap = await fetchUserMap([inv.clientId, ...payments.map((p) => p.recordedById)]);
  const orderMap = await fetchOrderMap([inv.orderId]);
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  return {
    id: inv.id,
    invoiceNumber: formatInvoiceNumber(inv.id),
    status: inv.status,
    items: (inv.items ?? []) as OrderItemLine[],
    subtotalAmount: inv.subtotalAmount,
    taxRatePercent: inv.taxRatePercent,
    taxAmount: inv.taxAmount,
    totalAmount: inv.totalAmount,
    amountPaid,
    balanceDue: Math.max(0, inv.totalAmount - amountPaid),
    payments: payments.map((p) => paymentDto(p, userMap.get(p.recordedById) ?? null)),
    notes: inv.notes ?? null,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    sentAt: inv.sentAt ?? null,
    paidAt: inv.paidAt ?? null,
    isOverdue: isInvoiceOverdue(inv),
    client: partyRef(userMap.get(inv.clientId)) ?? {
      id: inv.clientId,
      name: "Unknown",
      email: null,
    },
    order: orderRef(orderMap.get(inv.orderId), inv.orderId),
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}

function parseIdParam(raw: string | string[] | undefined): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function canViewInvoice(role: string, userId: number, inv: Invoice): boolean {
  if (role === "super_admin" || role === "admin") return true;
  if (role === "client" && inv.clientId === userId) return true;
  return false;
}

// All invoice routes require auth
router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = req.user!;
  if (user.role === "staff") {
    res.status(403).json({ error: "Staff cannot view invoices" });
    return;
  }
  const baseSelect = db.select().from(invoicesTable);
  const invs: Invoice[] =
    user.role === "client"
      ? await baseSelect.where(eq(invoicesTable.clientId, user.id)).orderBy(desc(invoicesTable.createdAt))
      : await baseSelect.orderBy(desc(invoicesTable.createdAt));

  const userMap = await fetchUserMap(invs.map((i) => i.clientId));
  const orderMap = await fetchOrderMap(invs.map((i) => i.orderId));
  const paidMap = await fetchPaidByInvoice(invs.map((i) => i.id));
  const body: InvoiceListResponse = {
    invoices: invs.map((i) => summarize(i, userMap, orderMap, paidMap)),
  };
  res.status(200).json(body);
});

router.post("/", requireRole(...ADMIN_ROLES), async (req, res) => {
  const user = req.user!;
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const input = parsed.data;
  const taxRate = input.taxRatePercent ?? 0;

  const dueDate = new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) {
    res.status(400).json({ error: "Invalid dueDate" });
    return;
  }

  // Transactional lock on the order row so its status / items / clientId cannot
  // mutate between our re-read and the invoice insert. Without this, a concurrent
  // "cancel order" or "reassign client" could slip in after our read.
  let inv: Invoice;
  try {
    inv = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, input.orderId))
        .for("update")
        .limit(1);
      if (!order) {
        throw new HttpError(400, "Order not found");
      }
      if (order.status === "cancelled") {
        throw new HttpError(400, "Cannot invoice a cancelled order");
      }

      const items = (order.items ?? []) as OrderItemLine[];
      const totals = computeInvoiceTotals(items, taxRate);

      const [created] = await tx
        .insert(invoicesTable)
        .values({
          orderId: order.id,
          clientId: order.clientId,
          items,
          subtotalAmount: totals.subtotal,
          taxRatePercent: taxRate,
          taxAmount: totals.tax,
          totalAmount: totals.total,
          status: "draft",
          notes: input.notes ?? null,
          dueDate,
        })
        .returning();
      return created;
    });
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).json({ error: e.message });
      return;
    }
    throw e;
  }

  req.log.info({ invoiceId: inv.id, orderId: input.orderId, by: user.id }, "invoice created");
  res.status(201).json(await buildDetail(inv));
});

router.get("/:id", async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  if (!inv) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  if (!canViewInvoice(user.role, user.id, inv)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.status(200).json(await buildDetail(inv));
});

router.patch("/:id/status", requireRole(...ADMIN_ROLES), async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateInvoiceStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const nextStatus = parsed.data.status as InvoiceStatus;
  const [existing] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  if (existing.status === nextStatus) {
    res.status(200).json(await buildDetail(existing));
    return;
  }
  const allowed = nextAllowedInvoiceStatuses(existing.status);
  if (!allowed.includes(nextStatus)) {
    res.status(400).json({
      error: `Cannot move invoice from "${existing.status}" to "${nextStatus}".`,
    });
    return;
  }

  const now = new Date();
  const patch: Partial<Invoice> = { status: nextStatus, updatedAt: now };
  if (nextStatus === "sent" && !existing.sentAt) patch.sentAt = now;
  if (nextStatus === "paid" && !existing.paidAt) patch.paidAt = now;

  const rows = await db
    .update(invoicesTable)
    .set(patch)
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.status, existing.status)))
    .returning();
  if (rows.length === 0) {
    res.status(409).json({
      error: "Invoice was updated by someone else. Refresh and try again.",
    });
    return;
  }

  req.log.info({ invoiceId: id, status: nextStatus, by: user.id }, "invoice status updated");
  res.status(200).json(await buildDetail(rows[0]));
});

router.post("/:id/payments", requireRole(...ADMIN_ROLES), async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = RecordPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const input = parsed.data;
  const paidAt = input.paidAt ? new Date(input.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    res.status(400).json({ error: "Invalid paidAt" });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      // Lock the invoice row so balance can't shift under us.
      const [inv] = await tx
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.id, id))
        .for("update")
        .limit(1);
      if (!inv) throw new HttpError(404, "Invoice not found");
      if (inv.status === "paid") throw new HttpError(400, "Invoice is already paid");
      if (inv.status === "void") throw new HttpError(400, "Cannot record payment on a void invoice");

      const [agg] = await tx
        .select({ paid: sql<string>`COALESCE(SUM(${paymentsTable.amount}), 0)` })
        .from(paymentsTable)
        .where(eq(paymentsTable.invoiceId, id));
      const alreadyPaid = Number(agg?.paid ?? 0);
      const balance = inv.totalAmount - alreadyPaid;
      if (balance <= 0) {
        throw new HttpError(400, "Invoice has no outstanding balance");
      }
      if (input.amount > balance) {
        throw new HttpError(400, `Amount exceeds outstanding balance of FRW ${balance.toLocaleString("en-US")}`);
      }

      await tx.insert(paymentsTable).values({
        invoiceId: id,
        amount: input.amount,
        method: input.method,
        reference: input.reference?.trim() || null,
        notes: input.notes?.trim() || null,
        paidAt,
        recordedById: user.id,
      });

      const newPaid = alreadyPaid + input.amount;
      if (newPaid >= inv.totalAmount) {
        // Auto-flip to paid regardless of prior status (overrides normal workflow).
        // Also backfill sentAt if invoice skipped the 'sent' state, so the lifecycle
        // timeline stays consistent (paidAt is always after sentAt).
        const now = new Date();
        await tx
          .update(invoicesTable)
          .set({
            status: "paid",
            paidAt: now,
            sentAt: inv.sentAt ?? now,
            updatedAt: now,
          })
          .where(eq(invoicesTable.id, id));
      }
    });
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).json({ error: e.message });
      return;
    }
    throw e;
  }

  const [updated] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  req.log.info({ invoiceId: id, amount: input.amount, method: input.method, by: user.id }, "payment recorded");
  res.status(201).json(await buildDetail(updated));
});

// PDF download — kept out of the OpenAPI hooks (binary stream).
// Same-origin cookie auth means a plain <a href="/api/invoices/:id/pdf"> works.
router.get("/:id/pdf", async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [inv] = await db.select().from(invoicesTable).where(eq(invoicesTable.id, id)).limit(1);
  if (!inv) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  if (!canViewInvoice(user.role, user.id, inv)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const userMap = await fetchUserMap([inv.clientId]);
  const orderMap = await fetchOrderMap([inv.orderId]);
  const client = userMap.get(inv.clientId);
  const order = orderMap.get(inv.orderId);

  const filename = `${formatInvoiceNumber(inv.id)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  // Sensitive document — never cache in shared/intermediary caches.
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);
  renderInvoicePdf(doc, inv, client ?? null, order ?? null);
  doc.end();
});

function frw(n: number): string {
  return `FRW ${new Intl.NumberFormat("en-US").format(n)}`;
}

function renderInvoicePdf(
  doc: PDFKit.PDFDocument,
  inv: Invoice,
  client: UserRow | null,
  order: OrderRow | null,
) {
  const NAVY = "#04091A";
  const BLUE = "#2645C8";
  const MUTED = "#6B7280";

  // Header band
  doc.rect(0, 0, doc.page.width, 110).fill(NAVY);
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text("Duplicator Ltd", 50, 40);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#7FE8FF")
    .text("Print · Branding · Sewing", 50, 68);
  doc
    .fillColor("#FFFFFF")
    .fontSize(9)
    .text("Karuruma, Kigali  ·  +250 788 355 226  ·  duplicator10@gmail.com", 50, 84);

  // Invoice meta block (right)
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text("INVOICE", 380, 40, { width: 165, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("#A9C6FF")
    .text(formatInvoiceNumber(inv.id), 380, 66, { width: 165, align: "right" });

  doc.moveDown(2);
  doc.fillColor(NAVY);

  // Bill to + meta rows
  const metaTop = 150;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(MUTED)
    .text("BILL TO", 50, metaTop);
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(NAVY)
    .text(client?.name ?? "Client", 50, metaTop + 14);
  if (client?.email) doc.fontSize(10).fillColor(MUTED).text(client.email);

  const labelX = 360;
  const valueX = 460;
  const row = (i: number, label: string, value: string) => {
    const y = metaTop + i * 16;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text(label, labelX, y, { width: 95, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor(NAVY).text(value, valueX, y, { width: 95, align: "right" });
  };
  row(0, "ISSUED", inv.issueDate.toLocaleDateString());
  row(1, "DUE", inv.dueDate.toLocaleDateString());
  row(2, "ORDER", order ? formatOrderNumber(inv.orderId) : `#${inv.orderId}`);
  row(3, "STATUS", inv.status.toUpperCase());

  // Items table
  const tableTop = 260;
  doc.rect(50, tableTop, doc.page.width - 100, 26).fill(BLUE);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);
  doc.text("Description", 60, tableTop + 9, { width: 260 });
  doc.text("Qty", 320, tableTop + 9, { width: 50, align: "right" });
  doc.text("Unit", 370, tableTop + 9, { width: 80, align: "right" });
  doc.text("Line total", 450, tableTop + 9, { width: 95, align: "right" });

  let y = tableTop + 36;
  const items = (inv.items ?? []) as OrderItemLine[];
  doc.font("Helvetica").fontSize(10).fillColor(NAVY);
  items.forEach((line, i) => {
    if (i % 2 === 1) {
      doc.rect(50, y - 6, doc.page.width - 100, 24).fillOpacity(0.05).fill(BLUE).fillOpacity(1);
      doc.fillColor(NAVY);
    }
    doc.text(line.description, 60, y, { width: 260 });
    doc.text(String(line.qty), 320, y, { width: 50, align: "right" });
    doc.text(frw(line.unitPrice), 370, y, { width: 80, align: "right" });
    doc.text(frw(line.qty * line.unitPrice), 450, y, { width: 95, align: "right" });
    y += 24;
  });

  // Totals
  y += 12;
  doc.moveTo(360, y).lineTo(545, y).strokeColor("#E5E7EB").stroke();
  y += 10;
  const totalRow = (label: string, value: string, bold = false) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 12 : 10)
      .fillColor(bold ? NAVY : MUTED)
      .text(label, 360, y, { width: 90, align: "right" });
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 12 : 10)
      .fillColor(NAVY)
      .text(value, 450, y, { width: 95, align: "right" });
    y += bold ? 20 : 16;
  };
  totalRow("Subtotal", frw(inv.subtotalAmount));
  if (inv.taxRatePercent > 0) totalRow(`VAT (${inv.taxRatePercent}%)`, frw(inv.taxAmount));
  totalRow("TOTAL", frw(inv.totalAmount), true);

  // Notes
  if (inv.notes) {
    y += 14;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("NOTES", 50, y);
    y += 14;
    doc.font("Helvetica").fontSize(10).fillColor(NAVY).text(inv.notes, 50, y, { width: 495 });
  }

  // Footer
  const footerY = doc.page.height - 60;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED)
    .text(
      "Thank you for your business. Payable by bank transfer or MoMo to +250 788 355 226.",
      50,
      footerY,
      { width: doc.page.width - 100, align: "center" },
    );
}

export default router;
