import LoyaltyPointService from "~/services/LoyaltyPointService";

/** One bar pair on the velocity chart. */
export interface CoinTrendWeek {
  week: string;
  /** ISO week start — "W30" alone is ambiguous across a year boundary. */
  weekStart: string;
  earned: number;
  redeemed: number;
}

/**
 * Weekly earned vs redeemed, oldest week first and ending on the current week.
 * The endpoint fills quiet weeks with zeros rather than dropping them, so the
 * bars stay evenly spaced.
 */
export const getData = async (weeks = 12): Promise<CoinTrendWeek[]> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary({
    type: "trend",
    weeks,
  });

  const raw = response?.data?.data?.trend;
  if (!Array.isArray(raw)) return [];

  return raw.map((item: Record<string, any>) => ({
    week: item?.week || "-",
    weekStart: item?.weekStart || "",
    earned: Number(item?.earned || 0),
    redeemed: Number(item?.redeemed || 0),
  }));
};

/**
 * How the redeem side moved across the window — the line printed under the
 * bars. Compares the trailing half against the leading half so a single spike
 * does not read as a trend. Null when there is nothing to compare.
 */
export const getRedemptionShift = (weeks: CoinTrendWeek[]) => {
  if (weeks.length < 4) return null;

  const mid = Math.floor(weeks.length / 2);
  const sum = (rows: CoinTrendWeek[]) =>
    rows.reduce((total, row) => total + row.redeemed, 0);

  const earlier = sum(weeks.slice(0, mid));
  const later = sum(weeks.slice(mid));

  if (!earlier || !later) return null;

  return {
    weeks: weeks.length - mid,
    multiple: Math.round((later / earlier) * 10) / 10,
  };
};
