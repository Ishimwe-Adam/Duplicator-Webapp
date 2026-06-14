import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";

type Role = "super_admin" | "admin" | "staff" | "client";
type OrderStatus =
  | "draft"
  | "quoted"
  | "approved"
  | "in_production"
  | "ready"
  | "delivered"
  | "cancelled";
type InvoiceStatus = "draft" | "sent" | "paid" | "void";
type PaymentMethod = "momo" | "airtel" | "bank_transfer" | "cash" | "other";

type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: Role;
  phone: string | null;
  companyName: string | null;
  profilePictureUrl: string | null;
};

type OrderItem = {
  description: string;
  qty: number;
  unitPrice: number;
};

type Order = {
  id: number;
  clientId: number;
  assignedTo: number | null;
  title: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: Array<{
    id: number;
    status: OrderStatus;
    note: string | null;
    createdAt: string;
    byUserId: number | null;
  }>;
};

type Payment = {
  id: number;
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  recordedById: number;
  createdAt: string;
};

type Invoice = {
  id: number;
  orderId: number;
  clientId: number;
  status: InvoiceStatus;
  items: OrderItem[];
  subtotalAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  issueDate: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const SESSION_COOKIE = "duplicator_session";
const now = new Date();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

const users: User[] = [
  {
    id: 1,
    email: "admin@duplicator.rw",
    password: "Admin@2026",
    name: "Adam (Owner)",
    role: "super_admin",
    phone: null,
    companyName: null,
    profilePictureUrl: null,
  },
  {
    id: 2,
    email: "manager@duplicator.rw",
    password: "Manager@2026",
    name: "Sales Manager",
    role: "admin",
    phone: null,
    companyName: null,
    profilePictureUrl: null,
  },
  {
    id: 3,
    email: "staff@duplicator.rw",
    password: "Staff@2026",
    name: "Print Operator",
    role: "staff",
    phone: null,
    companyName: null,
    profilePictureUrl: null,
  },
  {
    id: 4,
    email: "client@example.com",
    password: "Client@2026",
    name: "Demo Client",
    role: "client",
    phone: null,
    companyName: "Acme Co.",
    profilePictureUrl: null,
  },
  {
    id: 5,
    email: "bk@example.com",
    password: "Client@2026",
    name: "Bank of Kigali Team",
    role: "client",
    phone: null,
    companyName: "Bank of Kigali",
    profilePictureUrl: null,
  },
];

const orders: Order[] = [
  makeOrder(1, 4, 3, "Branded notebooks - A5 hardcover", "in_production", [
    { description: "A5 hardcover notebook with foil logo", qty: 500, unitPrice: 11000 },
  ], 21),
  makeOrder(2, 4, 3, "Roll-up banners - 3 designs", "ready", [
    { description: "Roll-up banner, premium stand", qty: 6, unitPrice: 95000 },
  ], 14),
  makeOrder(3, 4, null, "Foil-stamped business cards", "delivered", [
    { description: "Business cards, 350gsm, foil finish", qty: 1500, unitPrice: 283 },
  ], 38),
  makeOrder(4, 5, 3, "Corporate presentation folders", "approved", [
    { description: "A4 presentation folder with pocket", qty: 300, unitPrice: 2400 },
    { description: "Design adaptation", qty: 1, unitPrice: 85000 },
  ], 4),
  makeOrder(5, 5, null, "Staff polo shirts", "quoted", [
    { description: "Polo shirt with embroidery", qty: 80, unitPrice: 18000 },
  ], 7),
];

const invoices: Invoice[] = [
  makeInvoice(1, 1, "sent", 18, daysFromNow(7), null, null),
  makeInvoice(2, 2, "paid", 18, daysAgo(2), daysAgo(5), daysAgo(2)),
  makeInvoice(3, 3, "paid", 18, daysAgo(20), daysAgo(30), daysAgo(20)),
  makeInvoice(4, 4, "sent", 18, daysFromNow(12), null, null),
];

const payments: Payment[] = [
  {
    id: 1,
    invoiceId: 2,
    amount: invoices[1].totalAmount,
    method: "bank_transfer",
    reference: "BOA-77831",
    notes: null,
    paidAt: daysAgo(2),
    recordedById: 2,
    createdAt: daysAgo(2),
  },
  {
    id: 2,
    invoiceId: 3,
    amount: invoices[2].totalAmount,
    method: "momo",
    reference: "MM-90120",
    notes: null,
    paidAt: daysAgo(20),
    recordedById: 1,
    createdAt: daysAgo(20),
  },
];

const sessions = new Map<string, number>();

const app: Express = express();
app.set("trust proxy", 1);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/login", (req, res) => {
  const email = String(req.body?.email ?? "").toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  res.json({ user: authUser(user) });
});

app.post("/api/auth/register", (req, res) => {
  const email = String(req.body?.email ?? "").toLowerCase();
  if (users.some((u) => u.email === email)) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }
  const user: User = {
    id: Math.max(...users.map((u) => u.id)) + 1,
    email,
    password: String(req.body?.password ?? ""),
    name: String(req.body?.name ?? "Client"),
    role: "client",
    phone: req.body?.phone ?? null,
    companyName: req.body?.companyName ?? null,
    profilePictureUrl: null,
  };
  users.push(user);
  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  res.cookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  res.status(201).json({ user: authUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.status(204).end();
});

app.get("/api/auth/me", (req, res) => {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(authUser(user));
});

app.use("/api/orders", requireAuth);

app.get("/api/orders", (req, res) => {
  const user = res.locals.user as User;
  res.json({
    orders: visibleOrders(user).map(orderSummary),
  });
});

app.post("/api/orders", (req, res) => {
  const user = res.locals.user as User;
  if (user.role === "staff") {
    res.status(403).json({ error: "Staff cannot create orders" });
    return;
  }
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const id = Math.max(...orders.map((o) => o.id)) + 1;
  const clientId = user.role === "client" ? user.id : Number(req.body?.clientId);
  const order = makeOrder(
    id,
    clientId,
    null,
    String(req.body?.title ?? "New order"),
    "draft",
    items,
    0,
  );
  order.notes = req.body?.notes ?? null;
  orders.unshift(order);
  res.status(201).json(orderDetail(order));
});

app.get("/api/orders/:id", (req, res) => {
  const user = res.locals.user as User;
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order || !visibleOrders(user).some((o) => o.id === order.id)) {
    res.status(order ? 403 : 404).json({ error: order ? "Forbidden" : "Order not found" });
    return;
  }
  res.json(orderDetail(order));
});

app.patch("/api/orders/:id/status", (req, res) => {
  const user = res.locals.user as User;
  if (user.role === "client") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (user.role === "staff" && order.assignedTo !== user.id) {
    res.status(403).json({ error: "You can only update orders assigned to you" });
    return;
  }
  const status = req.body?.status as OrderStatus;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  order.timeline.push({
    id: order.timeline.length + 1,
    status,
    note: req.body?.note ?? null,
    createdAt: order.updatedAt,
    byUserId: user.id,
  });
  res.json(orderDetail(order));
});

app.use("/api/invoices", requireAuth);

app.get("/api/invoices", (req, res) => {
  const user = res.locals.user as User;
  if (user.role === "staff") {
    res.status(403).json({ error: "Staff cannot view invoices" });
    return;
  }
  res.json({ invoices: visibleInvoices(user).map(invoiceSummary) });
});

app.post("/api/invoices", (req, res) => {
  const user = res.locals.user as User;
  if (!isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const order = orders.find((o) => o.id === Number(req.body?.orderId));
  if (!order) {
    res.status(400).json({ error: "Order not found" });
    return;
  }
  const id = Math.max(...invoices.map((i) => i.id)) + 1;
  const invoice = makeInvoice(
    id,
    order.id,
    "draft",
    Number(req.body?.taxRatePercent ?? 18),
    req.body?.dueDate ?? daysFromNow(14),
    null,
    null,
  );
  invoice.notes = req.body?.notes ?? null;
  invoices.unshift(invoice);
  res.status(201).json(invoiceDetail(invoice));
});

app.get("/api/invoices/:id", (req, res) => {
  const user = res.locals.user as User;
  const invoice = invoices.find((i) => i.id === Number(req.params.id));
  if (!invoice || !visibleInvoices(user).some((i) => i.id === invoice.id)) {
    res.status(invoice ? 403 : 404).json({ error: invoice ? "Forbidden" : "Invoice not found" });
    return;
  }
  res.json(invoiceDetail(invoice));
});

app.patch("/api/invoices/:id/status", (req, res) => {
  const user = res.locals.user as User;
  if (!isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const invoice = invoices.find((i) => i.id === Number(req.params.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  invoice.status = req.body?.status as InvoiceStatus;
  invoice.updatedAt = new Date().toISOString();
  if (invoice.status === "sent" && !invoice.sentAt) invoice.sentAt = invoice.updatedAt;
  if (invoice.status === "paid" && !invoice.paidAt) invoice.paidAt = invoice.updatedAt;
  res.json(invoiceDetail(invoice));
});

app.post("/api/invoices/:id/payments", (req, res) => {
  const user = res.locals.user as User;
  if (!isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const invoice = invoices.find((i) => i.id === Number(req.params.id));
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const payment: Payment = {
    id: Math.max(...payments.map((p) => p.id)) + 1,
    invoiceId: invoice.id,
    amount: Number(req.body?.amount ?? 0),
    method: req.body?.method ?? "cash",
    reference: req.body?.reference ?? null,
    notes: req.body?.notes ?? null,
    paidAt: req.body?.paidAt ?? new Date().toISOString(),
    recordedById: user.id,
    createdAt: new Date().toISOString(),
  };
  payments.push(payment);
  if (invoiceSummary(invoice).balanceDue <= 0) {
    invoice.status = "paid";
    invoice.paidAt = payment.paidAt;
    invoice.sentAt = invoice.sentAt ?? payment.paidAt;
  }
  res.status(201).json(invoiceDetail(invoice));
});

app.get("/api/invoices/:id/pdf", (req, res) => {
  const user = res.locals.user as User | undefined;
  const invoice = invoices.find((i) => i.id === Number(req.params.id));
  if (!user || !invoice || !visibleInvoices(user).some((i) => i.id === invoice.id)) {
    res.status(invoice ? 403 : 404).json({ error: invoice ? "Forbidden" : "Invoice not found" });
    return;
  }
  res.type("text/plain").send(`${formatInvoiceNumber(invoice.id)} demo PDF placeholder`);
});

app.use("/api/analytics", requireAuth);

app.get("/api/analytics/summary", (req, res) => {
  const user = res.locals.user as User;
  if (!isAdmin(user)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const paidPayments = payments;
  const revenueThisMonth = sum(
    paidPayments.filter((p) => new Date(p.paidAt).getMonth() === now.getMonth()).map((p) => p.amount),
  );
  const revenueLastMonth = sum(
    paidPayments.filter((p) => new Date(p.paidAt).getMonth() === now.getMonth() - 1).map((p) => p.amount),
  );
  const outstandingInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "void");
  const byStatus = ["draft", "quoted", "approved", "in_production", "ready", "delivered", "cancelled"].map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));
  res.json({
    generatedAt: new Date().toISOString(),
    revenue: {
      thisMonth: revenueThisMonth,
      lastMonth: revenueLastMonth,
      last12Months: last12Months(),
    },
    receivables: {
      outstandingAmount: sum(outstandingInvoices.map((i) => invoiceSummary(i).balanceDue)),
      overdueCount: outstandingInvoices.filter((i) => i.status === "sent" && new Date(i.dueDate) < now).length,
    },
    orders: {
      active: orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length,
      dueSoon: orders.filter((o) => new Date(o.createdAt) > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)).length,
      byStatus,
    },
    clients: {
      total: users.filter((u) => u.role === "client").length,
      newThisMonth: 1,
      top: topClients(),
    },
    recentOrders: orders.slice(0, 5).map((order) => ({
      id: order.id,
      orderNumber: formatOrderNumber(order.id),
      title: order.title,
      status: order.status,
      subtotalAmount: order.subtotalAmount,
      clientName: userById(order.clientId)?.companyName ?? userById(order.clientId)?.name ?? "Client",
      createdAt: order.createdAt,
    })),
  });
});

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.locals.user = user;
  next();
}

function currentUser(req: express.Request): User | null {
  const token = req.cookies?.[SESSION_COOKIE];
  const id = token ? sessions.get(token) : undefined;
  return id ? userById(id) ?? null : null;
}

function authUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    companyName: user.companyName,
    profilePictureUrl: user.profilePictureUrl,
  };
}

function isAdmin(user: User) {
  return user.role === "super_admin" || user.role === "admin";
}

function userById(id: number) {
  return users.find((u) => u.id === id);
}

function partyRef(id: number | null) {
  if (!id) return null;
  const user = userById(id);
  return user ? { id: user.id, name: user.companyName ?? user.name, email: user.email } : null;
}

function visibleOrders(user: User) {
  if (user.role === "client") return orders.filter((o) => o.clientId === user.id);
  if (user.role === "staff") return orders.filter((o) => o.assignedTo === user.id);
  return orders;
}

function visibleInvoices(user: User) {
  if (user.role === "client") return invoices.filter((i) => i.clientId === user.id);
  if (isAdmin(user)) return invoices;
  return [];
}

function makeOrder(
  id: number,
  clientId: number,
  assignedTo: number | null,
  title: string,
  status: OrderStatus,
  items: OrderItem[],
  ageDays: number,
): Order {
  const createdAt = daysAgo(ageDays);
  const subtotalAmount = sum(items.map((item) => item.qty * item.unitPrice));
  return {
    id,
    clientId,
    assignedTo,
    title,
    status,
    items,
    subtotalAmount,
    notes: "Demo order loaded from the local development API.",
    createdAt,
    updatedAt: createdAt,
    timeline: [
      { id: 1, status: "draft", note: "Order created", createdAt, byUserId: clientId },
      { id: 2, status, note: `Moved to ${status.replace("_", " ")}`, createdAt: daysAgo(Math.max(ageDays - 1, 0)), byUserId: assignedTo ?? 2 },
    ],
  };
}

function makeInvoice(
  id: number,
  orderId: number,
  status: InvoiceStatus,
  taxRatePercent: number,
  dueDate: string,
  sentAt: string | null,
  paidAt: string | null,
): Invoice {
  const order = orders.find((o) => o.id === orderId)!;
  const taxAmount = Math.round((order.subtotalAmount * taxRatePercent) / 100);
  const createdAt = order.createdAt;
  return {
    id,
    orderId,
    clientId: order.clientId,
    status,
    items: order.items,
    subtotalAmount: order.subtotalAmount,
    taxRatePercent,
    taxAmount,
    totalAmount: order.subtotalAmount + taxAmount,
    notes: "Demo invoice loaded from the local development API.",
    issueDate: createdAt,
    dueDate,
    sentAt,
    paidAt,
    createdAt,
    updatedAt: paidAt ?? sentAt ?? createdAt,
  };
}

function orderSummary(order: Order) {
  return {
    id: order.id,
    orderNumber: formatOrderNumber(order.id),
    title: order.title,
    status: order.status,
    subtotalAmount: order.subtotalAmount,
    itemCount: sum(order.items.map((item) => item.qty)),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    client: partyRef(order.clientId),
    assignedTo: partyRef(order.assignedTo),
  };
}

function orderDetail(order: Order) {
  return {
    ...orderSummary(order),
    items: order.items,
    notes: order.notes,
    timeline: order.timeline.map((event) => ({
      id: event.id,
      status: event.status,
      note: event.note,
      createdAt: event.createdAt,
      by: partyRef(event.byUserId),
    })),
  };
}

function invoiceSummary(invoice: Invoice) {
  const amountPaid = sum(payments.filter((p) => p.invoiceId === invoice.id).map((p) => p.amount));
  return {
    id: invoice.id,
    invoiceNumber: formatInvoiceNumber(invoice.id),
    status: invoice.status,
    subtotalAmount: invoice.subtotalAmount,
    taxRatePercent: invoice.taxRatePercent,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    amountPaid,
    balanceDue: Math.max(0, invoice.totalAmount - amountPaid),
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    isOverdue: invoice.status === "sent" && new Date(invoice.dueDate) < now,
    client: partyRef(invoice.clientId),
    order: orderRef(invoice.orderId),
    createdAt: invoice.createdAt,
  };
}

function invoiceDetail(invoice: Invoice) {
  const summary = invoiceSummary(invoice);
  return {
    ...summary,
    items: invoice.items,
    notes: invoice.notes,
    sentAt: invoice.sentAt,
    paidAt: invoice.paidAt,
    updatedAt: invoice.updatedAt,
    payments: payments.filter((p) => p.invoiceId === invoice.id).map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      recordedBy: partyRef(payment.recordedById),
      createdAt: payment.createdAt,
    })),
  };
}

function orderRef(orderId: number) {
  const order = orders.find((o) => o.id === orderId);
  return {
    id: orderId,
    orderNumber: formatOrderNumber(orderId),
    title: order?.title ?? "Order",
  };
}

function topClients() {
  return users
    .filter((u) => u.role === "client")
    .map((client) => {
      const clientInvoices = invoices.filter((i) => i.clientId === client.id);
      const revenue = sum(
        payments
          .filter((p) => clientInvoices.some((i) => i.id === p.invoiceId))
          .map((p) => p.amount),
      );
      return {
        id: client.id,
        name: client.companyName ?? client.name,
        email: client.email,
        revenue,
        invoiceCount: clientInvoices.length,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function last12Months() {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const amount = sum(
      payments
        .filter((payment) => payment.paidAt.startsWith(month))
        .map((payment) => payment.amount),
    );
    return { month, amount };
  });
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function formatOrderNumber(id: number) {
  return `DUP-${String(id).padStart(5, "0")}`;
}

function formatInvoiceNumber(id: number) {
  return `INV-${String(id).padStart(5, "0")}`;
}

export default app;
