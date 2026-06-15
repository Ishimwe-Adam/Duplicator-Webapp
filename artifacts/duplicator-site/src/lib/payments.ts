import type { PaymentMethod } from "@/lib/api-stub";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  momo: "MTN MoMo",
  airtel: "Airtel Money",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  other: "Other",
};

export const ALL_PAYMENT_METHODS: PaymentMethod[] = [
  "momo",
  "airtel",
  "bank_transfer",
  "cash",
  "other",
];
