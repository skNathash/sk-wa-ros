import ProfitAndLossService from "~/services/ProfitAndLossService";
import CommonService from "~/services/CommonService";
import { signedAmount } from "~/shared/accounts/pnl-format";

/**
 * How a tile reads:
 * - `money`  — a rupee figure the quarter earned, printed in the profit tone
 * - `plain`  — a fact rather than an amount (the best month so far)
 * - `trend`  — the run rate, outlined so it reads as a projection, not a result
 */
export type QuarterStatTone = "money" | "plain" | "trend";

export type QuarterStat = {
  key: string;
  /** Small caps label, e.g. "Q2 REVENUE (APR-JUL)". */
  label: string;
  /** Already-shortened headline — not every tile is a rupee figure. */
  value: string;
  /** The line under it, e.g. "+27.8% vs Q1". */
  note: string;
  tone: QuarterStatTone;
};

export type QuarterStatsData = {
  items: QuarterStat[];
};

export const emptyQuarterStats = (): QuarterStatsData => ({ items: [] });

const formatShortRupees = (value: number) =>
  CommonService.formatCompact(value, { style: "short" });

type SummaryApiItem = {
  key: string;
  label: string;
  amount?: number;
  changeAmount?: number;
  changePercent?: number | null;
  comparedTo?: string;
  dateSpan?: string;
  marginPercent?: number;
  month?: string;
  unit?: string;
  detail?: string;
};

const toRevenueTile = (item: SummaryApiItem): QuarterStat => {
  const change = item.changePercent;
  const note =
    change != null && item.comparedTo
      ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs ${item.comparedTo}`
      : item.comparedTo
        ? `vs ${item.comparedTo}`
        : "";

  return {
    key: "revenue",
    label: item.dateSpan
      ? `${item.label} (${item.dateSpan})`
      : item.label,
    value: formatShortRupees(item.amount ?? 0),
    note,
    tone: "money",
  };
};

const toNetProfitTile = (item: SummaryApiItem): QuarterStat => ({
  key: "netProfit",
  label: item.dateSpan
    ? `${item.label} (${item.dateSpan})`
    : item.label,
  value: formatShortRupees(item.amount ?? 0),
  note:
    item.marginPercent != null
      ? `${item.marginPercent.toFixed(1)}% margin`
      : "",
  tone: "money",
});

const toBestMonthTile = (item: SummaryApiItem): QuarterStat => ({
  key: "bestMonth",
  label: item.label,
  value: item.month ?? "—",
  note: `${formatShortRupees(item.amount ?? 0)} NP`,
  tone: "plain",
});

const toTrendingTile = (item: SummaryApiItem): QuarterStat => ({
  key: "trending",
  label: item.label,
  value: `${signedAmount(item.amount ?? 0)} /mo`,
  note: item.detail ?? "",
  tone: "trend",
});

export const getQuarterStats = async (): Promise<QuarterStatsData> => {
  const section = await ProfitAndLossService.getQuarterSection<SummaryApiItem>(
    "summary",
  );

  const items: QuarterStat[] = [];

  section.data.forEach((item) => {
    switch (item.key) {
      case "quarter_revenue":
        items.push(toRevenueTile(item));
        break;
      case "quarter_net_profit":
        items.push(toNetProfitTile(item));
        break;
      case "best_month":
        items.push(toBestMonthTile(item));
        break;
      case "trending":
        items.push(toTrendingTile(item));
        break;
      default:
        break;
    }
  });

  return { items };
};
