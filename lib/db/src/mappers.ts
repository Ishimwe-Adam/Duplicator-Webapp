import type { UserRole } from "./schema/users";
import type { OrderStatus, OrderItemLine } from "./schema/orders";
import type { InvoiceStatus } from "./schema/invoices";
import type { PaymentMethod } from "./schema/payments";

export type User = {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: UserRole;
  companyName: string | null;
  profilePictureUrl: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: number;
  token: string;
  userId: number;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
};

export type Order = {
  id: number;
  clientId: number;
  assignedTo: number | null;
  title: string;
  items: OrderItemLine[];
  subtotalAmount: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderStatusEvent = {
  id: number;
  orderId: number;
  status: OrderStatus;
  note: string | null;
  byUserId: number | null;
  createdAt: Date;
};

export type Invoice = {
  id: number;
  orderId: number;
  clientId: number;
  items: OrderItemLine[];
  subtotalAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes: string | null;
  issueDate: Date;
  dueDate: Date;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Payment = {
  id: number;
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paidAt: Date;
  recordedById: number;
  createdAt: Date;
};

type Row = Record<string, unknown>;

export function mapUser(r: Row): User {
  return {
    id: r.id as number,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    name: r.name as string,
    phone: (r.phone ?? null) as string | null,
    role: r.role as UserRole,
    companyName: (r.company_name ?? null) as string | null,
    profilePictureUrl: (r.profile_picture_url ?? null) as string | null,
    isActive: r.is_active as boolean,
    failedLoginAttempts: r.failed_login_attempts as number,
    lockedUntil: r.locked_until ? new Date(r.locked_until as string) : null,
    createdAt: new Date(r.created_at as string),
    updatedAt: new Date(r.updated_at as string),
  };
}

export function mapSession(r: Row): Session {
  return {
    id: r.id as number,
    token: r.token as string,
    userId: r.user_id as number,
    userAgent: (r.user_agent ?? null) as string | null,
    ipAddress: (r.ip_address ?? null) as string | null,
    expiresAt: new Date(r.expires_at as string),
    createdAt: new Date(r.created_at as string),
    lastActiveAt: new Date(r.last_active_at as string),
  };
}

export function mapOrder(r: Row): Order {
  return {
    id: r.id as number,
    clientId: r.client_id as number,
    assignedTo: (r.assigned_to ?? null) as number | null,
    title: r.title as string,
    items: (r.items ?? []) as OrderItemLine[],
    subtotalAmount: Number(r.subtotal_amount),
    status: r.status as OrderStatus,
    notes: (r.notes ?? null) as string | null,
    createdAt: new Date(r.created_at as string),
    updatedAt: new Date(r.updated_at as string),
  };
}

export function mapOrderStatusEvent(r: Row): OrderStatusEvent {
  return {
    id: r.id as number,
    orderId: r.order_id as number,
    status: r.status as OrderStatus,
    note: (r.note ?? null) as string | null,
    byUserId: (r.by_user_id ?? null) as number | null,
    createdAt: new Date(r.created_at as string),
  };
}

export function mapInvoice(r: Row): Invoice {
  return {
    id: r.id as number,
    orderId: r.order_id as number,
    clientId: r.client_id as number,
    items: (r.items ?? []) as OrderItemLine[],
    subtotalAmount: Number(r.subtotal_amount),
    taxRatePercent: r.tax_rate_percent as number,
    taxAmount: Number(r.tax_amount),
    totalAmount: Number(r.total_amount),
    status: r.status as InvoiceStatus,
    notes: (r.notes ?? null) as string | null,
    issueDate: new Date(r.issue_date as string),
    dueDate: new Date(r.due_date as string),
    sentAt: r.sent_at ? new Date(r.sent_at as string) : null,
    paidAt: r.paid_at ? new Date(r.paid_at as string) : null,
    createdAt: new Date(r.created_at as string),
    updatedAt: new Date(r.updated_at as string),
  };
}

export function mapPayment(r: Row): Payment {
  return {
    id: r.id as number,
    invoiceId: r.invoice_id as number,
    amount: Number(r.amount),
    method: r.method as PaymentMethod,
    reference: (r.reference ?? null) as string | null,
    notes: (r.notes ?? null) as string | null,
    paidAt: new Date(r.paid_at as string),
    recordedById: r.recorded_by_id as number,
    createdAt: new Date(r.created_at as string),
  };
}
