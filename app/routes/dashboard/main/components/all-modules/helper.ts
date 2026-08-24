/**
 * Static data source for the "All modules" grid — every area of StoreKing the
 * shop can open, with whatever needs attention shown as a badge.
 */

import { clubStoreUrl } from "~/routes/dashboard/modules/helper";
import type { VariantColor } from "~/types/CommonTypes";

export type ModuleBadge = {
  text: string;
  variant: VariantColor;
};

export type ModuleTile = {
  key: string;
  name: string;
  /** "POS · quick sale · F&B" support line. */
  description: string;
  emoji: string;
  /** Tailwind background for the emoji chip. */
  chipClass: string;
  to: string;
  /**
   * Modules that live outside the app. Resolved at render time (the URL can
   * depend on the logged-in user) and opened in a new tab; `to` is ignored.
   */
  externalUrl?: () => string;
  actionLabel: string;
  badge?: ModuleBadge;
};

export type AllModulesData = {
  heading: string;
  caption: string;
  modules: ModuleTile[];
};

export const emptyAllModules = (): AllModulesData => ({
  heading: "",
  caption: "",
  modules: [],
});

export const getAllModules = async (): Promise<AllModulesData> =>
  Promise.resolve({
    heading: "All modules",
    caption: "Everything StoreKing has for your shop",
    modules: [
      {
        key: "billing",
        name: "Billing",
        description: "POS · quick sale · F&B",
        emoji: "🧾",
        chipClass: "tw:bg-amber-50",
        to: "/pos/billing",
        actionLabel: "View",
        badge: { text: "12", variant: "danger" },
      },
      {
        key: "catalog",
        name: "Catalog",
        description: "Items · prices · stock",
        emoji: "📦",
        chipClass: "tw:bg-violet-50",
        to: "/dashboard/inventory/products/list",
        actionLabel: "View",
        badge: { text: "43 Low", variant: "danger" },
      },
      {
        key: "supply",
        name: "Supply",
        description: "Buy stock · vendors · PO",
        emoji: "🛒",
        chipClass: "tw:bg-sky-50",
        to: "/dashboard/purchase-order/main",
        actionLabel: "View",
      },
      {
        key: "accounts",
        name: "Accounts",
        description: "Money in/out · P&L · GST",
        emoji: "💰",
        chipClass: "tw:bg-emerald-50",
        to: "/dashboard/accounts/overall-statement",
        actionLabel: "View",
      },
      {
        key: "customers",
        name: "Paylater",
        description: "Credit · reminders · nudges",
        emoji: "🤝",
        chipClass: "tw:bg-indigo-50",
        to: "/dashboard/paylater/my-paylater?tab=my-paylater",
        actionLabel: "View",
        badge: { text: "5", variant: "danger" },
      },
      {
        key: "club",
        name: "CLUB",
        description: "Loyalty · deals · coins",
        emoji: "👑",
        chipClass: "tw:bg-yellow-50",
        to: "/dashboard/club/cash-deposit",
        externalUrl: clubStoreUrl,
        actionLabel: "View",
      },
    ],
  });
