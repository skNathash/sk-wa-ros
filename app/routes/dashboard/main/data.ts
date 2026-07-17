/**
 * Static mock data for the dashboard "main" home page.
 * Everything here is placeholder content — wire up to real services later.
 */

export type QuickAction = {
  key: string;
  label: string;
  shortcut?: string;
  to: string;
  icon: "bill" | "payment" | "scan" | "supply";
};

export const quickActions: QuickAction[] = [
  { key: "newBill", label: "New bill", shortcut: "⌘ + N", to: "/pos/billing", icon: "bill" },
  {
    key: "recordPayment",
    label: "Record payment",
    shortcut: "⌘ + P",
    to: "/dashboard/accounts/record-payment",
    icon: "payment",
  },
  { key: "scanItem", label: "Scan Item", shortcut: "Space", to: "/pos/billing", icon: "scan" },
  {
    key: "orderSupply",
    label: "Order supply",
    shortcut: "⌘ + O",
    to: "/dashboard/purchase-order/main",
    icon: "supply",
  },
];

export const todaySummary = {
  amount: 4820,
  changePct: 18,
  date: "15 Jul",
  billCount: 27,
  avgBill: 178,
  onKhata: 340,
  yesterday: 4085,
  aheadBy: 735,
  peakHour: "11 AM",
  peakBills: 12,
  topSellerCount: 12,
  topSellerName: "Maggi Noodles",
};

export const journey = {
  title: "Your Bright Store Journey",
  step: 2,
  totalSteps: 7,
  headline: "You're 4 steps from your first online order",
  nextLabel: "Your shop online looks as full as your shop offline",
  meta: "~10 mins · Pick 20 fast-moving items to start",
  reward: 500,
};

export type StatTile = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: "receipt" | "wallet" | "clock" | "star";
  tone: string;
};

export const statTiles: StatTile[] = [
  { key: "bills", label: "Bills", value: "27", hint: "Avg ₹178", icon: "receipt", tone: "tw:text-sky-600 tw:bg-sky-50" },
  {
    key: "khata",
    label: "On khata",
    value: "₹340",
    hint: "Added today",
    icon: "wallet",
    tone: "tw:text-amber-600 tw:bg-amber-50",
  },
  {
    key: "peak",
    label: "Peak hour",
    value: "11 AM",
    hint: "12 bills",
    icon: "clock",
    tone: "tw:text-violet-600 tw:bg-violet-50",
  },
  {
    key: "topSeller",
    label: "Top seller",
    value: "12",
    hint: "Maggi Noodles",
    icon: "star",
    tone: "tw:text-emerald-600 tw:bg-emerald-50",
  },
];

export type SalesTrendPoint = { label: string; value: number; today?: boolean };

export const salesTrend: SalesTrendPoint[] = [
  { label: "Mon", value: 3000 },
  { label: "Tue", value: 4000 },
  { label: "Wed", value: 4000 },
  { label: "Thu", value: 4500 },
  { label: "Fri", value: 5000 },
  { label: "Sat", value: 5000 },
  { label: "Today", value: 4820, today: true },
];

export type TopSeller = {
  rank: number;
  name: string;
  letter: string;
  units: number;
  amount: number;
  gradient: string;
};

export const topSellers: TopSeller[] = [
  { rank: 1, name: "Maggi 2-Minute Noodles", letter: "M", units: 12, amount: 660, gradient: "tw:from-amber-400 tw:to-amber-600" },
  { rank: 2, name: "Nestlé KitKat 2-Finger", letter: "N", units: 24, amount: 240, gradient: "tw:from-rose-400 tw:to-rose-600" },
  { rank: 3, name: "Lays Classic Salted", letter: "L", units: 8, amount: 160, gradient: "tw:from-yellow-400 tw:to-amber-500" },
  { rank: 4, name: "Fanta Soft Drink", letter: "F", units: 6, amount: 120, gradient: "tw:from-orange-400 tw:to-orange-600" },
];

export type PurchaseOrder = {
  code: string;
  status: "OPEN" | "DRAFT" | "RECEIVED";
  seller: string;
  short: string;
  shortTone: string;
  items: number;
  amount: number;
};

export const recentPurchaseOrders: PurchaseOrder[] = [
  { code: "#PO-2401", status: "OPEN", seller: "HUL Distributor", short: "HUL", shortTone: "tw:bg-blue-600", items: 8, amount: 12400 },
  { code: "#PO-2402", status: "OPEN", seller: "Nestlé Route Sales", short: "NES", shortTone: "tw:bg-rose-600", items: 4, amount: 8720 },
  { code: "#PO-2403", status: "DRAFT", seller: "ITC Direct", short: "ITC", shortTone: "tw:bg-emerald-600", items: 3, amount: 4880 },
  { code: "#PO-2400", status: "RECEIVED", seller: "HUL Distributor", short: "HUL", shortTone: "tw:bg-blue-600", items: 5, amount: 9840 },
];

export type AttentionItem = {
  key: string;
  title: string;
  count: number;
  detail: string;
  icon: "alert" | "check" | "clock" | "return" | "box" | "hourglass";
  tone: string;
};

export const attentionItems: AttentionItem[] = [
  { key: "lowStock", title: "Low stock", count: 3, detail: "Milkmaid, Fair & Lovely, Surf Excel", icon: "alert", tone: "tw:text-rose-600 tw:bg-rose-50" },
  { key: "toApprove", title: "To approve", count: 2, detail: "From Un-Branded catalog", icon: "check", tone: "tw:text-emerald-600 tw:bg-emerald-50" },
  { key: "khataOverdue", title: "Khata overdue", count: 1, detail: "Suresh Patil · ₹3,820 · 2 weeks", icon: "clock", tone: "tw:text-amber-600 tw:bg-amber-50" },
  { key: "returnPending", title: "Return pending", count: 1, detail: "#RTN-042 · Damaged · ₹340", icon: "return", tone: "tw:text-sky-600 tw:bg-sky-50" },
  { key: "grnReview", title: "GRN to review", count: 1, detail: "#PO-2401 · 4 items receiving", icon: "box", tone: "tw:text-indigo-600 tw:bg-indigo-50" },
  { key: "expiring", title: "Expiring soon", count: 4, detail: "4 batches expire in next 30 days", icon: "hourglass", tone: "tw:text-orange-600 tw:bg-orange-50" },
];

export type ActivityItem = {
  key: string;
  kind: "bill" | "khata" | "paid" | "lowStock" | "approve";
  title: string;
  amount?: number;
  meta: string;
  time: string;
  avatar?: string;
};

export const activityItems: ActivityItem[] = [
  { key: "a1", kind: "bill", title: "Bill #248", amount: 340, meta: "4 items · UPI", time: "11:42 AM" },
  { key: "a2", kind: "khata", title: "Ramesh Kumar", amount: 120, meta: "Added to khata", time: "11:18 AM", avatar: "K" },
  { key: "a3", kind: "paid", title: "Suresh Patil", amount: 500, meta: "Paid on khata · Cash", time: "10:55 AM" },
  { key: "a4", kind: "bill", title: "Bill #247", amount: 88, meta: "2 items · Cash", time: "10:31 AM" },
  { key: "a5", kind: "lowStock", title: "Milkmaid 380g", meta: "Low stock · 3 left", time: "10:12 AM" },
  { key: "a6", kind: "bill", title: "Bill #246", amount: 210, meta: "3 items · UPI", time: "9:48 AM" },
  { key: "a7", kind: "approve", title: "2 items to approve", meta: "From Un-Branded catalog", time: "9:22 AM" },
  { key: "a8", kind: "bill", title: "Bill #245", amount: 55, meta: "1 item · Cash", time: "9:05 AM" },
];
