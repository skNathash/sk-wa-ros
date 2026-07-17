/**
 * Static demo data for the Accounts chat ledger. The screen is UI-only for now
 * — swap these for a loader once the accounts feed API lands.
 */

/** A money movement rendered as a chat bubble. `in` = income (right, green
 *  "sent" bubble), `out` = money leaving the store (left, white bubble). */
export type LedgerDirection = "in" | "out";

export type LedgerTag = "B2C" | "B2B" | "VENDOR" | "EXPENSE";

export interface LedgerEntry {
  kind: "entry";
  id: string;
  direction: LedgerDirection;
  /** Counterparty / source, e.g. "Ramesh (walk-in)". */
  title: string;
  /** Absolute rupee amount; the sign is derived from `direction`. */
  amount: number;
  tag: LedgerTag;
  /** Supporting line, e.g. "UPI · Amul, Britannia, Colgate". */
  detail: string;
  time: string;
  /** Renders the WhatsApp double-tick (receipt delivered to the customer). */
  delivered?: boolean;
}

/** A centered system line, e.g. "INVOICE INV-2101 · SENT VIA WHATSAPP". */
export interface LedgerNote {
  kind: "note";
  id: string;
  text: string;
}

/** A centered divider chip, e.g. "TODAY · 15 JUL" or "12 PM". */
export interface LedgerDivider {
  kind: "divider";
  id: string;
  label: string;
}

export type LedgerItem = LedgerEntry | LedgerNote | LedgerDivider;

export const accountsSummary = {
  dateLabel: "Today · Wed 15 Jul",
  moneyIn: 18400,
  moneyInCount: 32,
  moneyOut: 8200,
  moneyOutCount: 11,
  net: 10200,
  /** Change vs the same point yesterday; drives the ▲/▼ affordance. */
  netDeltaLabel: "₹1.4K vs yday",
  netDeltaUp: true,
};

export const accountsFeed: LedgerItem[] = [
  { kind: "divider", id: "d1", label: "Today · 15 Jul" },
  {
    kind: "entry",
    id: "t1",
    direction: "in",
    title: "Ramesh (walk-in)",
    amount: 240,
    tag: "B2C",
    detail: "UPI · Amul, Britannia, Colgate",
    time: "9:12",
    delivered: true,
  },
  {
    kind: "entry",
    id: "t2",
    direction: "in",
    title: "Sri Sai Kirana (B2B)",
    amount: 1850,
    tag: "B2B",
    detail: "Paylater cleared · INV-2091",
    time: "9:34",
    delivered: true,
  },
  { kind: "note", id: "n1", text: "Invoice INV-2101 · sent via WhatsApp" },
  {
    kind: "entry",
    id: "t3",
    direction: "out",
    title: "Sri Mahalakshmi Traders",
    amount: 4200,
    tag: "VENDOR",
    detail: "UPI · Cleared INV-4821 (PO-121)",
    time: "10:48",
  },
  {
    kind: "entry",
    id: "t4",
    direction: "in",
    title: "Cash counter",
    amount: 3420,
    tag: "B2C",
    detail: "14 walk-in bills · 9:30–11 am",
    time: "11:05",
    delivered: true,
  },
  {
    kind: "entry",
    id: "t5",
    direction: "out",
    title: "Electricity",
    amount: 1860,
    tag: "EXPENSE",
    detail: "BESCOM · scanned bill · Jul",
    time: "11:22",
  },
  { kind: "divider", id: "d2", label: "12 PM" },
];

/** Indian-format rupee amount, no decimals (₹18,400). */
export const formatRupees = (amount: number) =>
  `₹${Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
