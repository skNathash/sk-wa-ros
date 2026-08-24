import ProfitAndLossService, {
  type PnlSection,
} from "~/services/ProfitAndLossService";
import { signedPercent, toFinite } from "~/shared/accounts/pnl-format";

/**
 * How a line is drawn:
 * - `revenue` — a top-line or cost figure, drawn in the revenue blue
 * - `profit`  — what was kept after it, drawn in the profit green and set bold
 */
export type ComparisonTone = "revenue" | "profit";

export type ComparisonRow = {
  key: string;
  label: string;
  tone: ComparisonTone;
  /** This year so far. */
  current: number;
  /** The same months last year. */
  previous: number;
  /** Bar lengths as a share of the biggest figure on the block, 0–100. */
  currentPercent: number;
  previousPercent: number;
  /** Movement between the two years, as a percentage. Null with no baseline. */
  delta: number | null;
  /** Already-formatted movement column, e.g. "+27.8%" or "New". */
  deltaText: string;
  /** Why the movement is missing, when it is — used as the column's tooltip. */
  deltaNote: string;
};

export type YearComparisonData = {
  /** Small print on the right of the header, e.g. "Apr → Jul, both years". */
  note: string;
  /** Column captions above each pair of bars. */
  currentLabel: string;
  previousLabel: string;
  rows: ComparisonRow[];
};

export const emptyYearComparison = (): YearComparisonData => ({
  note: "",
  currentLabel: "",
  previousLabel: "",
  rows: [],
});

type ApiRow = {
  key: string;
  label: string;
  /** Current-year amount. */
  thisYear?: number;
  /** Same months, previous year. */
  lastYear?: number;
  /** Year-on-year movement, as a percentage. Null when there is no baseline. */
  growthPercent?: number | null;
  /** False when the previous year has nothing to compare against. */
  hasBaseline?: boolean;
  /** Why the comparison is missing, when it is. */
  baselineNote?: string | null;
};

type ApiComparisonResponse = PnlSection<ApiRow> & {
  financialYear?: string;
  comparedWith?: string;
  /** The months covered, as sent: "APRIL → AUGUST". */
  period?: string;
};

const profitKeys = new Set(["grossProfit", "netProfit"]);

const toneForKey = (key: string): ComparisonTone =>
  profitKeys.has(key) ? "profit" : "revenue";

/** "APRIL → AUGUST" as the header prints it: "Apr → Aug, both years". */
const formatNote = (period?: string): string => {
  if (!period) return "";

  const months = period
    .split("→")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(
      (month) =>
        month.charAt(0).toUpperCase() + month.slice(1, 3).toLowerCase(),
    );

  if (!months.length) return "";

  return `${months.join(" → ")}, both years`;
};

const toRows = (items: ApiRow[]): ComparisonRow[] => {
  const rows = items.map((item) => {
    const current = toFinite(item.thisYear);
    const previous = toFinite(item.lastYear);
    const hasBaseline = item.hasBaseline !== false;
    const delta =
      hasBaseline && Number.isFinite(item.growthPercent)
        ? (item.growthPercent as number)
        : null;

    return {
      key: item.key,
      label: item.label,
      tone: toneForKey(item.key),
      current,
      previous,
      currentPercent: 0,
      previousPercent: 0,
      delta,
      deltaText: delta !== null ? signedPercent(delta) : current ? "New" : "—",
      deltaNote: delta === null ? (item.baselineNote ?? "") : "",
    };
  });

  /* Both years are drawn on one scale so the pair of bars on a line can be read
     against each other, and against the biggest figure on the block. */
  const max = Math.max(
    1,
    ...rows.map((row) =>
      Math.max(Math.abs(row.current), Math.abs(row.previous)),
    ),
  );

  return rows.map((row) => ({
    ...row,
    currentPercent: (Math.abs(row.current) / max) * 100,
    previousPercent: (Math.abs(row.previous) / max) * 100,
  }));
};

export const getYearComparison = async (): Promise<YearComparisonData> => {
  const section = (await ProfitAndLossService.getFySection<ApiRow>(
    "comparison",
  )) as ApiComparisonResponse;

  if (section.data.length === 0) {
    return emptyYearComparison();
  }

  const currentFy = section.financialYear ?? "";
  const previousFy = section.comparedWith ?? "";

  return {
    note: formatNote(section.period),
    currentLabel: currentFy ? `${currentFy} YTD` : "This year",
    previousLabel: previousFy ? `${previousFy} YTD` : "Last year",
    rows: toRows(section.data),
  };
};

export { signedPercent };
