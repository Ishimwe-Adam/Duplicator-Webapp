import type { InvoiceStatus } from "@/lib/api-stub";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  void: "Void",
};

export type InvoiceTone = "grey" | "blue" | "cyan" | "amber" | "green" | "red";

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, InvoiceTone> = {
  draft: "grey",
  sent: "cyan",
  paid: "green",
  void: "red",
};

/** UI mirror — server is authoritative. */
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

export function invoicesBasePath(role: string): string {
  if (role === "client") return "/portal/invoices";
  return "/admin/invoices";
}

export function pdfUrlFor(invoiceId: number): string {
  return `/api/invoices/${invoiceId}/pdf`;
}
