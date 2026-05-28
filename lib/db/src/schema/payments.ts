import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { invoicesTable } from "./invoices";
import { usersTable } from "./users";

export const paymentMethodEnum = pgEnum("payment_method", [
  "momo",
  "airtel",
  "bank_transfer",
  "cash",
  "other",
]);

export type PaymentMethod = (typeof paymentMethodEnum.enumValues)[number];

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "momo",
  "airtel",
  "bank_transfer",
  "cash",
  "other",
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  momo: "MTN MoMo",
  airtel: "Airtel Money",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoicesTable.id, { onDelete: "restrict" }),
  amount: bigint("amount", { mode: "number" }).notNull(),
  method: paymentMethodEnum("method").notNull(),
  /** External reference: MoMo txn id, bank slip number, cheque #, etc. */
  reference: text("reference"),
  notes: text("notes"),
  /** When the payment actually happened (admin-supplied; defaults to now). */
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  recordedById: integer("recorded_by_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
