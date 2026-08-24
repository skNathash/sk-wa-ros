/** The copy + tones behind the Coin Store tier philosophy card. */

import type { CoinRewardTier } from "../helper";

/** One tier of the reward ladder, as the pane explains it. */
export interface TierPhilosophyItem {
  key: CoinRewardTier;
  label: string;
  /** Why this tier exists, in the shopkeeper's own terms. */
  hint: string;
  /** Row background + left accent bar. */
  toneClassName: string;
  /** Tier label colour. */
  labelClassName: string;
}

export const TIER_PHILOSOPHY: TierPhilosophyItem[] = [
  {
    key: "aspirational",
    label: "Aspirational",
    hint: "Bajaj fan, cooker, saree — what Blinkit can't clone",
    toneClassName: "tw:bg-amber-50 tw:border-l-amber-400",
    labelClassName: "tw:text-amber-700",
  },
  {
    key: "everyday",
    label: "Everyday",
    hint: "Amul butter, atta, oil — get her back this month",
    toneClassName: "tw:bg-emerald-50 tw:border-l-emerald-500",
    labelClassName: "tw:text-emerald-700",
  },
  {
    key: "cash-like",
    label: "Cash-like",
    hint: "Silver coin, voucher, bill discount — always redeemable",
    toneClassName: "tw:bg-violet-50 tw:border-l-violet-400",
    labelClassName: "tw:text-violet-700",
  },
];
