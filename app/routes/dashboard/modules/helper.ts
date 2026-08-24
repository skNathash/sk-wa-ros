/**
 * Data source for the "All modules" directory
 * (app/routes/dashboard/modules/index.tsx) — every module StoreKing offers,
 * grouped by what the shop is trying to do with it.
 *
 * The route file only renders; the shape of the screen — which bands exist,
 * what sits in them, which tiles are locked — is decided here, together with
 * the counts the header reads out. When the API lands, only `getModules`
 * changes: the page already treats it as async.
 */

import {
  Bike,
  CalendarDays,
  Contact,
  Crown,
  Handshake,
  MessageCircle,
  Mic,
  Package,
  Receipt,
  ShoppingCart,
  Sprout,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { CLUB_URL } from "~/constants";
import AuthService from "~/services/AuthService";
import type { VariantColor } from "~/types/CommonTypes";

/**
 * The shop's public CLUB storefront — `club.storeking.in/<mobile>`. Empty when
 * the logged-in user carries no mobile; callers render the tile unclickable
 * rather than opening a broken store.
 */
export const clubStoreUrl = (): string => {
  const mobile = AuthService.getLoggedInUser()?.mobile;
  return mobile ? `${CLUB_URL}/${mobile}` : "";
};

/** Small count chip in a card's top-right corner — "12 open", "43 Low". */
export type ModuleBadge = {
  text: string;
  /** Passed straight to `AppBadge` as its variant. */
  variant: VariantColor;
};

export type ModuleTile = {
  key: string;
  name: string;
  /** Support line — "Fast tally, F&B, held bills, returns". */
  description: string;
  icon: LucideIcon;
  /** Tailwind background + icon colour for the chip. */
  chipClass: string;
  /** Tailwind text colour for the action row, keyed to the chip. */
  actionClass: string;
  to: string;
  /**
   * Modules that live outside the app. Resolved at render time (the URL can
   * depend on the logged-in user), opened in a new tab, and `to` is ignored.
   * An empty return means "nothing to open" — the tile renders inert.
   */
  externalUrl?: () => string;
  actionLabel: string;
  badge?: ModuleBadge;
  /**
   * Modules the shop has not earned yet. They still render, greyed and
   * unclickable, so the directory shows the whole catalogue rather than
   * hiding what is coming.
   */
  locked?: boolean;
  /** Locked tiles only — what opens the module up. */
  lockedNote?: string;
};

/** One intent band — "SELL · Turn footfall into revenue". */
export type ModuleGroup = {
  key: string;
  label: string;
  caption: string;
  modules: ModuleTile[];
};

export type ModulesPage = {
  eyebrow: string;
  /** Headline is one line: the plain lead, then the italic accent. */
  headlineLead: string;
  headlineAccent: string;
  subline: string;
  /** Caption under the active-module count. */
  unlockNote: string;
  groups: ModuleGroup[];
};

export const emptyModulesPage = (): ModulesPage => ({
  eyebrow: "",
  headlineLead: "",
  headlineAccent: "",
  subline: "",
  unlockNote: "",
  groups: [],
});

/** Every tile across every group, in reading order. */
export const allModules = (data: ModulesPage) =>
  data.groups.flatMap((group) => group.modules);

/** Counts for the header readout — derived, never hand-kept in the data. */
export const moduleCounts = (data: ModulesPage) => {
  const modules = allModules(data);
  const active = modules.filter((module) => !module.locked).length;
  return { total: modules.length, active, locked: modules.length - active };
};

/* --------------------------------------------------------------------------
   Data — a hard-coded promise until the API lands.
   -------------------------------------------------------------------------- */

export const getModules = async (): Promise<ModulesPage> =>
  Promise.resolve({
    eyebrow: "All modules",
    headlineLead: "Every tool",
    headlineAccent: "for your shop.",
    subline: "everything StoreKing offers, grouped by intent",
    unlockNote: "not yet unlocked (need Journey stage 6+)",
    groups: [
      {
        key: "sell",
        label: "Sell",
        caption: "Turn footfall into revenue",
        modules: [
          {
            key: "billing",
            name: "POS Billing",
            description: "Fast tally, F&B, held bills, returns",
            icon: Receipt,
            chipClass: "tw:bg-amber-50 tw:text-amber-600",
            actionClass: "tw:text-amber-600",
            to: "/pos/billing",
            actionLabel: "View",
            badge: { text: "12 open", variant: "danger" },
          },
          {
            key: "catalog",
            name: "Catalog",
            description: "Items, prices, stock, barcodes",
            icon: Package,
            chipClass: "tw:bg-violet-50 tw:text-violet-600",
            actionClass: "tw:text-violet-600",
            to: "/dashboard/inventory/products/list",
            actionLabel: "View",
            badge: { text: "43 Low", variant: "danger" },
          },
          {
            key: "club",
            name: "CLUB",
            description: "Loyalty, deals, coins, referrals",
            icon: Crown,
            chipClass: "tw:bg-violet-50 tw:text-violet-600",
            actionClass: "tw:text-violet-600",
            to: "/dashboard/club/cash-deposit",
            externalUrl: clubStoreUrl,
            actionLabel: "View",
          },
          {
            key: "identity",
            name: "My Profile",
            description: "Your shop's face on StoreKing",
            icon: Contact,
            chipClass: "tw:bg-rose-50 tw:text-rose-600",
            actionClass: "tw:text-rose-600",
            to: "/user/my-profile",
            actionLabel: "View",
            locked: true,
            lockedNote: "Unlocks at Journey stage 6",
          },
        ],
      },
      {
        key: "stock",
        label: "Stock",
        caption: "Keep the shelves full",
        modules: [
          {
            key: "supply",
            name: "Supply",
            description: "Marketplace, PO, vendors, inward",
            icon: ShoppingCart,
            chipClass: "tw:bg-indigo-50 tw:text-sky-600",
            actionClass: "tw:text-sky-600",
            to: "/dashboard/purchase-order/main",
            actionLabel: "View",
          },
          {
            key: "logistics",
            name: "Logistics",
            description: "Runners, deliveries, pack assignments",
            icon: Bike,
            chipClass: "tw:bg-emerald-50 tw:text-emerald-700",
            actionClass: "tw:text-emerald-700",
            to: "/dashboard/delivery/dispatch",
            actionLabel: "View",
            badge: { text: "4 out", variant: "danger" },
          },
          {
            key: "plans",
            name: "Plans",
            description: "Hybrid subscriptions & retainer plans",
            icon: CalendarDays,
            chipClass: "tw:bg-orange-50 tw:text-orange-500",
            actionClass: "tw:text-orange-500",
            to: "/dashboard/accounts/platform-fee",
            actionLabel: "View",
            locked: true,
            lockedNote: "Unlocks at Journey stage 6",
          },
        ],
      },
      {
        key: "money",
        label: "Money",
        caption: "Track every rupee",
        modules: [
          {
            key: "accounts",
            name: "Accounts",
            description: "Money in/out, P&L, GST, auditor",
            icon: Wallet,
            chipClass: "tw:bg-emerald-50 tw:text-emerald-600",
            actionClass: "tw:text-emerald-600",
            to: "/dashboard/accounts/overall-statement",
            actionLabel: "View",
          },
          {
            key: "paylater",
            name: "Paylater",
            description: "Credit ledger, reminders, nudges",
            icon: Handshake,
            chipClass: "tw:bg-sky-50 tw:text-sky-600",
            actionClass: "tw:text-sky-600",
            to: "/dashboard/paylater/my-paylater?tab=my-paylater",
            actionLabel: "View",
            badge: { text: "5 due", variant: "danger" },
          },
        ],
      },
      {
        key: "grow",
        label: "Grow",
        caption: "Reach more customers",
        modules: [
          {
            key: "referral",
            name: "Referral Circle",
            description: "Refer retailers, earn coins",
            icon: Sprout,
            chipClass: "tw:bg-emerald-50 tw:text-emerald-600",
            actionClass: "tw:text-emerald-600",
            to: "/dashboard/network/management/b2c-customers",
            actionLabel: "View",
          },
          {
            key: "whatsapp",
            name: "WhatsApp Bot",
            description: "24×7 automated customer conversations",
            icon: MessageCircle,
            chipClass: "tw:bg-emerald-50 tw:text-emerald-600",
            actionClass: "tw:text-emerald-600",
            to: "/dashboard/main",
            actionLabel: "View",
          },
          {
            key: "sathi",
            name: "Sathi AI Guide",
            description: "In-app assistant across every module",
            icon: Mic,
            chipClass: "tw:bg-emerald-50 tw:text-emerald-700",
            actionClass: "tw:text-slate-800",
            to: "/dashboard/main",
            actionLabel: "View",
          },
        ],
      },
    ],
  });
