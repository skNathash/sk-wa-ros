import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import { useInventoryStockUpdated } from "~/shared/inventory/events";
import { fetchStockAlertCounts, type StockAlertCounts } from "./helper";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import SellerCatalogService from "~/services/SellerCatalogService";

/** Which set of views the chips navigate over. */
export type InventoryChipType = "catalog" | "dashboard";

interface InventoryChip {
  key: string;
  /** Translation key; omitted when the short label is the point (Fast, OOS). */
  langKey?: string;
  label: string;
  path: string;
  /** Route matched to mark the chip active; defaults to `path`. */
  matchPath?: string;
  /** Only active when the `inactive=true` flag matches this value. */
  inactive?: boolean;
  /**
   * Query params that must match the current URL for the chip to read as
   * active — the dashboard chips all share one route, so `tab`/`view` are what
   * tell them apart. Their defaults mirror the page's own.
   */
  matchParams?: Record<string, string>;
  /** Which stock-health count the chip badges, if any. */
  countKey?: "alerts" | "out-of-stock";
  pathParams?: Record<string, string | boolean>;
  /** Query keys that must be absent for this chip to read as active. */
  absentParams?: string[];
}

/** Defaults the dashboard page falls back to when a param is absent. */
const PARAM_DEFAULTS: Record<string, string> = {
  tab: "overview",
  view: "in_stock",
};

/** The inventory/catalog views, mirrored from the InventoryTab tabs. */
const CATALOG_CHIPS: InventoryChip[] = [
  {
    key: "inventory-dashboard",
    langKey: "overview",
    label: "Overview",
    path: "/dashboard/inventory/dashboard",
    // The dashboard reads `tab` as its own view switch, so it gets the
    // overview view rather than the chip key the other entries pass.
    pathParams: { tab: "overview" },
  },
  {
    key: "products",
    langKey: "allItems",
    label: "All Items",
    path: "/dashboard/inventory/products/list",
    inactive: false,
    // Fast / Slow / OOS also sit on this route, distinguished only by query.
    absentParams: ["velocity", "stockStatus"],
  },
  {
    key: "categories",
    langKey: "byCategory",
    label: "By Category",
    path: "/dashboard/inventory/browse-category",
  },
  {
    key: "brands",
    langKey: "byBrand",
    label: "By Brand",
    path: "/dashboard/inventory/browse-brand",
  },
  {
    key: "bulk-update",
    langKey: "bulkUpdate",
    label: "Bulk Update",
    path: "/dashboard/inventory/bulk-update",
  },
  {
    key: "stock-master",
    langKey: "stockMaster",
    label: "Stock Master",
    path: "/dashboard/inventory/stock-master/list",
  },
  {
    key: "inactive",
    langKey: "inactive",
    label: "Inactive",
    path: "/dashboard/inventory/products/list",
    pathParams: { inactive: true },
    matchPath: "/dashboard/inventory/products/list",
    inactive: true,
  },
];

/**
 * The analytics dashboard's stock-health cuts. These stand in for the "Do
 * Today" alert rows in the dashboard pane, so the two badged chips carry the
 * same counts those rows would have: everything needing attention, and the
 * out-of-stock SKUs behind it.
 */

const movements = SellerCatalogService.getMovementTypes();
const fastMoving = movements.find((movement) => movement.key === "fast-moving");
const slowMoving = movements.find((movement) => movement.key === "slow-moving");

const DASHBOARD_CHIPS: InventoryChip[] = [
  // {
  //   key: "all",
  //   langKey: "all",
  //   label: "All",
  //   path: "/dashboard/inventory/dashboard",
  //   matchParams: { tab: "overview" },
  //   pathParams: { tab: "overview" },
  // },
  // {
  //   key: "alerts",
  //   langKey: "alerts",
  //   label: "Alerts",
  //   path: "/dashboard/inventory/stock-alerts",
  //   countKey: "alerts",
  // },
  {
    key: "fast",
    label: "Fast Moving",
    path: "/dashboard/inventory/products/list",
    matchPath: "/dashboard/inventory/products/list",
    matchParams: { velocity: fastMoving?.value ?? "" },
    pathParams: { velocity: fastMoving?.value ?? "" },
    inactive: false,
  },
  {
    key: "slow",
    label: "Slow Moving",
    path: "/dashboard/inventory/products/list",
    matchPath: "/dashboard/inventory/products/list",
    matchParams: { velocity: slowMoving?.value ?? "" },
    pathParams: { velocity: slowMoving?.value ?? "" },
    inactive: false,
  },
  {
    key: "oos",
    label: "Out of Stock",
    path: "/dashboard/inventory/products/list",
    matchPath: "/dashboard/inventory/products/list",
    matchParams: { stockStatus: "Out of Stock" },
    pathParams: { stockStatus: "Out of Stock" },
    countKey: "out-of-stock",
    inactive: false,
  },
];

const CHIP_SETS: Record<InventoryChipType, InventoryChip[]> = {
  catalog: CATALOG_CHIPS,
  dashboard: DASHBOARD_CHIPS,
};

interface InventoryPaneChipsProps {
  /** Which chip set to render. Defaults to the catalog views. */
  type?: InventoryChipType;
  className?: string;
}

/**
 * Quick-nav chips over the inventory views for the catalog side pane, built on
 * the generic {@link PaneChips}. `type` picks the set — the catalog views by
 * default, or the analytics dashboard's stock-health cuts, which carry the
 * alert counts as badges. The active chip is resolved from the current URL
 * (its `tab`/`view` params and the `inactive=true` flag, which splits the
 * products list between the Products and Inactive chips) and a tap navigates
 * to that view.
 */
const InventoryPaneChips = ({
  type = "catalog",
  className,
}: InventoryPaneChipsProps) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isInactivePage = searchParams.get("inactive") === "true";
  const [counts, setCounts] = useState<StockAlertCounts>({});

  // Only the dashboard set badges its chips, so the counts are fetched only
  // for it. Adding stock clears out-of-stock rows, so re-count on the event.
  const stockToken = useInventoryStockUpdated();
  useEffect(() => {
    if (type !== "dashboard") return;
    const controller = new AbortController();
    let active = true;
    fetchStockAlertCounts(controller.signal).then((data) => {
      if (active) setCounts(data);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [type, stockToken]);

  const chipCount = (chip: InventoryChip) => {
    if (chip.countKey === "alerts") {
      // The Alerts chip stands in for the whole "Do Today" stack, so it badges
      // everything needing attention rather than one cut of it.
      return Object.values(counts).reduce((sum, n) => sum + n, 0);
    }
    return chip.countKey ? counts[chip.countKey] : undefined;
  };

  const data: PaneChipItem[] = [
    ...CHIP_SETS["catalog"],
    ...CHIP_SETS["dashboard"],
  ].map((chip) => {
    const chipPath = (chip.matchPath ?? chip.path).split("?")[0];
    const matched = location.pathname.startsWith(chipPath);
    const paramsMatch = Object.entries(chip.matchParams ?? {}).every(
      ([key, value]) =>
        (searchParams.get(key) || PARAM_DEFAULTS[key]) === value,
    );
    const absentMatch = (chip.absentParams ?? []).every(
      (key) => !searchParams.get(key),
    );
    return {
      key: chip.key,
      label: chip.langKey
        ? t(chip.langKey, { defaultValue: chip.label })
        : chip.label,
      active:
        matched &&
        paramsMatch &&
        absentMatch &&
        (chip.inactive === undefined || chip.inactive === isInactivePage),
      count: chipCount(chip),
      path: chip.path,
      pathParams: chip.pathParams,
    };
  });

  const handleCallback = ({ data: chip }: PaneChipsAction) => {
    if (chip.path) {
      appNav.to(chip.path as string, {
        // Catalog chips without their own params key the tab; filter chips
        // (velocity / stockStatus) only send the query they need so the URL
        // matches the highlight rules above.
        ...(type === "catalog" && !chip.pathParams ? { tab: chip.key } : {}),
        ...(chip.pathParams ?? {}),
      });
    }
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default InventoryPaneChips;
