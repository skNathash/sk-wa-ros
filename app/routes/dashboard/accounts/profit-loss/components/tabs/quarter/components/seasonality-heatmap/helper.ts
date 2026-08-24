import ProfitAndLossService from "~/services/ProfitAndLossService";

/** One month cell; `margin` is null for a month the year hasn't reached. */
export type SeasonalityCell = {
  month: string;
  margin: number | null;
};

export type SeasonalityRow = {
  key: string;
  /** Financial year the row covers, e.g. "FY27". */
  label: string;
  cells: SeasonalityCell[];
};

export type SeasonalityData = {
  note: string;
  /** Column headers, in financial-year order (Apr first). */
  months: string[];
  rows: SeasonalityRow[];
  /** The takeaway printed under the grid, after a bold "Read:" lead. */
  read: string;
};

export const emptySeasonality = (): SeasonalityData => ({
  note: "",
  months: [],
  rows: [],
  read: "",
});

const FY_COUNT = 2;

const MONTH_SHORT: Record<string, string> = {
  JANUARY: "Jan",
  FEBRUARY: "Feb",
  MARCH: "Mar",
  APRIL: "Apr",
  MAY: "May",
  JUNE: "Jun",
  JULY: "Jul",
  AUGUST: "Aug",
  SEPTEMBER: "Sep",
  OCTOBER: "Oct",
  NOVEMBER: "Nov",
  DECEMBER: "Dec",
};

type SeasonalityApiRow = {
  fy: string;
  months: Array<{
    monthIndex: number;
    month: string;
    marginPercent: number | null;
  }>;
};

type SeasonalityApiPayload = {
  columns?: string[];
  monthsCovered?: number;
  bestMonth?: {
    month: string;
    marginPercent: number;
  };
  worstMonth?: {
    month: string;
    marginPercent: number;
  };
};

export const getSeasonality = async (): Promise<SeasonalityData> => {
  const section =
    await ProfitAndLossService.getQuarterSection<SeasonalityApiRow>(
      "seasonality",
      { fyCount: FY_COUNT },
    );

  const payload = (section as unknown as SeasonalityApiPayload) ?? {};
  const columns = payload.columns ?? [];
  const monthsCovered = payload.monthsCovered ?? FY_COUNT * 12;

  const months = columns.map((column) => MONTH_SHORT[column] ?? column);

  const rows: SeasonalityRow[] = section.data.map((year) => ({
    key: year.fy,
    label: year.fy,
    cells: columns.map((column, index) => {
      const month = year.months.find((m) => m.monthIndex === index);
      return {
        month: MONTH_SHORT[column] ?? column,
        margin: month?.marginPercent ?? null,
      };
    }),
  }));

  const readParts: string[] = [];
  if (payload.bestMonth) {
    readParts.push(
      `Best month: ${payload.bestMonth.month} (${payload.bestMonth.marginPercent}%).`,
    );
  }
  if (payload.worstMonth) {
    readParts.push(
      `Worst month: ${payload.worstMonth.month} (${payload.worstMonth.marginPercent}%).`,
    );
  }
  const read = readParts.join(" ");

  return {
    note: `last ${monthsCovered} months`,
    months,
    rows,
    read,
  };
};
