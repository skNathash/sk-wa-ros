import CommonService from "~/services/CommonService";
import ProfitAndLossService from "~/services/ProfitAndLossService";
import { signedPercent } from "~/shared/accounts/pnl-format";

/**
 * How a tile reads:
 * - `plain`    — a year that is closed and settled
 * - `money`    — the year being projected, printed in the profit tone
 * - `outlook`  — the growth it implies, outlined so it reads as an expectation
 */
export type FyStatTone = "plain" | "money" | "outlook";

export type FyStat = {
  key: string;
  /** Small caps label, e.g. "FY26 (LAST YEAR)". */
  label: string;
  /** Already-shortened headline. */
  value: string;
  /** The line under it, e.g. "Rev · ₹5.01L NP · 15.4% margin". */
  note: string;
  tone: FyStatTone;
};

export type FyStatsData = {
  items: FyStat[];
};

type ApiFySummaryItem = {
  key: string;
  label: string;
  amount?: number;
  revenue?: number;
  marginPercent?: number;
  hasActivity?: boolean;
  basedOnMonths?: number;
  isClosed?: boolean;
  basis?: string;
  changePercent?: number | null;
  changeAmount?: number;
  hasBaseline?: boolean;
  baselineNote?: string;
  detail?: string;
};

export const emptyFyStats = (): FyStatsData => ({ items: [] });

const toneForKey = (key: string): FyStatTone => {
  if (key === "expected_yoy") return "outlook";
  if (key === "forecast") return "money";
  return "plain";
};

const formatYearNote = (item: ApiFySummaryItem): string => {
  const parts: string[] = [];

  if (typeof item.revenue === "number") {
    parts.push(`Rev · ${CommonService.formatCompact(item.revenue)}`);
  }

  if (typeof item.amount === "number") {
    parts.push(`NP · ${CommonService.formatCompact(item.amount)}`);
  }

  if (typeof item.marginPercent === "number") {
    parts.push(`${item.marginPercent}% margin`);
  }

  return parts.join(" · ");
};

const formatYoYValue = (item: ApiFySummaryItem): string => {
  if (typeof item.changePercent === "number") {
    return signedPercent(item.changePercent);
  }

  if (typeof item.changeAmount === "number") {
    return CommonService.formatCompact(item.changeAmount);
  }

  return "—";
};

const toFyStats = (items: ApiFySummaryItem[]): FyStat[] =>
  items.map((item) => {
    const tone = toneForKey(item.key);

    if (tone === "outlook") {
      return {
        key: item.key,
        label: item.label.toUpperCase(),
        value: formatYoYValue(item),
        note: item.baselineNote || item.detail || "",
        tone,
      };
    }

    return {
      key: item.key,
      label: item.label.toUpperCase(),
      value: CommonService.formatCompact(item.amount ?? 0),
      note: formatYearNote(item),
      tone,
    };
  });

export const getFyStats = async (): Promise<FyStatsData> => {
  const section =
    await ProfitAndLossService.getFyViewSection<ApiFySummaryItem>("summary");

  if (section.data.length === 0) {
    return emptyFyStats();
  }

  return { items: toFyStats(section.data) };
};
