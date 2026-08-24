import AccountService from "~/services/AccountService";

interface SkipToApiItem {
  key: string;
  label: string;
  amount: number;
  yoyPercent?: number | null;
  hasBaseline?: boolean;
  baselineNote?: string;
  percentOfRevenue?: number | null;
  marginPercent?: number | null;
  marginChangePp?: number | null;
}

export type SkipToTone = "in" | "out" | "neutral";

export interface SkipToRow {
  key: string;
  label: string;
  amount: number;
  /** Pre-formatted footnote ready to print under the label. */
  note: string;
  tone: SkipToTone;
  iconKey: string;
}

export interface SkipToData {
  items: SkipToRow[];
}

export const emptySkipToData = (): SkipToData => ({ items: [] });

const toFinite = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const signedPercent = (value: number, decimals = 1): string => {
  const n = toFinite(value);
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(decimals)}%`;
};

const signedPp = (value: number, decimals = 1): string => {
  const n = toFinite(value);
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(decimals)}pp`;
};

const itemTone = (item: SkipToApiItem): SkipToTone => {
  switch (item.key) {
    case "revenue":
      return "in";
    case "cogs":
    case "operating_expenses":
      return "out";
    case "gross_profit":
      return item.amount >= 0 ? "in" : "out";
    default:
      return "neutral";
  }
};

const itemIconKey = (key: string): string => {
  switch (key) {
    case "revenue":
      return "trending";
    case "cogs":
      return "package";
    case "gross_profit":
      return "bar-chart";
    case "operating_expenses":
      return "wallet";
    default:
      return "trending";
  }
};

const itemNote = (item: SkipToApiItem): string => {
  switch (item.key) {
    case "revenue": {
      if (item.yoyPercent !== null && item.yoyPercent !== undefined) {
        return `${signedPercent(item.yoyPercent)} YoY`;
      }
      if (item.hasBaseline === false && item.baselineNote) {
        return item.baselineNote;
      }
      return "";
    }

    case "cogs":
    case "operating_expenses": {
      const pct = item.percentOfRevenue;
      if (pct === null || pct === undefined) return "";
      return `${Math.abs(toFinite(pct)).toFixed(1)}% of revenue`;
    }

    case "gross_profit": {
      const margin = item.marginPercent;
      if (margin === null || margin === undefined) return "";
      const change = item.marginChangePp;
      const changeText =
        change !== null && change !== undefined
          ? ` (${signedPp(change)})`
          : "";
      return `${Math.abs(toFinite(margin)).toFixed(1)}% margin${changeText}`;
    }

    default:
      return "";
  }
};

const buildSkipToRow = (item: SkipToApiItem): SkipToRow => ({
  key: item.key,
  label: item.label,
  amount: item.amount,
  note: itemNote(item),
  tone: itemTone(item),
  iconKey: itemIconKey(item.key),
});

/**
 * Loads and formats the P&L "skip to" snapshot used by the accounts side pane.
 *
 * The endpoint returns the headline numbers for the current financial year
 * so the pane can preview Revenue, COGS, Gross Profit and Operating Expenses.
 */
export const getSkipToSummary = async (): Promise<SkipToData> => {
  try {
    const response = await AccountService.getProfitLossFy({ type: "skip_to" });
    const items: SkipToApiItem[] = response?.data?.data ?? [];
    return { items: items.map(buildSkipToRow) };
  } catch {
    return emptySkipToData();
  }
};
