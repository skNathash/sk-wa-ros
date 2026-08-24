/**
 * Shared model for the King Coins economy dashboard — the circulation summary
 * every card reads, plus the milestone ladder the holder rows measure against.
 *
 * Each card folder keeps its own `helper.ts` with the `getData` it needs; this
 * file holds only what more than one of them shares.
 */

import LoyaltyPointService from "~/services/LoyaltyPointService";

/** The single top holder the summary enriches from customer-service. */
export interface KingCoinsTopHolder {
  holderId: string;
  holderType: string;
  name: string;
  mobile: string;
  referenceCode: string;
  coins: number;
}

/** `GET loyaltypoints/king-coins/summary` with no `type` — the whole snapshot. */
export interface KingCoinsSummary {
  circulation: number;
  holders: number;
  avgPerHolder: number;
  lockedUpPercent: number;
  holdersWithCoins: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  /** Movement over the trailing window the endpoint reports on. */
  movement: {
    days: number;
    earned: number;
    earnCount: number;
    redeemed: number;
    redeemCount: number;
  };
  topHolder: KingCoinsTopHolder | null;
}

export const EMPTY_SUMMARY: KingCoinsSummary = {
  circulation: 0,
  holders: 0,
  avgPerHolder: 0,
  lockedUpPercent: 0,
  holdersWithCoins: 0,
  lifetimeEarned: 0,
  lifetimeRedeemed: 0,
  movement: { days: 7, earned: 0, earnCount: 0, redeemed: 0, redeemCount: 0 },
  topHolder: null,
};

/** Summary payload -> the flat shape the cards render. */
export const getKingCoinsSummary = async (): Promise<KingCoinsSummary> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary();
  const payload = response?.data?.data ?? {};
  const movement = payload?.movement ?? {};
  const holder = payload?.topHolder;

  return {
    circulation: Number(payload?.circulation || 0),
    holders: Number(payload?.holders || 0),
    avgPerHolder: Number(payload?.avgPerHolder || 0),
    lockedUpPercent: Number(payload?.lockedUpPercent || 0),
    holdersWithCoins: Number(payload?.breakdown?.holdersWithCoins || 0),
    lifetimeEarned: Number(payload?.lifetime?.earned || 0),
    lifetimeRedeemed: Number(payload?.lifetime?.redeemed || 0),
    movement: {
      days: Number(movement?.days || 7),
      earned: Number(movement?.earned || 0),
      earnCount: Number(movement?.earnCount || 0),
      redeemed: Number(movement?.redeemed || 0),
      redeemCount: Number(movement?.redeemCount || 0),
    },
    topHolder: holder
      ? {
          holderId: holder?.holderId || "",
          holderType: holder?.holderType || "Customer",
          name: holder?.name || "-",
          mobile: holder?.mobile || "",
          referenceCode: holder?.referenceCode || "",
          coins: Number(holder?.coins || 0),
        }
      : null,
  };
};

/** A rung on the redemption ladder — what the next coins buy. */
export interface CoinMilestone {
  coins: number;
  label: string;
}

/**
 * The redemption ladder. No reward-tier endpoint exists yet — these mirror the
 * `COIN_BANDS` thresholds the summary buckets holders into, so the funnel and
 * the holder rows tell the same story. One place to change them.
 */
export const COIN_MILESTONES: CoinMilestone[] = [
  { coins: 50, label: "Butter unlock" },
  { coins: 100, label: "Atta unlock" },
  { coins: 200, label: "Silver coin" },
  { coins: 400, label: "Prestige cooker" },
];

/** The next rung a holder has not cleared, or null once they top the ladder. */
export const nextMilestone = (coins: number): CoinMilestone | null =>
  COIN_MILESTONES.find((milestone) => milestone.coins > coins) ?? null;

/** How far along a holder is towards their next rung, as a 0-100 percentage. */
export const milestoneProgress = (coins: number): number => {
  const next = nextMilestone(coins);
  if (!next) return 100;
  return Math.min(100, Math.round((coins / next.coins) * 100));
};

/** Coins are counts, not money — grouped digits, never a rupee sign. */
export const formatCoins = (value: number): string =>
  Number(value || 0).toLocaleString("en-IN");

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
export const AVATAR_TONES = [
  "tw:bg-violet-600",
  "tw:bg-emerald-600",
  "tw:bg-amber-600",
  "tw:bg-sky-600",
  "tw:bg-rose-600",
];

export const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/**
 * The WhatsApp nudge for one holder — where they stand and what the next few
 * coins unlock. Used by the holder rows, which carry no mobile number, so the
 * message goes out through the share sheet rather than to a number.
 */
export const buildHolderNudgeMessage = (name: string, coins: number) => {
  const next = nextMilestone(coins);
  const standing = `Hi ${name}, you have ${formatCoins(coins)} King Coins.`;
  if (!next) {
    return `${standing} Redeem them at the Coin Store on your next visit.`;
  }
  return `${standing} Just ${formatCoins(next.coins - coins)} more to unlock ${next.label} (${next.coins} coins) at the Coin Store.`;
};
