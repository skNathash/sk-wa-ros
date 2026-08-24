import {
  CalendarClock,
  IndianRupee,
  PackageX,
  PackagePlus,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import SellerCatalogService from "~/services/SellerCatalogService";

/** The five gaps the strip reports on, in the order they deserve attention. */
export type AttentionKey =
  | "no-price"
  | "no-stock"
  | "near-expiry"
  | "slow-movers"
  | "out-of-stock";

export type AttentionCounts = Record<AttentionKey, number>;

export const EMPTY_ATTENTION_COUNTS: AttentionCounts = {
  "no-price": 0,
  "no-stock": 0,
  "near-expiry": 0,
  "slow-movers": 0,
  "out-of-stock": 0,
};

/** Peer radius (km) the price-comparison endpoint needs alongside the type. */
const PRICE_COMPARISON_DISTANCE = 15;

const num = (value: any) => Number(value) || 0;

/**
 * Subscribed SKUs still without a selling price of their own.
 *
 * `type=priceSummary` turns the price-comparison endpoint into the aggregate
 * block behind the Manage Price strip; the gap is whatever is left once the
 * configured prices are taken off the total. The API sends `notPriced` on
 * newer builds — use it when present so the two numbers can never disagree.
 */
export const getNoPriceCount = async (
  params: Record<string, any> = {},
  type: "network" | "customer" = "customer",
  config?: { signal?: AbortSignal },
): Promise<number> => {
  try {
    const response = await SellerCatalogService.getPriceComparison(
      {
        distance: PRICE_COMPARISON_DISTANCE,
        priceType: type === "network" ? "b2b" : "b2c",
        ...params,
        type: "priceSummary",
      },
      config,
    );
    const priced = response?.data?.data?.pricedItems || {};
    if (priced.notPriced !== undefined) return num(priced.notPriced);
    return Math.max(num(priced.totalDeals) - num(priced.configuredPrice), 0);
  } catch (error) {
    console.error("Error fetching no-price count:", error);
    return 0;
  }
};

/**
 * SKUs sitting at zero on hand — the products list's "Out of Stock" status
 * filter, which the filter service turns into `quantity: { $lte: 0 }`. Counts
 * the deals that never got their opening stock as well as the ones that ran
 * out, which is exactly the "add stock" queue.
 */
export const getNoStockCount = async (
  params: Record<string, any> = {},
  config?: { signal?: AbortSignal },
): Promise<number> => {
  try {
    const response = await SellerCatalogService.getProducts(
      {
        showAllDeals: true,
        ...params,
        filter: {
          ...(params.filter || {}),
          quantity: { $lte: 0 },
        },
        outputType: "count",
      },
      { showOutOfStock: true },
      config,
    );
    return num(response?.data?.count);
  } catch (error) {
    console.error("Error fetching no-stock count:", error);
    return 0;
  }
};

/**
 * Near expiry / slow movers / out of stock, read from the same inventory
 * dashboard endpoints the analytics dashboard runs on. Settled individually so
 * one failing endpoint leaves the rest of the strip readable.
 */
const getStockHealthCounts = async (
  params: Record<string, any> = {},
  signal?: AbortSignal,
) => {
  const [expiryRes, movementRes, outOfStockRes] = await Promise.allSettled([
    InventoryDashboardService.getInventoryRisk(
      "expiryRisk",
      { ...params, outputType: "count" },
      { signal },
    ),
    InventoryDashboardService.getSkuMovement(params, { signal }),
    InventoryDashboardService.getOutOfStockSkus(params, { signal }),
  ]);

  const value = (res: PromiseSettledResult<any>) =>
    res.status === "fulfilled" ? res.value : undefined;

  return {
    "near-expiry": num(value(expiryRes)?.data?.count),
    "slow-movers": num(value(movementRes)?.data?.data?.slow?.count),
    "out-of-stock": num(value(outOfStockRes)?.data?.data),
  };
};

/** Every count behind the strip, fetched in one pass. */
export const getAttentionCounts = async (
  params: Record<string, any> = {},
  type: "network" | "customer" = "customer",
  signal?: AbortSignal,
): Promise<AttentionCounts> => {
  const [noPrice, noStock, health] = await Promise.all([
    getNoPriceCount(params, type, { signal }),
    getNoStockCount(params, { signal }),
    getStockHealthCounts(params, signal),
  ]);

  return {
    "no-price": noPrice,
    "no-stock": noStock,
    ...health,
  };
};

export type AttentionTone = "violet" | "amber" | "orange" | "slate" | "red";

export interface AttentionToneStyle {
  /** Square badge carrying the severity glyph. */
  badge: string;
  /** The count itself. */
  value: string;
  /** Pill action button. */
  action: string;
  /** Left edge marking the card while hovered. */
  hover: string;
}

// Hues follow the inventory convention used elsewhere (journey strip, stock
// alerts): pricing violet, stock-entry amber, expiry orange, slow-moving
// neutral slate, out of stock red.
export const ATTENTION_TONE: Record<AttentionTone, AttentionToneStyle> = {
  violet: {
    badge: "tw:bg-violet-600 tw:text-white",
    value: "tw:text-violet-600",
    action:
      "tw:bg-violet-50 tw:text-violet-700 tw:hover:bg-violet-100 tw:ring-violet-100",
    hover: "tw:hover:bg-violet-50/40",
  },
  amber: {
    badge: "tw:bg-amber-500 tw:text-white",
    value: "tw:text-amber-500",
    action:
      "tw:bg-amber-50 tw:text-amber-700 tw:hover:bg-amber-100 tw:ring-amber-100",
    hover: "tw:hover:bg-amber-50/40",
  },
  orange: {
    badge: "tw:bg-orange-500 tw:text-white",
    value: "tw:text-orange-600",
    action:
      "tw:bg-orange-50 tw:text-orange-700 tw:hover:bg-orange-100 tw:ring-orange-100",
    hover: "tw:hover:bg-orange-50/40",
  },
  slate: {
    badge: "tw:bg-slate-500 tw:text-white",
    value: "tw:text-slate-600",
    action:
      "tw:bg-slate-100 tw:text-slate-700 tw:hover:bg-slate-200 tw:ring-slate-200",
    hover: "tw:hover:bg-slate-50",
  },
  red: {
    badge: "tw:bg-red-600 tw:text-white",
    value: "tw:text-red-600",
    action: "tw:bg-red-50 tw:text-red-700 tw:hover:bg-red-100 tw:ring-red-100",
    hover: "tw:hover:bg-red-50/40",
  },
};

export interface AttentionTask {
  key: AttentionKey;
  title: string;
  /** Why it matters · what to do about it. */
  hint: string;
  /** Pill label — the action that clears the gap. */
  actionLabel: string;
  /** Where the card lands when nothing handles it. */
  path: string;
  /** Query applied alongside {@link path}. */
  query?: Record<string, string>;
  tone: AttentionTone;
  icon: LucideIcon;
}

const PRODUCTS_DASHBOARD = "/dashboard/inventory/dashboard";

export const ATTENTION_TASKS: AttentionTask[] = [
  {
    key: "no-price",
    title: "No price set",
    hint: "Freshly subscribed · configure MRP + buy price",
    actionLabel: "Set price",
    path: "/configs/rsp",
    tone: "violet",
    icon: IndianRupee,
  },
  {
    key: "no-stock",
    title: "No stock added",
    hint: "Priced but empty · add opening stock",
    actionLabel: "Add stock",
    path: "/dashboard/inventory/products/list",
    query: { stockStatus: "Out of Stock" },
    tone: "amber",
    icon: PackagePlus,
  },
  {
    key: "near-expiry",
    title: "Near expiry",
    hint: "< 30 days to expiry · discount or return",
    actionLabel: "Discount",
    path: PRODUCTS_DASHBOARD,
    query: { tab: "products", view: "near_expiry" },
    tone: "orange",
    icon: CalendarClock,
  },
  {
    key: "slow-movers",
    title: "Slow movers",
    hint: "0-3 sales in 14 days · consider promotion",
    actionLabel: "Review",
    path: PRODUCTS_DASHBOARD,
    query: { tab: "products", view: "slow_moving" },
    tone: "slate",
    icon: TrendingDown,
  },
  {
    key: "out-of-stock",
    title: "Out of stock",
    hint: "Zero on hand · reorder now",
    actionLabel: "Reorder",
    path: PRODUCTS_DASHBOARD,
    query: { tab: "products", view: "out_of_stock" },
    tone: "red",
    icon: PackageX,
  },
];
