import LoyaltyPointService from "~/services/LoyaltyPointService";

/** One band in the reward funnel — a coin range and who sits in it. */
export interface CoinBand {
  label: string;
  customers: number;
  /** What the band can redeem today, printed on the right of the row. */
  hint: string;
  barClassName: string;
  dotClassName: string;
}

/**
 * What each band unlocks. Keyed by the label the endpoint sends, which is
 * derived from the `COIN_BANDS` thresholds on the service — keep the two in
 * step if the thresholds move.
 */
const BAND_META: Record<
  string,
  { hint: string; barClassName: string; dotClassName: string }
> = {
  "400+ coins": {
    hint: "Aspirational tier eligible",
    barClassName: "tw:bg-amber-700",
    dotClassName: "tw:bg-amber-700",
  },
  "200-399 coins": {
    hint: "Silver coin · voucher unlock",
    barClassName: "tw:bg-amber-500",
    dotClassName: "tw:bg-amber-500",
  },
  "100-199 coins": {
    hint: "Butter · atta redeemable",
    barClassName: "tw:bg-amber-300",
    dotClassName: "tw:bg-amber-300",
  },
  "<100 coins": {
    hint: "Not yet redeemable",
    barClassName: "tw:bg-slate-300",
    dotClassName: "tw:bg-slate-300",
  },
};

const FALLBACK_META = {
  hint: "",
  barClassName: "tw:bg-slate-300",
  dotClassName: "tw:bg-slate-300",
};

/** The funnel — every holder bucketed by wallet size, highest band first. */
export const getData = async (): Promise<{
  holders: number;
  bands: CoinBand[];
}> => {
  const response: any = await LoyaltyPointService.getKingCoinsSummary({
    type: "coinBands",
  });

  const payload = response?.data?.data ?? {};
  const raw = Array.isArray(payload?.bands) ? payload.bands : [];

  return {
    holders: Number(payload?.holders || 0),
    bands: raw.map((item: Record<string, any>) => {
      const label = item?.label || "-";
      const meta = BAND_META[label] ?? FALLBACK_META;

      return {
        label,
        customers: Number(item?.customers || 0),
        hint: meta.hint,
        barClassName: meta.barClassName,
        dotClassName: meta.dotClassName,
      };
    }),
  };
};

/**
 * The band one rung below the top — the holders a single good bill would lift
 * into the aspirational tier. Null when the funnel has fewer than two bands or
 * nobody is sitting there.
 */
export const getNearTopBand = (bands: CoinBand[]): CoinBand | null => {
  const band = bands[1];
  return band && band.customers ? band : null;
};
