import type { RecordPaymentEntityType } from "./types";

/** Highest amount the payment API accepts — mirrors the legacy form validation. */
export const MAX_PAYMENT_AMOUNT = 1000000000;

/** Values accepted by `franchise/account/payment/update` — see AccountService.getRecordPaymentOptions. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
};

export const AVATAR_COLORS = [
  "tw:bg-amber-500",
  "tw:bg-purple-500",
  "tw:bg-sky-500",
  "tw:bg-blue-500",
  "tw:bg-rose-500",
];

export const getInitials = (name: string = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export const getEntityTypeLabel = (entityType: RecordPaymentEntityType) => {
  switch (entityType) {
    case "franchise":
      return "Retailer";
    case "customer":
      return "Customer";
    case "vendor":
      return "Vendor";
    default:
      return "User";
  }
};
