import SellerCatalogService from "~/services/SellerCatalogService";

/**
 * The three catalogue stages a subscribed SKU moves through — Subscribed →
 * Priced → Stocked. Each number comes from its own endpoint, so a failure on
 * one stage leaves the others readable.
 */
export interface JourneyCounts {
  subscribed: number;
  priced: number;
  stocked: number;
}

export const defaultJourneyCounts: JourneyCounts = {
  subscribed: 0,
  priced: 0,
  stocked: 0,
};

/** Peer radius (km) the price-comparison endpoint needs alongside the type. */
const PRICE_COMPARISON_DISTANCE = 15;

/**
 * Every SKU subscribed from the SK Library — the seller-deal count with no
 * stock or price narrowing, same call the product list uses for its total.
 */
export const getSubscribedCount = async (
  params: Record<string, any> = {},
): Promise<number> => {
  try {
    const response = await SellerCatalogService.getProducts({
      showAllDeals: true,
      ...params,
      outputType: "count",
    });
    return Number(response?.data?.count || 0);
  } catch (error) {
    console.error("Error fetching subscribed count:", error);
    return 0;
  }
};

/**
 * SKUs carrying a selling price of their own. `type=priceSummary` turns the
 * price-comparison endpoint into the aggregate block behind the Manage Price
 * strip; `pricedItems.configuredPrice` is the count of deals priced away from
 * the MRP default.
 */
export const getPricedCount = async (
  params: Record<string, any> = {},
  type: "network" | "customer" = "customer",
): Promise<number> => {
  try {
    const response = await SellerCatalogService.getPriceComparison({
      distance: PRICE_COMPARISON_DISTANCE,
      priceType: type === "network" ? "b2b" : "b2c",
      ...params,
      type: "priceSummary",
    });
    return Number(response?.data?.data?.pricedItems?.configuredPrice || 0);
  } catch (error) {
    console.error("Error fetching priced count:", error);
    return 0;
  }
};

/** SKUs with stock on hand — the product list's "only with stock" filter. */
export const getStockedCount = async (
  params: Record<string, any> = {},
): Promise<number> => {
  try {
    const response = await SellerCatalogService.getProducts({
      showAllDeals: true,
      ...params,
      filter: {
        ...(params.filter || {}),
        availableQuantity: { $gt: 0 },
      },
      outputType: "count",
    });
    return Number(response?.data?.count || 0);
  } catch (error) {
    console.error("Error fetching stocked count:", error);
    return 0;
  }
};

export const getJourneyCounts = async (
  params: Record<string, any> = {},
  type: "network" | "customer" = "customer",
): Promise<JourneyCounts> => {
  const [subscribed, priced, stocked] = await Promise.all([
    getSubscribedCount(params),
    getPricedCount(params, type),
    getStockedCount(params),
  ]);

  return { subscribed, priced, stocked };
};

export type JourneyStepKey = "subscribed" | "priced" | "stocked";

export interface JourneyStep {
  key: JourneyStepKey;
  /** Position in the journey — rendered as the numbered chip. */
  step: number;
  label: string;
  /** What to do next with the SKUs sitting at this stage. */
  nextLabel: string;
  nextPath: string;
  /** Tailwind classes for the numbered chip, the value and the next link. */
  chipClass: string;
  valueClass: string;
  linkClass: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    key: "subscribed",
    step: 1,
    label: "Subscribed",
    nextLabel: "Set price",
    nextPath: "/configs/rsp",
    chipClass: "tw:bg-violet-100 tw:text-violet-700",
    valueClass: "tw:text-violet-600",
    linkClass: "tw:text-violet-600",
  },
  {
    key: "priced",
    step: 2,
    label: "Priced",
    nextLabel: "Add stock",
    nextPath: "/dashboard/inventory/products/list",
    chipClass: "tw:bg-amber-100 tw:text-amber-700",
    valueClass: "tw:text-amber-500",
    linkClass: "tw:text-amber-600",
  },
  {
    key: "stocked",
    step: 3,
    label: "Stocked",
    nextLabel: "View in stock",
    nextPath: "/dashboard/inventory/dashboard?tab=products&view=in_stock",
    chipClass: "tw:bg-sky-100 tw:text-sky-700",
    valueClass: "tw:text-sky-600",
    linkClass: "tw:text-sky-600",
  },
];
