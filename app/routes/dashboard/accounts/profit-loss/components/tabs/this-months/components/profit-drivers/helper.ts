import ProfitAndLossService from "~/services/ProfitAndLossService";

export type ProfitDriver = {
  key: string;
  label: string;
  revenue: number;
  grossProfit: number;
  /** Gross margin for the category, as a percentage. */
  margin: number;
  /** Last few months of revenue, drawn as the row's sparkline. */
  trend: number[];
  /** Trend is heading down — the sparkline switches to the cool tone. */
  declining?: boolean;
};

export type ProfitDriversData = {
  note: string;
  items: ProfitDriver[];
};

/**
 * A `type=drivers` row — revenue and stock-ledger cost joined on the deal's
 * parent category. A category that moved stock but sold nothing still appears,
 * with zero revenue and a negative gross profit; that is a real signal, usually
 * write-offs or a returns pile-up, so it is not filtered out here.
 */
type ApiDriver = {
  category?: string;
  categoryId?: string;
  revenue?: number;
  cogs?: number;
  grossProfit?: number;
  marginPercent?: number;
  units?: number;
  orders?: number;
  sharePercent?: number;
  /** Six monthly revenue figures, oldest first, zero-filled. */
  trend?: number[];
  trendBuckets?: string[];
};

export const emptyProfitDrivers = (): ProfitDriversData => ({
  note: "",
  items: [],
});

/** The sparkline is cool-toned when the series ends below where it started. */
const isDeclining = (trend: number[]): boolean =>
  trend.length >= 2 && trend[trend.length - 1] < trend[0];

export const getProfitDrivers = async (): Promise<ProfitDriversData> => {
  const section = await ProfitAndLossService.getThisMonthSection<ApiDriver>(
    "drivers",
    {
      topLimit: 5,
    },
  );

  const rankedBy = (section.rankedBy as string) ?? "";

  return {
    note: rankedBy === "grossProfit" ? "by gross profit" : rankedBy,
    items: section.data.map((driver, index) => {
      const trend = Array.isArray(driver.trend) ? driver.trend : [];

      return {
        key: driver.categoryId ?? driver.category ?? `driver-${index}`,
        label: driver.category ?? "",
        revenue: driver.revenue ?? 0,
        grossProfit: driver.grossProfit ?? 0,
        margin: driver.marginPercent ?? 0,
        trend,
        declining: isDeclining(trend),
      };
    }),
  };
};
