import ProfitAndLossService from "~/services/ProfitAndLossService";
import {
  monthKeyLabel,
  monthKeyShortLabel,
} from "~/shared/accounts/pnl-format";

/** One month on the trailing series. */
export type TrailingMonth = {
  key: string;
  /** X-axis label, e.g. "Jul". */
  label: string;
  revenue: number;
  net: number;
  /** The month being reported — drawn in the solid tone. */
  current?: boolean;
  /** Why the month stands out; carries the amber dot above the column. */
  notable?: string;
};

/** Footnote under the chart, spelling out an amber dot. */
export type TrailingNote = {
  key: string;
  /** Month the dot sits on, e.g. "Nov'25". */
  label: string;
  note: string;
};

export type TrailingMonthsData = {
  months: TrailingMonth[];
  notes: TrailingNote[];
};

/**
 * A `type=trend` bucket. The series is zero-filled by the endpoint, so a quiet
 * month arrives as a real bucket rather than a gap — the chart keeps its shape.
 * Nothing in the data names a season, so `notable` is earned: the best and
 * weakest net-profit months, and the two sharpest revenue swings.
 */
type ApiTrendBucket = {
  key?: string;
  month?: string;
  label?: string;
  revenue?: number;
  netProfit?: number;
  notable?: boolean;
  note?: string;
  isCurrent?: boolean;
};

export const emptyTrailingMonths = (): TrailingMonthsData => ({
  months: [],
  notes: [],
});

export const getTrailingMonths = async (): Promise<TrailingMonthsData> => {
  const section =
    await ProfitAndLossService.getThisMonthSection<ApiTrendBucket>("trend", {
      limit: 12,
    });

  const months: TrailingMonth[] = section.data.map((bucket) => {
    const key = bucket.key ?? bucket.month ?? "";

    return {
      key,
      label: bucket.label ?? monthKeyLabel(key),
      revenue: bucket.revenue ?? 0,
      net: bucket.netProfit ?? 0,
      current: bucket.isCurrent === true,
      /* The dot is only worth drawing when the bucket also says why it is
         there — an unexplained marker reads as a rendering fault. */
      notable: bucket.notable && bucket.note ? bucket.note : undefined,
    };
  });

  return {
    months,
    notes: months
      .filter((month) => Boolean(month.notable))
      .map((month) => ({
        key: month.key,
        label: monthKeyShortLabel(month.key),
        note: month.notable as string,
      })),
  };
};
