export { db, pool } from "./client";

export {
  type User,
  type Session,
  type Order,
  type OrderStatusEvent,
  type Invoice,
  type Payment,
  mapUser,
  mapSession,
  mapOrder,
  mapOrderStatusEvent,
  mapInvoice,
  mapPayment,
} from "./mappers";

export { type UserRole } from "./schema/users";

export {
  type OrderStatus,
  type OrderItemLine,
  ALL_ORDER_STATUSES,
  formatOrderNumber,
  nextAllowedOrderStatuses,
  orderItemLineSchema,
} from "./schema/orders";

export {
  type InvoiceStatus,
  ALL_INVOICE_STATUSES,
  formatInvoiceNumber,
  nextAllowedInvoiceStatuses,
  computeInvoiceTotals,
  isInvoiceOverdue,
} from "./schema/invoices";

export {
  type PaymentMethod,
  ALL_PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
} from "./schema/payments";

export * from "./schema/index";
