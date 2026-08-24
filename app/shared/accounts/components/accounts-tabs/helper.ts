import type { TabItem } from "~/types/CommonTypes";

/**
 * URL param the theme-2 tab tray writes its selection to. Shared across the
 * accounts pages — `tab` is already taken by the accounts section nav, and one
 * param keeps the tray's state readable (and shareable) from the URL alone.
 */
export const ACCOUNTS_SUB_TAB_PARAM = "subTab";

export type AccountsSubTab = TabItem & {
  /**
   * Tabs that are an action rather than a view: selecting one routes away
   * instead of re-reading the page it sits on.
   */
  redirect?: { path: string; params?: Record<string, any> };
};

export type AccountsSubTabConfig = {
  /** Tab the page falls back to when the URL carries none. */
  defaultKey: string;
  tabs: AccountsSubTab[];
};

/**
 * Theme-2 turns the accounts tab tray from section navigation into the current
 * page's own sub-nav — the section is already switched by the side pane chips
 * (desktop) and the section tab bar (mobile), so repeating it here said nothing.
 *
 * Keyed by route so a page and the layout resolve the same tray without the
 * page having to render one of its own.
 */
const accountsSubTabs: Record<string, AccountsSubTabConfig> = {
  "/dashboard/accounts/money-in": {
    // Lane keys are the values the money-in API prints ("all", "B2C", "B2B"),
    // so the tray key can be handed straight to the list helpers.
    defaultKey: "all",
    tabs: [
      { key: "all", name: "All collections" },
      { key: "B2C", name: "B2C" },
      { key: "B2B", name: "B2B" },
      { key: "paylater", name: "Paylater" },
      {
        key: "record-payment",
        name: "Record payment",
        redirect: { path: "/dashboard/accounts/record-payment" },
      },
    ],
  },
  "/dashboard/accounts/money-out": {
    defaultKey: "vendors",
    tabs: [
      { key: "vendors", name: "Vendors" },
      { key: "aging", name: "Aging" },
      { key: "notes", name: "Credit/Debit notes" },
    ],
  },
  "/dashboard/accounts/profit-loss": {
    defaultKey: "this-month",
    tabs: [
      { key: "this-month", name: "This month" },
      { key: "quarter", name: "Quarter" },
      { key: "ytd", name: "YTD" },
      { key: "fy-view", name: "FY view" },
      { key: "os-impact", name: "StoreKing OS impact" },
    ],
  },
};

/**
 * Accounts pages that carry no tab tray at all in theme-2. Overview is the
 * section's landing page: the side pane / section bar already has it selected,
 * and it has nothing to sub-divide.
 */
const hiddenTabPaths = ["/dashboard/accounts/overall-statement"];

export const isAccountsTabsHidden = (pathname?: string | null): boolean =>
  hiddenTabPaths.includes(pathname || "");

export const getAccountsSubTabConfig = (
  pathname?: string | null,
): AccountsSubTabConfig | undefined => accountsSubTabs[pathname || ""];

/**
 * Tray selection for a route, falling back to its default when the URL carries
 * nothing (or a key from a tray the user has since navigated away from).
 */
export const getAccountsSubTabKey = (
  pathname?: string | null,
  value?: string | null,
): string => {
  const config = getAccountsSubTabConfig(pathname);
  if (!config) return value || "";
  return config.tabs.some((tab) => tab.key === value && !tab.redirect)
    ? (value as string)
    : config.defaultKey;
};
