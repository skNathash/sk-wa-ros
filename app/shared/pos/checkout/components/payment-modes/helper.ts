import { Banknote, QrCode, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** The payment rails a bill can be settled with. */
export type PaymentModeKey = "cash" | "upi" | "paylater";

export interface PaymentMode {
  key: PaymentModeKey;
  label: string;
  icon: LucideIcon;
}

/**
 * The checkout payment rails, in the order they read on the strip. Cash leads
 * because it settles the majority of counter bills.
 */
export const PAYMENT_MODES: PaymentMode[] = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "upi", label: "UPI / QR", icon: QrCode },
  { key: "paylater", label: "Paylater", icon: ReceiptText },
];
