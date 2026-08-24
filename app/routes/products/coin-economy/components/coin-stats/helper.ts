import LoyaltyPointService from "~/services/LoyaltyPointService";
import { getKingCoinsSummary } from "../../helper";

/** How many weeks the earn:redeem ratio is measured over. */
export const VELOCITY_WEEKS = 4;

/** The four headline numbers under the circulation banner. */
export interface CoinStatsData {
  /** Length of the movement window the endpoint reported on, in days. */
  days: number;
  earned: number;
  earnCount: number;
  /** Coins per bill over the window — 0 when nothing was earned. */
  earnedPerBill: number;
  redeemed: number;
  redeemCount: number;
  /** Coins per redemption over the window. */
  redeemedPerCustomer: number;
  lockedUpPercent: number;
  /** Coins sitting in wallets that have never been spent. */
  neverRedeemed: number;
  /**
   * Earned against redeemed over {@link VELOCITY_WEEKS}. Null when nothing was
   * redeemed in the window — a ratio against zero says nothing.
   */
  velocityRatio: number | null;
}

export const EMPTY_STATS: CoinStatsData = {
  days: 7,
  earned: 0,
  earnCount: 0,
  earnedPerBill: 0,
  redeemed: 0,
  redeemCount: 0,
  redeemedPerCustomer: 0,
  lockedUpPercent: 0,
  neverRedeemed: 0,
  velocityRatio: null,
};

/** Earned ÷ redeemed across the trend window, to one decimal. */
const getVelocityRatio = async (): Promise<number | null> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary({
    type: "trend",
    weeks: VELOCITY_WEEKS,
  });

  const weeks = response?.data?.data?.trend;
  if (!Array.isArray(weeks) || !weeks.length) return null;

  const earned = weeks.reduce(
    (sum: number, w: any) => sum + Number(w?.earned || 0),
    0,
  );
  const redeemed = weeks.reduce(
    (sum: number, w: any) => sum + Number(w?.redeemed || 0),
    0,
  );

  if (!redeemed) return null;
  return Math.round((earned / redeemed) * 10) / 10;
};

/**
 * The tiles read the circulation snapshot for the movement window and the
 * locked-up share, then the trend endpoint for the earn:redeem ratio — the one
 * figure the snapshot does not carry.
 */
export const getData = async (): Promise<CoinStatsData> => {
  const [summary, velocityRatio] = await Promise.all([
    getKingCoinsSummary(),
    getVelocityRatio().catch(() => null),
  ]);

  const { movement } = summary;

  return {
    days: movement.days,
    earned: movement.earned,
    earnCount: movement.earnCount,
    earnedPerBill: movement.earnCount
      ? Math.round(movement.earned / movement.earnCount)
      : 0,
    redeemed: movement.redeemed,
    redeemCount: movement.redeemCount,
    redeemedPerCustomer: movement.redeemCount
      ? Math.round(movement.redeemed / movement.redeemCount)
      : 0,
    lockedUpPercent: summary.lockedUpPercent,
    neverRedeemed: summary.circulation,
    velocityRatio,
  };
};
