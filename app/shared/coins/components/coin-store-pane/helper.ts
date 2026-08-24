/** Data access + formatting for the King Coins side pane sections. */

import LoyaltyPointService from "~/services/LoyaltyPointService";
import SellerCatalogService from "~/services/SellerCatalogService";

/** The slices of the holder book the chip strip can select. */
export type CoinChipKey = "all" | "top" | "silver" | "starter" | "dormant";

/** The reward tiers the Coin Store chip strip can select. */
export type CoinRewardChipKey =
  | "all"
  | "aspirational"
  | "everyday"
  | "cash-like";

/**
 * Which chip set a strip renders — the holder bands of the economy pane, or
 * the reward tiers of the Coin Store pane.
 */
export type CoinChipType = "bands" | "rewards";

/** Either chip vocabulary — what a strip hands back on select. */
export type CoinPaneChipKey = CoinChipKey | CoinRewardChipKey;

/** Coin range behind each chip, in coins held. */
const CHIP_RANGES: Record<CoinChipKey, { min?: number; max?: number }> = {
  all: {},
  top: { min: 400 },
  silver: { min: 200, max: 399 },
  starter: { min: 100, max: 199 },
  dormant: { max: 99 },
};

/** The coin range a chip stands for — `{}` for the unfiltered chip. */
export const coinChipRange = (key: CoinChipKey = "all") =>
  CHIP_RANGES[key] ?? {};

/** The pane header + chip counts, read off the circulation snapshot. */
export interface CoinPaneOverview {
  circulation: number;
  holders: number;
  lockedUpPercent: number;
  /** Coins in wallets that have never been spent. */
  neverRedeemed: number;
  redeemedInWindow: number;
  windowDays: number;
  topHolderName: string;
  topHolderCoins: number;
}

export const EMPTY_OVERVIEW: CoinPaneOverview = {
  circulation: 0,
  holders: 0,
  lockedUpPercent: 0,
  neverRedeemed: 0,
  redeemedInWindow: 0,
  windowDays: 7,
  topHolderName: "",
  topHolderCoins: 0,
};

/** Circulation snapshot, flattened to what the pane shows. */
export const getOverview = async (): Promise<CoinPaneOverview> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary();
  const payload = response?.data?.data ?? {};

  return {
    circulation: Number(payload?.circulation || 0),
    holders: Number(payload?.holders || 0),
    lockedUpPercent: Number(payload?.lockedUpPercent || 0),
    neverRedeemed: Number(payload?.circulation || 0),
    redeemedInWindow: Number(payload?.movement?.redeemed || 0),
    windowDays: Number(payload?.movement?.days || 7),
    topHolderName: payload?.topHolder?.name || "",
    topHolderCoins: Number(payload?.topHolder?.coins || 0),
  };
};

/** One row in the pane's alert stack. */
export interface CoinAlert {
  key: string;
  title: string;
  hint: string;
  /** Tone classes for the row background and the icon chip. */
  toneClassName: string;
  iconClassName: string;
  /** Which lucide icon the row shows — resolved by the component. */
  icon: "locked" | "silent" | "milestone";
}

/**
 * What the snapshot is worth flagging. Everything here is derived from the
 * circulation summary — there is no alerts endpoint, so a signal the summary
 * cannot see (a per-holder silent streak, say) is not invented here.
 */
export const buildCoinAlerts = (overview: CoinPaneOverview): CoinAlert[] => {
  const alerts: CoinAlert[] = [];

  if (overview.neverRedeemed) {
    alerts.push({
      key: "locked-up",
      title: `${overview.neverRedeemed.toLocaleString("en-IN")} coins sitting unused`,
      hint: `${overview.lockedUpPercent}% locked-up · aspirational push?`,
      toneClassName: "tw:bg-amber-50",
      iconClassName: "tw:bg-amber-100 tw:text-amber-600",
      icon: "locked",
    });
  }

  if (!overview.redeemedInWindow && overview.circulation) {
    alerts.push({
      key: "no-redemptions",
      title: `No coins redeemed in ${overview.windowDays}d`,
      hint: "The Coin Store needs a broadcast",
      toneClassName: "tw:bg-rose-50",
      iconClassName: "tw:bg-rose-100 tw:text-rose-500",
      icon: "silent",
    });
  }

  if (overview.topHolderName) {
    alerts.push({
      key: "top-holder",
      title: `${overview.topHolderName} · ${overview.topHolderCoins.toLocaleString("en-IN")} coins`,
      hint: "Your biggest holder — worth a personal nudge",
      toneClassName: "tw:bg-violet-50",
      iconClassName: "tw:bg-violet-100 tw:text-violet-600",
      icon: "milestone",
    });
  }

  return alerts;
};

/** How many holders sit in each band — the chip badges. */
export const getBandCounts = async (): Promise<
  Partial<Record<CoinChipKey, number>>
> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary({
    type: "coinBands",
  });

  const payload = response?.data?.data ?? {};
  const bands = Array.isArray(payload?.bands) ? payload.bands : [];

  /** Band labels come back keyed by their range — map them to chip keys. */
  const byLabel: Record<string, CoinChipKey> = {
    "400+ coins": "top",
    "200-399 coins": "silver",
    "100-199 coins": "starter",
    "<100 coins": "dormant",
  };

  const counts: Partial<Record<CoinChipKey, number>> = {
    all: Number(payload?.holders || 0),
  };

  bands.forEach((band: Record<string, any>) => {
    const key = byLabel[band?.label];
    if (key) counts[key] = Number(band?.customers || 0);
  });

  return counts;
};

/** The tier a reward belongs to — "all" is the chip, never a reward's tier. */
export type CoinRewardTier = Exclude<CoinRewardChipKey, "all">;

/** One redeemable reward, flattened to what the pane shows. */
export interface CoinStoreReward {
  id: string;
  name: string;
  coins: number;
  tier: CoinRewardTier;
}

/** Names that make a reward cash-like however few coins it costs. */
const CASH_LIKE_PATTERN =
  /(voucher|gift\s*card|discount|cashback|cash\s*back|silver\s*coin|coupon)/i;

/** At or above this many coins a reward is a save-up-for-it buy. */
const ASPIRATIONAL_COINS = 300;

/**
 * Which tier a reward sits in.
 *
 * The catalogue carries a tier of its own on some deals (`kcStoreInfo.tier`);
 * where it doesn't, the tier is read off the reward itself — anything that
 * spends like money is cash-like, anything expensive enough to save up for is
 * aspirational, and the rest is the weekly basket.
 */
export const rewardTierOf = (deal: Record<string, any>): CoinRewardTier => {
  const declared = String(
    deal?.kcStoreInfo?.tier || deal?.tier || "",
  ).toLowerCase();
  if (declared === "aspirational") return "aspirational";
  if (declared === "everyday") return "everyday";
  if (declared === "cash-like" || declared === "cashlike") return "cash-like";

  const name = deal?.name || deal?.dealName || "";
  if (CASH_LIKE_PATTERN.test(name)) return "cash-like";

  const coins = Number(deal?.kcStoreInfo?.requiredKingCoins || 0);
  return coins >= ASPIRATIONAL_COINS ? "aspirational" : "everyday";
};

/**
 * The Coin Store catalogue, flattened and tiered. The pane shows counts and a
 * search box over the whole catalogue, so it reads one page big enough to hold
 * it rather than paging.
 */
export const getData = async (limit = 100): Promise<CoinStoreReward[]> => {
  const response: any = await SellerCatalogService.getKcStoreDeals({
    page: 1,
    limit,
  });

  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];

  return rows.map((deal: Record<string, any>, index: number) => ({
    id: deal?.dealId || deal?._id || `reward-${index}`,
    name: deal?.name || deal?.dealName || "Reward",
    coins: Number(deal?.kcStoreInfo?.requiredKingCoins || 0),
    tier: rewardTierOf(deal),
  }));
};

/** How many rewards sit behind each chip — including "all". */
export const getTierCounts = (
  rewards: CoinStoreReward[],
): Partial<Record<CoinRewardChipKey, number>> => {
  const counts: Partial<Record<CoinRewardChipKey, number>> = {
    all: rewards.length,
  };

  rewards.forEach((reward) => {
    counts[reward.tier] = (counts[reward.tier] || 0) + 1;
  });

  return counts;
};

/** The rewards left after the active chip and the search term. */
export const filterRewards = (
  rewards: CoinStoreReward[],
  tier: CoinRewardChipKey = "all",
  term = "",
): CoinStoreReward[] => {
  const search = term.trim().toLowerCase();

  return rewards.filter((reward) => {
    if (tier !== "all" && reward.tier !== tier) return false;
    if (search && !reward.name.toLowerCase().includes(search)) return false;
    return true;
  });
};
