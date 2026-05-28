import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { OrderItemLine } from "./orders";
import { ordersTable } from "./orders";
import { usersTable } from "./users";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "void",
]);

export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

export const ALL_INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "void"];

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "restrict" }),
  clientId: integer("client_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  /** Snapshot of order items at the time of issue. */
  items: jsonb("items").$type<OrderItemLine[]>().notNull(),
  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
  /** VAT rate as integer percent (e.g. 18 = 18%). 0 means no tax. */
  taxRatePercent: integer("tax_rate_percent").notNull().default(0),
  taxAmount: bigint("tax_amount", { mode: "number" }).notNull(),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  issueDate: timestamp("issue_date", { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Invoice = typeof invoicesTable.$inferSelect;

/** Public invoice number derived from numeric id. */
export function formatInvoiceNumber(id: number): string {
  return `INV-${String(id).padStart(5, "0")}`;
}

/**
 * Allowed next statuses from `from`.
 * - draft  → sent, void
 * - sent   → paid, void
 * - paid   → (terminal)
 * - void   → (terminal)
 *
 * Authoritative — server MUST enforce this; frontend mirrors for UX only.
 */
export function nextAllowedInvoiceStatuses(from: InvoiceStatus): InvoiceStatus[] {
  switch (from) {
    case "draft":
      return ["sent", "void"];
    case "sent":
      return ["paid", "void"];
    default:
      return [];
  }
}

/**
 * Compute tax + total from line items and an integer-percent tax rate.
 * Rounds tax to the nearest FRW.
 */
export function computeInvoiceTotals(
  items: OrderItemLine[],
  taxRatePercent: number,
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const tax = Math.round((subtotal * taxRatePercent) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

/** A common "is this past due?" predicate. UI-only — not stored as a status. */
export function isInvoiceOverdue(inv: Pick<Invoice, "status" | "dueDate">): boolean {
  if (inv.status !== "sent") return false;
  return inv.dueDate.getTime() < Date.now();
}
