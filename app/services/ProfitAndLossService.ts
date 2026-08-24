import { format, sub } from "date-fns";
import AccountService from "./AccountService";
import AuthService from "./AuthService";

/**
 * The P&L data layer.
 *
 * Every block on the profit & loss screens reads through this service, so the
 * endpoints, their envelopes and the shape the UI receives are decided in one
 * place. The blocks' own helpers only turn these rows into what their component
 * prints; how figures are printed lives in `~/shared/accounts/pnl-format`.
 */

/* ---------------------------------------------------------------------------
 * The overall statement's P&L aggregation.
 * ------------------------------------------------------------------------- */

export interface PnlDateRange {
  dateFrom?: string;
  dateTo?: string;
}

export interface PnlRow {
  labelKey: string;
  label?: string;
  value: number;
}

export interface PnlStatementSection {
  key: "revenue" | "purchases" | "expenses" | "notes";
  titleKey: string;
  direction: "in" | "out";
  rows: PnlRow[];
  total: number;
}

export interface PnlData {
  sections: PnlStatementSection[];
  revenue: number;
  purchases: number;
  expenses: number;
  net: number;
  margin: number; // net / revenue, as a percentage
}

export const emptyPnlData = (): PnlData => ({
  sections: [],
  revenue: 0,
  purchases: 0,
  expenses: 0,
  net: 0,
  margin: 0,
});

/* ---------------------------------------------------------------------------
 * The period dashboards.
 *
 * Every block on a period tab is a different `type` on the same endpoint, and
 * they all come back in the same envelope — `data` carries the rows, with a
 * `period` and whatever section-specific siblings (`columns`, `rankedBy`,
 * `totalIncrease`…) the section adds beside it. Some sections nest that
 * envelope one level deeper. `toSection` unwraps both, once, so a block's
 * helper only ever deals with its own rows.
 * ------------------------------------------------------------------------- */

export type PnlPeriod = {
  type?: string;
  /** Printable window, e.g. "Jul 2026". */
  label?: string;
  startDate?: string;
  endDate?: string;
};

export type PnlSection<TRow> = {
  data: TRow[];
  /** Whatever sibling fields the section adds to the envelope. */
  [key: string]: unknown;
};

/**
 * A "This month" section, which always names the window it covers. The FY
 * endpoints describe their period differently, so it is only promised here.
 */
export type PnlMonthSection<TRow> = PnlSection<TRow> & {
  period: PnlPeriod;
};

export type ThisMonthSectionType =
  | "summary"
  | "trend"
  | "waterfall"
  | "line_items"
  | "drivers"
  | "leaks"
  | "insights"
  | "sk_impact";

export type FyViewSectionType = "summary" | "story";

export type FySectionType = "summary" | "compare" | "comparison";

export type QuarterSectionType = "summary" | "quarters" | "seasonality";

const toSection = <TRow>(body: unknown): PnlSection<TRow> => {
  if (Array.isArray(body)) {
    return { data: body as TRow[] };
  }

  const envelope = (body ?? {}) as Record<string, unknown>;
  const inner = envelope.data;

  // A nested envelope — `{ data: { data: [...], financialYear, period } }`.
  if (inner && !Array.isArray(inner) && typeof inner === "object") {
    const nested = inner as Record<string, unknown>;
    return {
      ...nested,
      data: Array.isArray(nested.data) ? (nested.data as TRow[]) : [],
    };
  }

  return {
    ...envelope,
    data: Array.isArray(inner) ? (inner as TRow[]) : [],
  };
};

class ProfitAndLossService {
  /**
   * The P&L aggregation behind the overall statement, for the given range —
   * defaults to the last 3 months, matching that screen's default filter.
   */
  static async getStatement(range?: PnlDateRange): Promise<PnlData> {
    const franchiseId = AuthService.getLoggedInUserId(true) || "";

    const startDate = range?.dateFrom
      ? format(new Date(range.dateFrom), "yyyy-MM-dd")
      : format(sub(new Date(), { months: 3 }), "yyyy-MM-dd");
    const endDate = range?.dateTo
      ? format(new Date(range.dateTo), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

    const response = await AccountService.getPnlReport({
      filter: {
        franchiseId,
        startDate,
        endDate,
        compare: false,
      },
    });

    return ProfitAndLossService.formatStatement(response?.data);
  }

  /**
   * Maps the `accounts/reports/pnl` response to the shape the statement prints.
   *
   * Response structure:
   * {
   *   data: {
   *     sections: { revenue, purchase, expense, notes },
   *     summary: { revenue, purchases, expenses, notesImpact, grossProfit,
   *                netProfit, netMargin }
   *   }
   * }
   * Each section has { key, label, total, count, lines }; each line has
   * { key, label, sign, amount, count, signedAmount, share }.
   */
  static formatStatement(raw: any): PnlData {
    const summary = raw?.data?.summary || {};
    const sections = raw?.data?.sections || {};

    const sectionEntries: Array<{
      apiKey: string;
      uiKey: PnlStatementSection["key"];
      direction: PnlStatementSection["direction"];
      titleKey: string;
    }> = [
      {
        apiKey: "revenue",
        uiKey: "revenue",
        direction: "in",
        titleKey: "revenue",
      },
      {
        apiKey: "purchase",
        uiKey: "purchases",
        direction: "out",
        titleKey: "purchases",
      },
      {
        apiKey: "expense",
        uiKey: "expenses",
        direction: "out",
        titleKey: "expenses",
      },
      { apiKey: "notes", uiKey: "notes", direction: "out", titleKey: "notes" },
    ];

    const mappedSections: PnlStatementSection[] = sectionEntries
      .map(({ apiKey, uiKey, direction, titleKey }) => {
        const section = sections[apiKey];
        if (!section) return null;

        const rows: PnlRow[] = (section.lines || [])
          .map((line: any) => ({
            labelKey: line.key || line.label,
            label: line.label,
            value: Number(line.signedAmount) || 0,
          }))
          .filter((row: PnlRow) => row.value !== 0);

        if (!rows.length) return null;

        return {
          key: uiKey,
          titleKey,
          direction,
          total: Number(section.total) || 0,
          rows,
        };
      })
      .filter(Boolean) as PnlStatementSection[];

    return {
      sections: mappedSections,
      revenue: Number(summary.revenue) || 0,
      purchases: Number(summary.purchases) || 0,
      expenses: Number(summary.expenses) || 0,
      net: Number(summary.netProfit) || 0,
      margin: Number(summary.netMargin) || 0,
    };
  }

  /**
   * One section of the "This month" tab. The endpoint pages at 10 rows by
   * default, which is short for a P&L that can carry a line per expense
   * category the store invented, so callers ask for the whole section instead —
   * 100 is the ceiling the endpoint clamps to.
   */
  static async getThisMonthSection<TRow>(
    type: ThisMonthSectionType,
    params: Record<string, unknown> = {},
  ): Promise<PnlMonthSection<TRow>> {
    const response = await AccountService.getProfitLossThisMonthSummary({
      type,
      limit: 100,
      ...params,
    });

    const section = toSection<TRow>(response?.data);

    return { ...section, period: (section.period as PnlPeriod) ?? {} };
  }

  /** One section of the "FY view" tab. */
  static async getFyViewSection<TRow>(
    type: FyViewSectionType,
  ): Promise<PnlSection<TRow>> {
    const response = await AccountService.getProfitLossFyViewSummary({ type });

    return toSection<TRow>(response?.data);
  }

  /** One list-shaped section of the "YTD" tab. */
  static async getFySection<TRow>(
    type: FySectionType,
  ): Promise<PnlSection<TRow>> {
    const response = await AccountService.getProfitLossFy({ type });

    return toSection<TRow>(response?.data);
  }

  /** One list-shaped section of the "Quarter" tab. */
  static async getQuarterSection<TRow>(
    type: QuarterSectionType,
    params: Record<string, unknown> = {},
  ): Promise<PnlSection<TRow>> {
    const response = await AccountService.getProfitLossQuarter({
      type,
      ...params,
    });

    return toSection<TRow>(response?.data);
  }

  /**
   * The YTD summary, which answers with a single object rather than a list of
   * rows, so it is read whole instead of through `toSection`.
   */
  static async getFySummary<TPayload>(): Promise<TPayload | undefined> {
    const response = await AccountService.getProfitLossFy({ type: "summary" });

    return (response?.data?.data ?? response?.data) as TPayload | undefined;
  }
}

export default ProfitAndLossService;
