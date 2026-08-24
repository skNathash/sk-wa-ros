import InventoryDashboardService from "~/services/InventoryDashboardService";
import SellerCatalogService from "~/services/SellerCatalogService";

/** The stock-health counts behind the dashboard chips, keyed by alert. */
export type StockAlertCounts = Record<string, number>;

const num = (value: any) => Number(value) || 0;

/**
 * Fetch the five stock-health counts that badge the dashboard chips.
 * Out-of-stock / slow-moving / non-moving / near-expiry come from the
 * inventory dashboard endpoints (the same ones the analytics dashboard uses);
 * there is no dashboard endpoint for expired, so that one comes from the
 * seller-deal analytics summary — which also backs the products-list summary
 * cards.
 */
export const fetchStockAlertCounts = async (
  signal?: AbortSignal,
): Promise<StockAlertCounts> => {
  const [outOfStockRes, skuMovementRes, expiryRiskRes, analyticsRes] =
    await Promise.allSettled([
      InventoryDashboardService.getOutOfStockSkus({}, { signal }),
      InventoryDashboardService.getSkuMovement({}, { signal }),
      InventoryDashboardService.getInventoryRisk(
        "expiryRisk",
        { outputType: "count" },
        { signal },
      ),
      SellerCatalogService.getInventoryAnalytics({}),
    ]);

  const value = (res: PromiseSettledResult<any>) =>
    res.status === "fulfilled" ? res.value : undefined;

  const analytics = value(analyticsRes)?.data?.data || {};
  const skuMovement = value(skuMovementRes)?.data?.data || {};

  return {
    "out-of-stock": num(value(outOfStockRes)?.data?.data),
    "slow-moving": num(skuMovement?.slow?.count),
    "non-moving": num(skuMovement?.nonMoving?.count),
    "near-expiry": num(value(expiryRiskRes)?.data?.count),
    expired: num(analytics.expiredDeals),
  };
};
