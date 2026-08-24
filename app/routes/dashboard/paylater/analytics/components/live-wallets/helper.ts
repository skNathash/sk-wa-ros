import { differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount as getWalletCount,
  getData as getWalletData,
  prepareParams as prepareWalletParams,
} from "../../../wallets/helper";

/** Wallet-type segments. `type` maps to the wallets list route param. */
export const SEGMENTS = [
  { key: "all", label: "All", type: undefined },
  { key: "b2b", label: "B2B", type: "b2b" },
  { key: "b2c", label: "B2C", type: "b2c" },
] as const;

export type SegmentKey = (typeof SEGMENTS)[number]["key"];

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
const AVATAR_TONES = [
  "tw:bg-rose-800",
  "tw:bg-fuchsia-600",
  "tw:bg-amber-600",
  "tw:bg-sky-600",
  "tw:bg-primary",
  "tw:bg-violet-600",
];

export const avatarToneAt = (index: number) =>
  AVATAR_TONES[index % AVATAR_TONES.length];

/** Two-letter initials for the avatar bubble. */
export const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const parseDate = (value?: string) => {
  if (!value) return null;
  const parsed = typeof value === "string" ? parseISO(value) : value;
  return isValid(parsed) ? parsed : null;
};

/** Loyalty-tier chip tints, keyed by the tier the wallet carries. */
const TIER_TONES: Record<string, string> = {
  diamond: "tw:bg-violet-100 tw:text-violet-700",
  gold: "tw:bg-amber-100 tw:text-amber-700",
  silver: "tw:bg-slate-100 tw:text-slate-500",
  starter: "tw:bg-stone-100 tw:text-stone-500",
};

export const tierToneOf = (tier?: string) =>
  TIER_TONES[(tier || "").toLowerCase()] || "tw:bg-slate-100 tw:text-slate-500";

/** One live-wallet row, read off the paylater request the wallets pages use. */
export interface LiveWalletRow {
  id: string;
  name: string;
  /** Where the row links to — the request when pending, else the customer. */
  href: string;
  /** "B2B" / "B2C". */
  userCategory: string;
  statusLabel: string;
  /** Drawn against the limit. */
  used: number;
  limit: number;
  /** Share of the limit used, 0–100. */
  usage: number;
  isOverdue: boolean;
  isDueToday: boolean;
  /** Days past the due date — 0 when still on time. */
  overdueDays: number;
  dueDate: Date | null;
  /** Loyalty tier, when the feed carries one. */
  tier: string;
  /** Bills billed to the wallet — null when the feed omits the count. */
  bills: number | null;
  /** Last billing date — null when never billed or the feed omits it. */
  lastBillDate: Date | null;
  /** Nothing drawn and headroom left to spend. */
  isAvailable: boolean;
  raw: Record<string, any>;
}

/** Paylater request row -> the row shape both views render. */
export const toRow = (raw: Record<string, any>, index: number): LiveWalletRow => {
  const limit = Number(raw.creditLimit) || 0;
  const used = Number(raw.totalPayableAmount) || 0;
  const dueDate = parseDate(raw.validityEndDate);
  const bills = raw.totalBills ?? raw.billsCount ?? raw.billCount;

  return {
    id: raw._id || `row-${index}`,
    name: raw.userInfo?.name || "-",
    href:
      raw.status === "Pending"
        ? `/dashboard/paylater/view/${raw._id}`
        : raw.userRedirectionLink || raw.viewBtnLink || "#",
    userCategory: raw.userCategory || "",
    statusLabel: raw._statusLbl || "",
    used,
    limit,
    usage: limit ? Math.min(Math.round((used / limit) * 100), 100) : 0,
    isOverdue: !!raw.isOverdue,
    isDueToday: !!raw.isDueToday,
    overdueDays:
      raw.isOverdue && dueDate
        ? Math.max(0, differenceInCalendarDays(new Date(), dueDate))
        : 0,
    dueDate,
    tier: raw.tier || raw.loyaltyTier || raw.userInfo?.tier || "",
    bills: bills === undefined || bills === null ? null : Number(bills) || 0,
    lastBillDate: parseDate(raw.lastBillDate || raw.lastTransactionDate),
    isAvailable:
      !raw.isOverdue && used <= 0 && Number(raw.creditAvailable || 0) > 0,
    raw,
  };
};

/** One page of live wallets for a segment, plus the total behind it. */
export const getWallets = async (
  segment: SegmentKey,
  pagination: PaginationState,
) => {
  const type = SEGMENTS.find((item) => item.key === segment)?.type;
  const params = prepareWalletParams(
    { status: "All" },
    pagination,
    { key: "", value: "asc" },
    type,
  );

  const [result, count] = await Promise.all([
    getWalletData(params),
    getWalletCount(params),
  ]);

  return {
    rows: (result || []).map(toRow),
    total: count || 0,
  };
};
