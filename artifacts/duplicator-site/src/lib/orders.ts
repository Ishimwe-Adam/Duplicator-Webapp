import type { OrderStatus } from "@/lib/api-stub";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Draft",
  quoted: "Quoted",
  approved: "Approved",
  in_production: "In production",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Tone token mirrors StatusPill tones in Primitives.tsx. */
export type OrderStatusTone = "grey" | "blue" | "cyan" | "amber" | "green" | "red";

export const ORDER_STATUS_TONE: Record<OrderStatus, OrderStatusTone> = {
  draft: "grey",
  quoted: "cyan",
  approved: "blue",
  in_production: "amber",
  ready: "green",
  delivered: "green",
  cancelled: "red",
};

/** Logical lifecycle order (cancelled handled separately). */
export const ORDER_PIPELINE: OrderStatus[] = [
  "draft",
  "quoted",
  "approved",
  "in_production",
  "ready",
  "delivered",
];

/** What status transitions are allowed from `from`. */
export function nextAllowedStatuses(from: OrderStatus): OrderStatus[] {
  if (from === "delivered" || from === "cancelled") return [];
  const idx = ORDER_PIPELINE.indexOf(from);
  const forward = idx >= 0 && idx < ORDER_PIPELINE.length - 1
    ? [ORDER_PIPELINE[idx + 1]]
    : [];
  return [...forward, "cancelled"];
}

/** Where the "back to list" link should go based on the user's role. */
export function ordersBasePath(role: string): string {
  if (role === "client") return "/portal/orders";
  if (role === "staff") return "/staff/orders";
  return "/admin/orders";
}

export function formatDateTime(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
