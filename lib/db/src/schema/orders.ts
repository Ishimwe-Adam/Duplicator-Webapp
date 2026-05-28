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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "quoted",
  "approved",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
]);

export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "quoted",
  "approved",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
];

export interface OrderItemLine {
  description: string;
  qty: number;
  unitPrice: number;
}

export const orderItemLineSchema = z.object({
  description: z.string().min(1).max(200),
  qty: z.number().int().min(1).max(100_000),
  unitPrice: z.number().int().min(0).max(1_000_000_000),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  assignedTo: integer("assigned_to").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  items: jsonb("items").$type<OrderItemLine[]>().notNull(),
  subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull(),
  status: orderStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderStatusEventsTable = pgTable("order_status_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => ordersTable.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  note: text("note"),
  byUserId: integer("by_user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderStatusEvent = typeof orderStatusEventsTable.$inferSelect;

/** Public order number derived from numeric id — kept stable + readable. */
export function formatOrderNumber(id: number): string {
  return `DUP-${String(id).padStart(5, "0")}`;
}

/** Canonical order lifecycle (cancelled handled separately). */
const ORDER_PIPELINE: OrderStatus[] = [
  "draft",
  "quoted",
  "approved",
  "in_production",
  "ready",
  "delivered",
];

/**
 * Allowed next statuses from `from`. Pipeline progresses one step at a time,
 * plus `cancelled` is always available from open states.
 * Closed states (delivered/cancelled) return [].
 *
 * Authoritative — server MUST enforce this; frontend mirrors for UX only.
 */
export function nextAllowedOrderStatuses(from: OrderStatus): OrderStatus[] {
  if (from === "delivered" || from === "cancelled") return [];
  const idx = ORDER_PIPELINE.indexOf(from);
  const forward =
    idx >= 0 && idx < ORDER_PIPELINE.length - 1
      ? [ORDER_PIPELINE[idx + 1]]
      : [];
  return [...forward, "cancelled"];
}
