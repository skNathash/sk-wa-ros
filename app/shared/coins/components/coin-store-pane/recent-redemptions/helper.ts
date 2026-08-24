/** Data access + formatting for the pane's recent-redemptions list. */

import { format, isToday, isYesterday, parseISO } from "date-fns";
import LoyaltyPointService from "~/services/LoyaltyPointService";

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
export const AVATAR_TONES = [
  "tw:bg-amber-500",
  "tw:bg-violet-500",
  "tw:bg-emerald-600",
  "tw:bg-sky-600",
];

/** One redemption row. */
export interface CoinRedemption {
  id: string;
  /** Who redeemed. */
  name: string;
  /** What they spent the coins on — the order the redemption paid down. */
  reward: string;
  /** Coins it cost, 0 when the statement carries no amount. */
  coins: number;
  /** "Today" / "Yesterday" / "22 Jul". */
  dateLabel: string;
}

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export { initialsOf };

/** "Today" / "Yesterday" / "22 Jul" for a statement timestamp. */
const dateLabelOf = (value?: string) => {
  if (!value) return "";
  try {
    const date = typeof value === "string" ? parseISO(value) : new Date(value);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "d MMM");
  } catch (e) {
    return "";
  }
};

/**
 * The latest coins spent at the Coin Store — the redeem side of the loyalty
 * statement, newest first.
 */
export const getData = async (limit = 4): Promise<CoinRedemption[]> => {
  const response: any = await LoyaltyPointService.getStatement({
    page: 1,
    limit,
    filter: { type: "redeem" },
    sort: { createdAt: -1 },
  });

  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];

  return rows.map((item: Record<string, any>, index: number) => ({
    id: item?._id || `redemption-${index}`,
    name: item?.actor?.name || item?.customerName || "-",
    reward: rewardOf(item),
    coins: Math.abs(Number(item?.amount ?? item?.delta ?? 0)),
    dateLabel: dateLabelOf(item?.ts || item?.createdAt),
  }));
};

/**
 * What the redemption bought. The statement has no reward name — a redeem row
 * points at the order it paid down — so the order reference is what the row can
 * honestly show, falling back to the free-text reason.
 */
const rewardOf = (item: Record<string, any>) => {
  const ref = item?.transactionRefId || item?.meta?.transactionRefId;
  if (ref) return `Order ${ref}`;
  return item?.reason || "Coin Store redemption";
};

/** "Amul butter · 50 coins", dropping the coins half when there is no amount. */
export const redemptionSubtitle = (redemption: CoinRedemption) =>
  redemption.coins
    ? `${redemption.reward} · ${redemption.coins.toLocaleString("en-IN")} coins`
    : redemption.reward;
