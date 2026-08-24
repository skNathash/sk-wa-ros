// The subscribe (Create My Catalog) chip set and the title resolution built on
// it, shared by the pane chips and the layouts that head those pages.

export interface SubscribeChip {
  /** Matches the `tab` query param the subscribe views navigate with. */
  key: string;
  langKey: string;
  label: string;
  /** Target path + query, minus the `version` suffix (added on tap). */
  path: string;
  /**
   * Route prefixes that belong to this chip. Views reached without the `tab`
   * query param (the bulk upload flows navigate between themselves) still
   * highlight the chip they live under.
   */
  matchPaths?: string[];
}

/** The subscribe (Create My Catalog) views, mirrored from SubscribeTabs. */
export const SUBSCRIBE_CHIPS: SubscribeChip[] = [
  {
    key: "discover",
    langKey: "tabs.discover",
    label: "Discover",
    path: "/dashboard/inventory/subscribe/discover?tab=discover",
    matchPaths: ["/dashboard/inventory/subscribe/discover"],
  },
  {
    key: "search",
    langKey: "tabs.search",
    label: "Add Items",
    path: "/dashboard/inventory/subscribe/search?tab=search",
    // No matchPaths — /search also hosts the "In and Around" chip below, so the
    // `tab` param is what separates the two there.
  },
  {
    key: "un-brands",
    langKey: "tabs.un-brands",
    label: "Un-Branded",
    path: "/dashboard/inventory/subscribe/un-brands?tab=un-brands",
    matchPaths: ["/dashboard/inventory/subscribe/un-brands"],
  },
  {
    key: "top",
    langKey: "tabs.top",
    label: "In and Around",
    path: "/dashboard/inventory/subscribe/search?tab=top&sortType=popular&radiusKms=5",
  },
  {
    key: "categories",
    langKey: "tabs.categories",
    label: "Browse Categories",
    path: "/dashboard/inventory/subscribe/browse-category?tab=categories",
    matchPaths: ["/dashboard/inventory/subscribe/browse-category"],
  },
  {
    key: "brands",
    langKey: "tabs.brands",
    label: "Browse Brands",
    path: "/dashboard/inventory/subscribe/browse-brands?tab=brands",
    matchPaths: ["/dashboard/inventory/subscribe/browse-brands"],
  },
  {
    key: "menus",
    langKey: "tabs.menus",
    label: "Browse Menus",
    path: "/dashboard/inventory/subscribe/menus?tab=menus",
    matchPaths: ["/dashboard/inventory/subscribe/menus"],
  },
  {
    key: "bulk",
    langKey: "tabs.bulk",
    label: "Bulk Upload",
    path: "/dashboard/inventory/subscribe/add-product/bulk?tab=bulk",
    matchPaths: [
      "/dashboard/inventory/subscribe/add-product/bulk",
      "/dashboard/inventory/subscribe/bulk-upload",
    ],
  },
  {
    key: "history",
    langKey: "tabs.history",
    label: "Approval History",
    path: "/dashboard/inventory/subscribe/approval-history/products?tab=history",
    matchPaths: ["/dashboard/inventory/subscribe/approval-history"],
  },
];

/**
 * The chip the current view belongs to. The route the chip lives under wins
 * over the `tab` param: the bulk upload flows hop between their own pages
 * (barcode search, invalid barcodes) without carrying `tab=bulk`, which would
 * otherwise fall back to the default chip.
 */
export const getActiveSubscribeChip = (
  pathname: string,
  tab?: string | null,
): SubscribeChip | undefined => {
  const pathChip = SUBSCRIBE_CHIPS.find((chip) =>
    chip.matchPaths?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ),
  );

  return pathChip ?? SUBSCRIBE_CHIPS.find((chip) => chip.key === tab);
};

/** Chip key driving the pane/tab selection; falls back to the search landing. */
export const getActiveSubscribeChipKey = (
  pathname: string,
  tab?: string | null,
): string => getActiveSubscribeChip(pathname, tab)?.key ?? "search";
