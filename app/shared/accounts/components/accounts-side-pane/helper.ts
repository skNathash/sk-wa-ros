import { endOfMonth, format, startOfMonth } from "date-fns";
import { resolveAccountsDateRange } from "~/shared/accounts/hooks/useAccountsDateRange";
import type { SectionTab } from "~/types/CommonTypes";

/** The chip keys the pane switches between. */
export type AccountsPaneView =
  | "overview"
  | "money-in"
  | "money-out"
  | "expense"
  | "pnl"
  | "gst"
  | "auditor";

/** The stackable blocks a view can be built from. */
export type PaneBlock =
  | "summary"
  | "skip-to"
  | "parties"
  | "vendors"
  | "categories"
  | "events"
  | "recent-expenses"
  | "link";

export interface PaneViewConfig {
  key: AccountsPaneView;
  label: string;
  /** Blocks rendered top-to-bottom for this view. */
  blocks: PaneBlock[];
  /** Page the chip takes the main column to. */
  path: string;
  /**
   * Extra routes the view owns, so the pane keeps the right chip active on the
   * section's satellite pages (e.g. the expense form) that no chip links to.
   */
  matchPaths?: string[];
  /** Query params the chip navigates with, on top of the carried date range. */
  params?: Record<string, any>;
  /**
   * Whether the header's `dateFrom` / `dateTo` follow the chip. Only the pages
   * driven by the shared range picker want them; the rest pick their own period.
   */
  carryRange?: boolean;
  /**
   * Where the range-driven blocks (e.g. categories) read their window from.
   * `"range"` (default) follows the accounts header picker; `"month"` follows
   * the expense pages' own `month` / `year` params.
   */
  periodSource?: "range" | "month";
  /** Which pair of numbers the summary block shows for this view. */
  summaryView?: "overview" | "in" | "out";
  /**
   * Locks the events block to one direction. Set on the views that are already
   * about a single direction, where the "all" list would only add noise.
   */
  eventsDirection?: "in" | "out";
  /** Icon name ({@link SECTION_ICON_MAP}) used when the view is rendered as a tab. */
  icon?: string;
  /**
   * Primary action for the view, rendered as a button under the chip row. Set
   * on the views whose page hides its own header CTA in the split layout.
   */
  cta?: {
    label: string;
    path: string;
    params?: Record<string, any>;
  };
  /** Full-page destination surfaced by the `link` block. */
  link?: {
    label: string;
    note: string;
    path: string;
    params?: Record<string, any>;
  };
}

/**
 * View config for the accounts side pane.
 *
 * The accounts tab bar is hidden in theme-2, so the chips are that section's
 * navigation: picking one takes the main column to `path` and re-stacks the
 * pane's blocks for it. Views whose page lives outside the accounts section
 * (GST, auditor) also carry a `link` block as an in-pane call to action.
 */
export const paneViews: PaneViewConfig[] = [
  {
    key: "overview",
    icon: "chart-column",
    label: "Overview",
    // The landing view stacks the book summary, open party lists and recent
    // events. Expense categories are kept for the expense page so the overview
    // pane doesn't duplicate the expense section's content.
    blocks: ["summary", "parties", "vendors", "events"],
    summaryView: "overview",
    path: "/dashboard/accounts/overall-statement",
    params: { tab: "overall-statement" },
    carryRange: true,
  },
  {
    key: "money-in",
    icon: "arrow-down-left",
    label: "Money in",
    blocks: ["summary", "parties", "events"],
    summaryView: "in",
    eventsDirection: "in",
    path: "/dashboard/accounts/money-in",
    params: { tab: "money-in" },
    carryRange: true,
  },
  {
    key: "money-out",
    icon: "arrow-up-right",
    label: "Money out",
    blocks: ["summary", "vendors", "events"],
    summaryView: "out",
    eventsDirection: "out",
    path: "/dashboard/accounts/money-out",
    params: { tab: "money-out" },
    carryRange: true,
  },
  {
    key: "expense",
    icon: "receipt",
    label: "Expense",
    /* The expense pages run off their own `month`/`year` params, not the shared
       range picker — the page itself carries the month hero (which owns that
       picker), so the pane only adds the category split for that month and the
       recent list, rather than the range-driven accounts blocks. */
    blocks: ["categories", "recent-expenses"],
    periodSource: "month",
    path: "/dashboard/expenses/list",
    matchPaths: ["/dashboard/expenses/manage"],
    cta: {
      label: "Add Expense",
      path: "/dashboard/expenses/manage",
    },
  },
  {
    key: "pnl",
    icon: "trending-up",
    label: "P&L",
    blocks: ["skip-to", "link"],
    path: "/dashboard/accounts/profit-loss",
    params: { tab: "profit-loss" },
    link: {
      label: "Open Profit & Loss",
      note: "Full statement with cost breakup",
      path: "/dashboard/accounts/profit-loss",
      params: { tab: "profit-loss" },
    },
  },
  {
    key: "gst",
    icon: "file-text",
    label: "GST",
    blocks: ["link", "events"],
    path: "/dashboard/reports/gst-dashboard/products-level",
    params: { from: "accounts" },
    link: {
      label: "Open GST reports",
      note: "Product, HSN and rate summaries",
      path: "/dashboard/reports/gst-dashboard/products-level",
      params: { from: "accounts" },
    },
  },
  {
    key: "auditor",
    icon: "file-check",
    label: "Auditor",
    blocks: ["link", "events"],
    path: "/dashboard/expenses/statement-of-accounts",
    link: {
      label: "Open statement of accounts",
      note: "Period statement to hand to your auditor",
      path: "/dashboard/expenses/statement-of-accounts",
    },
  },
];

/**
 * The same views as {@link paneViews}, shaped for the mobile segmented tab bar
 * ({@link SectionTabs}). Derived rather than re-listed so the desktop pane chips
 * and the mobile tabs can never drift apart.
 */
export const accountsSectionTabs: SectionTab[] = paneViews.map((view) => ({
  key: view.key,
  label: view.label,
  icon: view.icon,
  redirect: { url: view.path, params: view.params },
}));

export const defaultPaneView: AccountsPaneView = "overview";

export const getPaneView = (key?: string | null): PaneViewConfig =>
  paneViews.find((view) => view.key === key) ||
  (paneViews[0] as PaneViewConfig);

/**
 * Chip that owns the given route, so the pane stays in step with the main
 * column when the user lands on a page from somewhere other than the chips.
 * Undefined for accounts pages no chip points at (payables, sk-statement,
 * commission invoices) — those keep whichever view was already showing.
 */
export const getPaneViewByPath = (
  pathname?: string | null,
): AccountsPaneView | undefined =>
  paneViews.find(
    (view) =>
      view.path === pathname ||
      view.matchPaths?.some(
        (path) => pathname === path || pathname?.startsWith(`${path}/`),
      ),
  )?.key;

/**
 * Date window the pane's data is read over. Follows the accounts header date
 * picker (`dateFrom` / `dateTo` in the URL) and falls back to the current
 * month, which is the window the summary and category blocks are labelled for.
 */
export const resolvePaneRange = (
  dateFrom?: string | null,
  dateTo?: string | null,
) => {
  const range = resolveAccountsDateRange(dateFrom, dateTo);
  const from = new Date(range.startDate);
  const to = new Date(range.endDate);
  return {
    ...range,
    from,
    to,
    /** Short label printed on the summary cards, e.g. "JUL". */
    periodLabel: format(to, "MMM").toUpperCase(),
  };
};

/**
 * Same shape as {@link resolvePaneRange}, but for the expense views: the window
 * is the month the expense pages are filtered to (`month` = 0-11 index, `year`
 * = full year in the URL), falling back to the current month like the hero does.
 */
export const resolveMonthRange = (
  month?: string | null,
  year?: string | null,
) => {
  const now = new Date();
  const monthIndex =
    month !== null && month !== undefined && /^\d{1,2}$/.test(month)
      ? Math.min(11, Math.max(0, Number(month)))
      : now.getMonth();
  const fullYear = year && /^\d{4}$/.test(year) ? Number(year) : now.getFullYear();

  const from = startOfMonth(new Date(fullYear, monthIndex, 1));
  const to = endOfMonth(from);

  return {
    startDate: format(from, "yyyy-MM-dd"),
    endDate: format(to, "yyyy-MM-dd"),
    from,
    to,
    periodLabel: format(to, "MMM").toUpperCase(),
  };
};
