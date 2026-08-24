import InventoryDashboardService from "~/services/InventoryDashboardService";

const num = (value: any) => Number(value) || 0;

export type InventoryStats = {
  /** Subscribed SKU count. */
  totalSKUs: number;
  /** Distinct categories those SKUs sit in. */
  categoryCount: number;
  /** Stock value of the new (non pre-owned) inventory. */
  stockValue: number;
  /** SKUs that have not sold in 30 days but did in 90. */
  slowMovingSKUs: number;
  /** Share of the catalogue those slow movers make up. */
  slowMovingPercentage: number;
  /** Stock value locked up in the slow movers. */
  slowMovingValue: number;
};

export const EMPTY_INVENTORY_STATS: InventoryStats = {
  totalSKUs: 0,
  categoryCount: 0,
  stockValue: 0,
  slowMovingSKUs: 0,
  slowMovingPercentage: 0,
  slowMovingValue: 0,
};

/**
 * Numbers the API does not report yet, kept in one place so they are easy to
 * swap for real endpoints later.
 */
export const HARDCODED = {
  /** Electronics SKUs inside the total — no category-type breakdown endpoint. */
  electronicsSKUs: 5,
  /** Stock-value sub-line, pending an avg-per-SKU field on the value endpoint. */
  stockValueHint: "avg ₹1,452 per SKU · 92 SKUs",
  /** Pre-owned inventory has no endpoint of its own yet. */
  preOwned: {
    value: 64494,
    units: 6,
    marginPct: 30,
    inQc: 3,
  },
};

/**
 * Headline inventory numbers, read from the same endpoints the inventory
 * analytics dashboard runs on. Settled individually so one failing endpoint
 * still leaves the rest of the strip readable.
 */
export const getInventoryStats = async (
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<InventoryStats> => {
  const [totalDealsRes, inventoryValueRes, skuMovementRes, categoryRes] =
    await Promise.allSettled([
      InventoryDashboardService.getTotalDeals(params, { signal }),
      InventoryDashboardService.getInventoryValue(params, { signal }),
      InventoryDashboardService.getSkuMovement(params, { signal }),
      InventoryDashboardService.getInventoryValueByCategory(params, { signal }),
    ]);

  const value = (res: PromiseSettledResult<any>) =>
    res.status === "fulfilled" ? res.value : undefined;

  const stockValue = num(value(inventoryValueRes)?.data?.data?.inventoryValue);
  const movement = value(skuMovementRes)?.data?.data || {};
  const categories = value(categoryRes)?.data?.data;

  const slow = num(movement.slow?.count);
  const total =
    num(movement.total) ||
    slow + num(movement.fast?.count) + num(movement.nonMoving?.count);
  const slowPercentage =
    movement.slow?.percentage ??
    (total > 0 ? Number(((slow / total) * 100).toFixed(2)) : 0);

  return {
    totalSKUs: num(value(totalDealsRes)?.data?.data),
    categoryCount: Array.isArray(categories) ? categories.length : 0,
    stockValue,
    slowMovingSKUs: slow,
    slowMovingPercentage: num(slowPercentage),
    // The movement endpoint only carries a value on newer builds; fall back to
    // the slow movers' share of the total stock value.
    slowMovingValue:
      num(movement.slow?.value) ||
      Math.round((stockValue * num(slowPercentage)) / 100),
  };
};
