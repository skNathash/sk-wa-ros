import type { SectionTab, SectionTabKey } from "~/types/CommonTypes";

/**
 * Provides the grouped navigation tabs for each top-level section
 * (Bill, Business, Supply, Catalog). Each tab carries the redirect
 * target (url + optional query params) so callers only need to hand
 * the resolved tab to a navigation helper.
 */
export default class SectionTabService {
  private static readonly SECTION_TABS: Record<SectionTabKey, SectionTab[]> = {
    bill: [
      {
        label: "POS",
        key: "pos",
        icon: "scan-line",
        redirect: { url: "/pos/billing" },
      },
      {
        label: "Sales",
        key: "sales",
        icon: "chart-line",
        redirect: { url: "/dashboard/sales-overview" },
      },
      {
        label: "Orders",
        key: "orders",
        icon: "shopping-bag",
        redirect: { url: "/dashboard/orders/list" },
      },
      {
        label: "Fulfill",
        key: "fulfill",
        icon: "package-check",
        redirect: { url: "/dashboard/fulfillment/list" },
      },
      {
        label: "Returns",
        key: "returns",
        icon: "undo-2",
        redirect: { url: "/dashboard/fulfillment/vendor-return" },
      },
      {
        label: "Logistics",
        key: "logistics",
        icon: "truck",
        redirect: { url: "/dashboard/delivery/dispatch" },
      },
      {
        label: "Routes",
        key: "routes",
        icon: "route",
        redirect: { url: "/dashboard/delivery/agencies" },
      },
    ],
    business: [
      {
        label: "Customers",
        key: "customers",
        icon: "users",
        redirect: {
          url: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
        },
      },
      {
        label: "Staff",
        key: "staff",
        icon: "id-card",
        redirect: { url: "/dashboard/employee/list" },
      },
      {
        label: "Loyalty",
        key: "loyalty",
        icon: "gift",
        redirect: { url: "/dashboard/points/list" },
      },
      {
        label: "Paylater",
        key: "paylater",
        icon: "credit-card",
        redirect: { url: "/dashboard/paylater" },
      },
      {
        label: "Accounts",
        key: "accounts",
        icon: "wallet",
        redirect: { url: "/dashboard/accounts/summary" },
      },
      {
        label: "Expenses",
        key: "expenses",
        icon: "receipt",
        redirect: { url: "/dashboard/expenses/list" },
      },
      {
        label: "Reports",
        key: "reports",
        icon: "chart-column",
        redirect: { url: "/dashboard/reports" },
      },
    ],
    supply: [
      {
        label: "Supply",
        key: "supply",
        icon: "house",
        redirect: { url: "/dashboard/purchase-order/main" },
      },
      {
        label: "Buy from SK",
        key: "buy-from-sk",
        icon: "layout-grid",
        redirect: { url: "/products/sk" },
      },
      {
        label: "Buy from Network",
        key: "buy-from-network",
        icon: "truck",
        redirect: { url: "/products/main" },
      },
      {
        label: "Purchase Orders",
        key: "purchase-orders",
        icon: "clipboard-list",
        redirect: { url: "/dashboard/purchase-order/summary" },
      },
      {
        // Desktop-only: box-scan receive flow doesn't fit the mobile tab row.
        label: "Receive Stock",
        key: "receive-stock",
        icon: "package-check",
        desktopOnly: true,
        redirect: { url: "/dashboard/purchase-order/box-receive" },
      },
      {
        label: "Vendors",
        key: "vendors",
        icon: "store",
        redirect: { url: "/dashboard/vendor/list" },
      },
    ],
    catalog: [
      {
        label: "My Catalog",
        key: "my-catalog",
        icon: "book-open",
        redirect: { url: "/dashboard/inventory/products/list" },
      },
      {
        label: "Library",
        key: "library",
        icon: "library",
        redirect: { url: "/dashboard/inventory/subscribe/browse-category" },
      },
      {
        label: "Godown",
        key: "godown",
        icon: "warehouse",
        redirect: { url: "/dashboard/inventory/rack-bin" },
      },
      {
        label: "Pricing",
        key: "pricing",
        icon: "tag",
        redirect: { url: "/configs/rsp" },
      },
    ],
  };

  /** Returns the tabs configured for the given section key. */
  static getTabs(key: SectionTabKey): SectionTab[] {
    return SectionTabService.SECTION_TABS[key] ?? [];
  }

  /** Returns a single tab within a section by its tab key, if present. */
  static getTab(key: SectionTabKey, tabKey: string): SectionTab | undefined {
    return SectionTabService.getTabs(key).find((tab) => tab.key === tabKey);
  }
}
