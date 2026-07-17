import { IndianRupee, ReceiptText, ScanLine, Truck, type LucideIcon } from "lucide-react";
import type { QuickAction } from "../data";

/** Maps a quick-action icon key to its lucide component. */
export const actionIcon: Record<QuickAction["icon"], LucideIcon> = {
  bill: ReceiptText,
  payment: IndianRupee,
  scan: ScanLine,
  supply: Truck,
};

/** Accent colours per action, shared by the mobile pills and desktop list. */
export const actionAccent: Record<QuickAction["icon"], string> = {
  bill: "tw:text-emerald-600 tw:bg-emerald-50",
  payment: "tw:text-amber-600 tw:bg-amber-50",
  scan: "tw:text-sky-600 tw:bg-sky-50",
  supply: "tw:text-rose-600 tw:bg-rose-50",
};
