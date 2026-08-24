import CommonService from "~/services/CommonService";
import ProfitAndLossService from "~/services/ProfitAndLossService";
import {
  signedAmount,
  signedPercent,
  toFinite,
} from "~/shared/accounts/pnl-format";

/**
 * How a column reads:
 * - `money`      — a projected rupee figure, printed in the profit tone
 * - `outlook`    — a run-rate judgement, printed in blue
 */
export type ForecastTone = "money" | "outlook";

export type ForecastItem = {
  key: string;
  /** Small caps label, e.g. "PROJECTED REVENUE". */
  label: string;
  /** Already-shortened headline — a rupee figure or a signed percentage. */
  value: string;
  /** The line under it, e.g. "+41% vs FY26 (₹32.5L)". */
  note: string;
  tone: ForecastTone;
};

export type FyForecastData = {
  /** Small print on the right of the header, e.g. "based on current 4-month run rate". */
  note: string;
  items: ForecastItem[];
};

export const emptyFyForecast = (): FyForecastData => ({ note: "", items: [] });

type ApiCompareItem = {
  key: string;
  label: string;
  amount: number;
  changeAmount?: number;
  changePercent?: number | null;
  hasBaseline?: boolean;
  baselineNote?: string | null;
  revenue?: number;
  marginPercent?: number;
  basedOnMonths?: number;
  basis?: string;
};

const toneForKey = (key: string): ForecastTone => {
  if (key === "projected") return "outlook";
  return "money";
};

const formatValue = (item: ApiCompareItem): string => {
  const changePercent = Number.isFinite(item.changePercent)
    ? (item.changePercent as number)
    : null;

  if (
    item.hasBaseline &&
    changePercent !== null &&
    item.key !== "ytd" &&
    item.key !== "projected"
  ) {
    return signedPercent(changePercent);
  }

  return CommonService.formatCompact(item.amount);
};

const formatNote = (item: ApiCompareItem): string => {
  if (item.key === "projected") {
    const basis = item.basis || "straight-line run rate";
    return basedOnMonthsNote(item.basedOnMonths, basis);
  }

  if (item.key === "ytd") {
    const parts: string[] = [];
    const revenue = toFinite(item.revenue);
    const marginPercent = Number.isFinite(item.marginPercent)
      ? (item.marginPercent as number)
      : null;

    if (revenue !== 0) {
      parts.push(`Revenue ${CommonService.formatCompact(revenue)}`);
    }
    if (marginPercent !== null) {
      parts.push(`Margin ${marginPercent.toFixed(1)}%`);
    }
    return parts.join(" · ");
  }

  if (Number.isFinite(item.changeAmount)) {
    return item.hasBaseline
      ? `${signedAmount(item.changeAmount as number)} vs baseline`
      : `${signedAmount(item.changeAmount as number)} vs ₹0 baseline`;
  }

  return item.hasBaseline ? "" : "vs ₹0 baseline";
};

const basedOnMonthsNote = (months?: number, basis?: string): string => {
  const parts: string[] = [];
  const m = toFinite(months);
  if (m !== 0) {
    parts.push(`Based on ${m} month${m === 1 ? "" : "s"}`);
  }
  if (basis) {
    parts.push(basis);
  }
  return parts.join(" · ");
};

const toForecastItems = (items: ApiCompareItem[]): ForecastItem[] =>
  items.map((item) => ({
    key: item.key,
    label: item.label.toUpperCase(),
    value: formatValue(item),
    note: formatNote(item),
    tone: toneForKey(item.key),
  }));

export const getFyForecast = async (): Promise<FyForecastData> => {
  const section =
    await ProfitAndLossService.getFySection<ApiCompareItem>("compare");

  if (section.data.length === 0) {
    return emptyFyForecast();
  }

  return {
    note: "YTD comparison and full-year projection",
    items: toForecastItems(section.data),
  };
};
