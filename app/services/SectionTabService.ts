import type { SectionTab, SectionTabKey } from "~/types/CommonTypes";
import AccountsNavService from "./AccountsNavService";

/** Display copy for a top-level section (header eyebrow + switcher prompt). */
export interface SectionMeta {
  /** Human label for the section itself, e.g. "Supply". */
  label: string;
  /** Prompt shown at the top of the header section switcher. */
  prompt: string;
}

/** A run of consecutive tabs sharing one heading (see {@link SectionTab.group}). */
export interface SectionTabGroup {
  /** Heading text, or undefined for tabs that carry no group. */
  label?: string;
  tabs: SectionTab[];
}

/**
 * Provides the grouped navigation tabs for each top-level section
 * (Bill, Business, Supply, Catalog). Each tab carries the redirect
 * target (url + optional query params) so callers only need to hand
 * the resolved tab to a navigation helper.
 */
export default class SectionTabService {
  private static readonly SECTION_META: Record<SectionTabKey, SectionMeta> = {
    home: { label: "Home", prompt: "Where do you want to go in Home?" },
    bill: { label: "Bill", prompt: "Where do you want to go in Bill?" },
    business: {
      label: "Business",
      prompt: "Where do you want to go in Business?",
    },
    supply: { label: "Supply", prompt: "Where do you want to go in Supply?" },
    catalog: {
      label: "Catalog",
      prompt: "Where do you want to go in Catalog?",
    },
    profile: {
      label: "Profile",
      prompt: "Where do you want to go in Profile?",
    },
  };

  private static readonly SECTION_TABS: Record<SectionTabKey, SectionTab[]> = {
    // Home is the one section whose entries are mostly not separate pages —
    // apart from Journey and Modules, every tab scrolls to a block of the home
    // dashboard, which is why they share the `/dashboard/main` url and carry a
    // `view` param. The home page passes its own `onSelect`/`activeTab` (see the
    // main route), so for those the redirect is only the fallback for renderers
    // that navigate blindly; the real routes navigate through it.
    home: [
      {
        label: "Today",
        key: "today",
        icon: "sun",
        description: "Live numbers for the day",
        redirect: { url: "/dashboard/main", params: { view: "today" } },
      },
      {
        label: "Journey",
        key: "journey",
        icon: "route",
        description: "Bright Store stages & next step",
        redirect: { url: "/dashboard/journey" },
      },
      {
        label: "Modules",
        key: "modules",
        icon: "grid",
        description: "Everything your shop runs on",
        redirect: { url: "/dashboard/modules" },
      },
    ],
    bill: [
      {
        label: "POS",
        key: "pos",
        icon: "scan-line",
        description: "Scan & bill at the counter",
        redirect: { url: "/pos/billing" },
      },
      // {
      //   label: "Sales",
      //   key: "sales",
      //   langKey: "sales",
      //   icon: "chart-line",
      //   description: "Today's numbers & trends",
      //   redirect: { url: "/dashboard/sales-overview" },
      // },
      {
        label: "Orders",
        key: "orders",
        langKey: "orders",
        icon: "shopping-bag",
        // The fulfilment queue is the working view of customer orders — it
        // carries the pipeline stages and the per-stage counts, so the rail
        // lands there rather than on the flat orders list.
        description: "Pick, pack & hand over orders",
        redirect: { url: "/dashboard/fulfillment/list" },
      },
      {
        label: "Returns",
        key: "returns",
        langKey: "returns",
        icon: "undo-2",
        description: "Send stock back to vendors",
        redirect: { url: "/dashboard/fulfillment/vendor-return" },
      },
      {
        label: "Logistics",
        key: "logistics",
        icon: "truck",
        description: "Dispatch & delivery status",
        redirect: { url: "/dashboard/delivery/dispatch" },
      },
      {
        label: "Routes",
        key: "routes",
        icon: "route",
        description: "Delivery agencies & beats",
        redirect: { url: "/configs/settings/delivery-routes" },
      },
    ],
    business: [
      // — Customers —
      {
        label: "Customers",
        key: "customers",
        group: "Customers",
        icon: "users",
        description: "Your buyers & credit",
        redirect: {
          url: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
        },
      },
      // platform fee
      {
        label: "Platform Fee",
        key: "platform-fee",
        group: "Customers",
        icon: "credit-card",
        description: "Platform fee",
        redirect: { url: "/dashboard/accounts/platform-fee/benefits" },
      },
      {
        label: "Paylater",
        key: "paylater",
        langKey: "paylater",
        group: "Customers",
        icon: "credit-card",
        description: "Credit given to customers",
        redirect: { url: "/dashboard/paylater/analytics?tab=analytics" },
      },
      {
        label: "Loyalty",
        key: "loyalty",
        group: "Customers",
        icon: "gift",
        description: "Points & rewards",
        // Lands on the coins dashboard — the sub-nav's first tab — rather than
        // the config page (see LoyaltyPointService.getSectionTabs).
        redirect: { url: "/products/coin-economy" },
      },

      // — Store —
      // {
      //   label: "Staff",
      //   key: "staff",
      //   group: "Store",
      //   icon: "id-card",
      //   description: "Employees & access",
      //   redirect: { url: "/dashboard/employee/list" },
      // },
      {
        label: "Accounts",
        key: "accounts",
        group: "Store",
        langKey: "accounts",
        icon: "wallet",
        description: "Statements & settlements",
        // Resolved to the plan-aware landing target in getTabs(); the static
        // value here is just a fallback.
        redirect: { url: "/dashboard/accounts/overall-statement" },
      },
      {
        label: "Expenses",
        key: "expenses",
        langKey: "expenses",
        group: "Store",
        icon: "receipt",
        description: "What the store spends",
        redirect: { url: "/dashboard/expenses/list" },
      },
      {
        label: "Reports",
        key: "reports",
        langKey: "reports",
        group: "Store",
        icon: "chart-column",
        description: "GST & business reports",
        redirect: { url: "/dashboard/reports" },
      },
    ],
    supply: [
      {
        label: "Insights",
        key: "insight",
        icon: "lightbulb",
        description: "What to buy next",
        redirect: { url: "/dashboard/insight" },
      },
      {
        label: "Buy from network",
        key: "browse",
        icon: "search",
        description: "Buy stock · marketplace",
        redirect: { url: "/products/main" },
      },
      // {
      //   label: "Seller Catalog",
      //   key: "catalog",
      //   langKey: "catalog",
      //   icon: "grid",
      //   description: "Reorder from your seller",
      //   redirect: { url: "/products/buy-from-other-retailer/products/reorder" },
      // },
      {
        label: "Sellers",
        key: "sellers",
        icon: "map-pin",
        description: "Your network & orders",
        redirect: { url: "/products/buy-from-other-retailer/retailers" },
      },
      // {
      //   label: "Supply",
      //   key: "supply",
      //   icon: "house",
      //   redirect: { url: "/dashboard/purchase-order/main" },
      // },
      // {
      //   label: "Buy from SK",
      //   key: "buy-from-sk",
      //   icon: "layout-grid",
      //   redirect: { url: "/products/sk" },
      // },
      // {
      //   label: "Buy from Network",
      //   key: "buy-from-network",
      //   icon: "truck",
      //   redirect: { url: "/products/main" },
      // },
      {
        label: "Vendors",
        key: "vendors",
        langKey: "vendors",
        icon: "store",
        description: "Your own suppliers",
        redirect: { url: "/dashboard/vendor/list" },
      },
      {
        label: "Purchase Orders",
        key: "purchase-orders",
        langKey: "purchaseOrders",
        icon: "clipboard-list",
        description: "Raised & pending POs",
        redirect: {
          url: "/dashboard/purchase-order/main",
        },
      },
      {
        label: "Inward",
        key: "receive-stock",
        langKey: "inward",
        icon: "package-check",
        description: "Boxes + AI invoice",
        redirect: { url: "/dashboard/purchase-order/not-received" },
      },
    ],
    catalog: [
      {
        label: "Dashboard",
        key: "inventory-dashboard",
        langKey: "dashboard",
        icon: "layout-dashboard",
        description: "Stock health at a glance",
        redirect: { url: "/dashboard/inventory/dashboard" },
      },
      {
        label: "All Items",
        key: "my-catalog",
        icon: "book-open",
        description: "Products you sell",
        redirect: { url: "/dashboard/inventory/products/list" },
      },
      {
        label: "SK Library",
        key: "library",
        icon: "library",
        description: "Add products to your store",
        redirect: {
          url: "/dashboard/inventory/subscribe/discover",
          params: { tab: "discover" },
        },
      },
      {
        label: "Godown",
        key: "godown",
        langKey: "godown",
        icon: "warehouse",
        description: "Racks & bins",
        redirect: { url: "/dashboard/inventory/rack-bin" },
      },
      {
        label: "Pricing",
        key: "pricing",
        langKey: "pricing",
        icon: "tag",
        description: "Selling price & margins",
        redirect: { url: "/configs/rsp" },
      },
      {
        // Lands on the generator's Single Product tab; the page's own
        // Single/Bulk switcher takes it from there.
        label: "Barcode Generator",
        key: "barcode-generator",
        icon: "barcode",
        description: "Generate & print labels",
        redirect: { url: "/dashboard/inventory/print-barcode" },
      },
    ],
    profile: [
      {
        label: "My Profile",
        key: "my-profile",
        icon: "user",
        description: "Store & owner details",
        redirect: { url: "/user/my-profile" },
      },
      {
        label: "Documents",
        key: "documents",
        icon: "file-text",
        description: "KYC & store documents",
        redirect: { url: "/user/documents" },
      },
      {
        label: "Photos",
        key: "store-photos",
        icon: "camera",
        description: "Storefront & interior shots",
        redirect: { url: "/user/store-photos" },
      },
      {
        label: "Branding",
        key: "store-branding",
        icon: "image",
        description: "Logo, tagline & social links",
        redirect: { url: "/user/store-branding" },
      },
      {
        label: "Settings",
        key: "settings",
        icon: "settings",
        description: "App & store preferences",
        redirect: { url: "/configs/settings/delivery-slot" },
      },
      {
        label: "Store Notes",
        key: "store-notes",
        icon: "pencil",
        description: "Quick notes & reminders",
        redirect: { url: "/user/store-notes" },
      },
      {
        label: "Help & Support",
        key: "help-support",
        icon: "message-circle",
        description: "Guides & assistance",
        redirect: { url: "/manual" },
      },
    ],
  };

  /**
   * The Barcode Generator's own two surfaces. These are not a section of their
   * own — the pages sit under Catalog's "Barcode Generator" tab — so they live
   * apart from {@link SECTION_TABS} and are handed to `SectionTabs` explicitly
   * by the two pages that render them (see {@link getBarcodeTabs}).
   */
  private static readonly BARCODE_TABS: SectionTab[] = [
    {
      label: "Single Product",
      key: "single",
      icon: "package",
      description: "Print labels for one product",
      redirect: { url: "/dashboard/inventory/print-barcode" },
    },
    {
      label: "Bulk Product",
      key: "bulk",
      icon: "boxes",
      description: "Print a sheet for a brand or category",
      redirect: { url: "/dashboard/inventory/print-barcode/bulk" },
    },
  ];

  /**
   * The Platform Fee surfaces (Overview / Tiers / Compare / Statement). Like
   * {@link BARCODE_TABS} these are not a section of their own — the pages sit
   * under Business's "Platform Fee" tab — so they live apart from
   * {@link SECTION_TABS} and are handed to `SectionTabs` explicitly by the
   * platform fee pages (see {@link getPlatformFeeTabs}).
   */
  private static readonly PLATFORM_FEE_TABS: SectionTab[] = [
    {
      label: "Overview",
      key: "overview",
      icon: "layout-dashboard",
      description: "What the plan gets you",
      redirect: { url: "/dashboard/accounts/platform-fee/benefits" },
    },
    {
      label: "Tiers",
      key: "tiers",
      langKey: "tiers",
      icon: "trophy",
      description: "Every tier & its pricing",
      redirect: { url: "/dashboard/accounts/platform-fee/tiers" },
    },
    {
      label: "Compare",
      key: "compare",
      icon: "columns-3",
      description: "Plans side by side",
      redirect: { url: "/dashboard/accounts/platform-fee/compare" },
    },
    {
      label: "Statement",
      key: "statement",
      icon: "receipt",
      description: "Charges & invoices",
      // The statement page lives inside the accounts layout, whose own tab
      // tray reads `tab` — without it the tray would fall back to Revenue.
      redirect: {
        url: "/dashboard/accounts/platform-fee/statement",
        params: { tab: "commission-invoices" },
      },
    },
  ];

  /**
   * Tabs for the Barcode Generator flow (Single / Bulk), shared by the two
   * barcode pages so the strip is defined in one place.
   */
  static getBarcodeTabs(): SectionTab[] {
    return SectionTabService.BARCODE_TABS;
  }

  /**
   * Tabs for the Platform Fee flow (Overview / Tiers / Compare / Statement), shared by
   * the platform fee pages so the strip is defined in one place.
   */
  static getPlatformFeeTabs(): SectionTab[] {
    return SectionTabService.PLATFORM_FEE_TABS;
  }

  /** Returns the tabs configured for the given section key. */
  static getTabs(key: SectionTabKey): SectionTab[] {
    const tabs = SectionTabService.SECTION_TABS[key] ?? [];
    // The Accounts landing target is plan-aware, so it resolves at call time.
    return tabs.map((tab) => {
      if (tab.key === "accounts") {
        return {
          ...tab,
          redirect: { url: AccountsNavService.getAccountsRedirectUrl() },
        };
      }
      return tab;
    });
  }

  /**
   * Splits an ordered tab list into consecutive runs that share a `group`, so
   * renderers can print the heading once above each run. Tabs with no group
   * form their own heading-less run; a group name that reappears after another
   * group starts a fresh run (the config keeps groups contiguous).
   */
  static groupTabs(tabs: SectionTab[]): SectionTabGroup[] {
    const groups: SectionTabGroup[] = [];
    for (const tab of tabs) {
      const last = groups[groups.length - 1];
      if (last && last.label === tab.group) {
        last.tabs.push(tab);
        continue;
      }
      groups.push({ label: tab.group, tabs: [tab] });
    }
    return groups;
  }

  /** Returns a single tab within a section by its tab key, if present. */
  static getTab(key: SectionTabKey, tabKey: string): SectionTab | undefined {
    return SectionTabService.getTabs(key).find((tab) => tab.key === tabKey);
  }

  /** Display copy (section label + switcher prompt) for a section. */
  static getMeta(key: SectionTabKey): SectionMeta {
    return (
      SectionTabService.SECTION_META[key] ?? {
        label: key,
        prompt: "Where do you want to go?",
      }
    );
  }

  /**
   * Resolves which tab is active. Prefers the explicit key; otherwise matches
   * the longest redirect url that prefixes the pathname, so nested routes stay
   * highlighted.
   */
  static resolveActiveTab(
    tabs: SectionTab[],
    pathname: string,
    explicitKey?: string,
  ): string | undefined {
    if (explicitKey) return explicitKey;

    let matchKey: string | undefined;
    let matchLen = -1;
    for (const tab of tabs) {
      const url = tab.redirect.url;
      if (pathname.startsWith(url) && url.length > matchLen) {
        matchKey = tab.key;
        matchLen = url.length;
      }
    }
    return matchKey;
  }
}
