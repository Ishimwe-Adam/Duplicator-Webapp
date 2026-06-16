import { Router, type IRouter } from "express";
import PDFDocument from "pdfkit";
import {
  supabase,
  mapInvoice,
  mapPayment,
  formatInvoiceNumber,
  formatOrderNumber,
  nextAllowedInvoiceStatuses,
  isInvoiceOverdue,
  type Invoice,
  type InvoiceStatus,
  type OrderItemLine,
  type Payment,
} from "@workspace/db";
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

const router: IRouter = Router();
const ADMIN_ROLES = ["super_admin", "admin"] as const;

type UserRow  = { id: number; name: string; email: string | null };
type OrderRow = { id: number; title: string };

function partyRef(u: UserRow | null | undefined): OrderPartyRef | null {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email ?? null };
}

async function fetchUserMap(ids: number[]): Promise<Map<number, UserRow>> {
  const unique = Array.from(new Set(ids));
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

async function fetchOrderMap(ids: number[]): Promise<Map<number, OrderRow>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();
  const { data: rows } = await supabase
    .from("orders")
    .select("id, title")
    .in("id", unique);
  return new Map(
    (rows ?? []).map((r) => [
      r.id as number,
      { id: r.id as number, title: r.title as string },
    ]),
  );
}

function orderRef(o: OrderRow | null | undefined, orderId: number): InvoiceOrderRef {
  return { id: orderId, orderNumber: formatOrderNumber(orderId), title: o?.title ?? "Order" };
}

async function fetchPaidByInvoice(invoiceIds: number[]): Promise<Map<number, number>> {
  const unique = Array.from(new Set(invoiceIds));
  if (unique.length === 0) return new Map();
  const { data: rows } = await supabase
    .from("payments")
    .select("invoice_id, amount")
    .in("invoice_id", unique);
  const map = new Map<number, number>();
  for (const r of rows ?? []) {
    const iid = r.invoice_id as number;
    map.set(iid, (map.get(iid) ?? 0) + Number(r.amount));
  }
  return map;
}

async function fetchPaymentsForInvoice(invoiceId: number): Promise<Payment[]> {
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("paid_at", { ascending: true });
  return (data ?? []).map((r) => mapPayment(r as Record<string, unknown>));
}

function paymentDto(p: Payment, recordedBy: UserRow | null): PaymentDto {
  return {
    id: p.id,
    amount: p.amount,
    method: p.method,
    reference: p.reference ?? null,
    notes: p.notes ?? null,
    paidAt: p.paidAt,
    recordedBy: partyRef(recordedBy) ?? { id: p.recordedById, name: "Unknown", email: null },
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
    client: partyRef(userMap.get(inv.clientId)) ?? { id: inv.clientId, name: "Unknown", email: null },
    order: orderRef(orderMap.get(inv.orderId), inv.orderId),
    createdAt: inv.createdAt,
  };
}

async function buildDetail(inv: Invoice): Promise<InvoiceDetail> {
  const payments = await fetchPaymentsForInvoice(inv.id);
  const [userMap, orderMap] = await Promise.all([
    fetchUserMap([inv.clientId, ...payments.map((p) => p.recordedById)]),
    fetchOrderMap([inv.orderId]),
  ]);
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
    client: partyRef(userMap.get(inv.clientId)) ?? { id: inv.clientId, name: "Unknown", email: null },
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

router.use(requireAuth);

router.get("/", async (req, res) => {
  const user = req.user!;
  if (user.role === "staff") {
    res.status(403).json({ error: "Staff cannot view invoices" });
    return;
  }
  let query = supabase.from("invoices").select("*").order("created_at", { ascending: false });
  if (user.role === "client") query = query.eq("client_id", user.id);

  const { data: rows } = await query;
  const invs = (rows ?? []).map((r) => mapInvoice(r as Record<string, unknown>));

  const [userMap, orderMap, paidMap] = await Promise.all([
    fetchUserMap(invs.map((i) => i.clientId)),
    fetchOrderMap(invs.map((i) => i.orderId)),
    fetchPaidByInvoice(invs.map((i) => i.id)),
  ]);

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

  const { data, error } = await supabase.rpc("create_invoice", {
    p_order_id: input.orderId,
    p_tax_rate_percent: taxRate,
    p_notes: input.notes ?? null,
    p_due_date: dueDate.toISOString(),
  });

  if (error) {
    if (error.message.includes("ORDER_NOT_FOUND")) {
      res.status(400).json({ error: "Order not found" });
    } else if (error.message.includes("ORDER_CANCELLED")) {
      res.status(400).json({ error: "Cannot invoice a cancelled order" });
    } else {
      res.status(500).json({ error: "Failed to create invoice" });
    }
    return;
  }

  const rows = data as Record<string, unknown>[];
  if (!rows || rows.length === 0) {
    res.status(500).json({ error: "Failed to create invoice" });
    return;
  }

  const inv = mapInvoice(rows[0]);
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
  const { data: rows } = await supabase.from("invoices").select("*").eq("id", id).limit(1);
  const raw = rows?.[0];
  if (!raw) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const inv = mapInvoice(raw as Record<string, unknown>);
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

  const { data: rows } = await supabase.from("invoices").select("*").eq("id", id).limit(1);
  const raw = rows?.[0];
  if (!raw) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const existing = mapInvoice(raw as Record<string, unknown>);

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
  const patch: Record<string, unknown> = { status: nextStatus, updated_at: now.toISOString() };
  if (nextStatus === "sent" && !existing.sentAt) patch.sent_at = now.toISOString();
  if (nextStatus === "paid" && !existing.paidAt) patch.paid_at = now.toISOString();

  const { data: updated, error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", id)
    .eq("status", existing.status)
    .select();

  if (error || !updated || (updated as unknown[]).length === 0) {
    res.status(409).json({
      error: "Invoice was updated by someone else. Refresh and try again.",
    });
    return;
  }

  const updatedInv = mapInvoice((updated as Record<string, unknown>[])[0]);
  req.log.info({ invoiceId: id, status: nextStatus, by: user.id }, "invoice status updated");
  res.status(200).json(await buildDetail(updatedInv));
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

  const { data, error } = await supabase.rpc("record_payment", {
    p_invoice_id: id,
    p_amount: input.amount,
    p_method: input.method,
    p_reference: input.reference?.trim() || null,
    p_notes: input.notes?.trim() || null,
    p_paid_at: paidAt.toISOString(),
    p_recorded_by_id: user.id,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("INVOICE_NOT_FOUND")) {
      res.status(404).json({ error: "Invoice not found" });
    } else if (msg.includes("INVOICE_ALREADY_PAID")) {
      res.status(400).json({ error: "Invoice is already paid" });
    } else if (msg.includes("INVOICE_VOID")) {
      res.status(400).json({ error: "Cannot record payment on a void invoice" });
    } else if (msg.includes("NO_OUTSTANDING_BALANCE")) {
      res.status(400).json({ error: "Invoice has no outstanding balance" });
    } else if (msg.includes("AMOUNT_EXCEEDS_BALANCE")) {
      const balance = msg.split(":").pop()?.trim() ?? "0";
      res.status(400).json({
        error: `Amount exceeds outstanding balance of FRW ${Number(balance).toLocaleString("en-US")}`,
      });
    } else {
      res.status(500).json({ error: "Failed to record payment" });
    }
    return;
  }

  const { data: fresh } = await supabase.from("invoices").select("*").eq("id", id).limit(1);
  const freshInv = mapInvoice((fresh?.[0] ?? data?.[0]) as Record<string, unknown>);
  req.log.info({ invoiceId: id, amount: input.amount, method: input.method, by: user.id }, "payment recorded");
  res.status(201).json(await buildDetail(freshInv));
});

router.get("/:id/pdf", async (req, res) => {
  const user = req.user!;
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { data: rows } = await supabase.from("invoices").select("*").eq("id", id).limit(1);
  const raw = rows?.[0];
  if (!raw) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const inv = mapInvoice(raw as Record<string, unknown>);
  if (!canViewInvoice(user.role, user.id, inv)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const [userMap, orderMap] = await Promise.all([
    fetchUserMap([inv.clientId]),
    fetchOrderMap([inv.orderId]),
  ]);
  const client = userMap.get(inv.clientId) ?? null;
  const order  = orderMap.get(inv.orderId) ?? null;

  const filename = `${formatInvoiceNumber(inv.id)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);
  renderInvoicePdf(doc, inv, client, order);
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

  doc.rect(0, 0, doc.page.width, 110).fill(NAVY);
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(22).text("Duplicator Ltd", 50, 40);
  doc.font("Helvetica").fontSize(10).fillColor("#7FE8FF").text("Print · Branding · Sewing", 50, 68);
  doc.fillColor("#FFFFFF").fontSize(9).text("Karuruma, Kigali  ·  +250 788 355 226  ·  duplicator10@gmail.com", 50, 84);

  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(18).text("INVOICE", 380, 40, { width: 165, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#A9C6FF").text(formatInvoiceNumber(inv.id), 380, 66, { width: 165, align: "right" });

  doc.moveDown(2);
  doc.fillColor(NAVY);

  const metaTop = 150;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(MUTED).text("BILL TO", 50, metaTop);
  doc.font("Helvetica").fontSize(11).fillColor(NAVY).text(client?.name ?? "Client", 50, metaTop + 14);
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

  y += 12;
  doc.moveTo(360, y).lineTo(545, y).strokeColor("#E5E7EB").stroke();
  y += 10;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(bold ? NAVY : MUTED)
      .text(label, 360, y, { width: 90, align: "right" });
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(NAVY)
      .text(value, 450, y, { width: 95, align: "right" });
    y += bold ? 20 : 16;
  };
  totalRow("Subtotal", frw(inv.subtotalAmount));
  if (inv.taxRatePercent > 0) totalRow(`VAT (${inv.taxRatePercent}%)`, frw(inv.taxAmount));
  totalRow("TOTAL", frw(inv.totalAmount), true);

  if (inv.notes) {
    y += 14;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED).text("NOTES", 50, y);
    y += 14;
    doc.font("Helvetica").fontSize(10).fillColor(NAVY).text(inv.notes, 50, y, { width: 495 });
  }

  const footerY = doc.page.height - 60;
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(
    "Thank you for your business. Payable by bank transfer or MoMo to +250 788 355 226.",
    50, footerY, { width: doc.page.width - 100, align: "center" },
  );
}

export default router;
