import InventoryDashboardService from "~/services/InventoryDashboardService";
import { isLooseStockUom, type InventoryRiskItem } from "../../helper";
import { getAvatarColor, getAvatarLabel } from "../fast-movers/helper";

/** Where the block lands — this very dashboard, on the Near Expiry view. */
export const NEAR_EXPIRY_PATH = "/dashboard/inventory/dashboard";

export const NEAR_EXPIRY_QUERY = { tab: "products", view: "near_expiry" };

/**
 * The SKUs closest to their expiry date, off the same `expiryRisk` feed the
 * Near Expiry product tab reads — so the block and the tab it opens can never
 * disagree.
 *
 * Never throws: the block is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the dashboard down.
 */
export const getNearExpiryItems = async (
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<InventoryRiskItem[]> => {
  try {
    const response = await InventoryDashboardService.getInventoryRisk(
      "expiryRisk",
      {
        page: 1,
        count,
        matchFilter: {},
        sort: { stockQty: 1 },
        ...params,
      },
      { signal },
    );
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching near expiry items:", error);
    return [];
  }
};

/**
 * Days left and the suggested action. Neither is on the risk feed — it carries
 * stock and product identity, not batch expiry dates, and the action is a
 * merchandising call no endpoint makes yet — so both are placeholders; the
 * product and stock beside them are live data.
 */
export interface NearExpiryStat {
  daysLeft: number;
  remark: string;
  /** Close enough to expiry that the row needs a warning glyph. */
  urgent?: boolean;
}

export const NEAR_EXPIRY_STATS: NearExpiryStat[] = [
  { daysLeft: 13, remark: "Bundle · 10% off" },
  { daysLeft: 8, remark: "Front shelf · discount 15%" },
  { daysLeft: 3, remark: "Move to POS counter · 25% off", urgent: true },
  { daysLeft: 21, remark: "Push via CLUB app" },
  { daysLeft: 5, remark: "Flash deal · 20% off", urgent: true },
  { daysLeft: 17, remark: "Bundle with staples" },
  { daysLeft: 2, remark: "Clear today · 30% off", urgent: true },
  { daysLeft: 26, remark: "Watch · reorder on hold" },
  { daysLeft: 11, remark: "Combo with tea pack" },
  { daysLeft: 6, remark: "Front shelf · discount 20%", urgent: true },
];

export const getNearExpiryStat = (index: number): NearExpiryStat =>
  NEAR_EXPIRY_STATS[index % NEAR_EXPIRY_STATS.length];

/** Below a week the row turns red — that is the write-off window. */
export const isCritical = (daysLeft: number) => daysLeft <= 7;

/**
 * The expiry date the row shows, derived from the placeholder days-left so the
 * date and the countdown beside it always agree.
 */
export const getExpiryDate = (daysLeft: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysLeft);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** A risk-feed row with everything the list renders already worked out. */
export interface NearExpiryRow extends InventoryRiskItem {
  _key: string;
  _avatarColor: string;
  _avatarLabel: string;
  _stockQty: number;
  _isLooseQty: boolean;
  _daysLeft: number;
  _expiryDate: string;
  _critical: boolean;
  _urgent: boolean;
  _remark: string;
}

/**
 * Turn the raw expiry-risk feed into rows the list can render straight out —
 * avatar, stock and the (placeholder) countdown, date and action.
 *
 * Done once here rather than per-cell in the JSX, where the date was being
 * rebuilt on every render.
 */
export const prepareNearExpiryRows = (
  items: InventoryRiskItem[],
): NearExpiryRow[] =>
  items.map((product, index) => {
    const stat = getNearExpiryStat(index);

    return {
      ...product,
      _key: String(product.dealId || index),
      _avatarColor: getAvatarColor(product.dealName),
      _avatarLabel: getAvatarLabel(product.dealName),
      _stockQty: product.stockQty ?? 0,
      _isLooseQty: isLooseStockUom(product.selectedStockUom),
      _daysLeft: stat.daysLeft,
      _expiryDate: getExpiryDate(stat.daysLeft),
      _critical: isCritical(stat.daysLeft),
      _urgent: Boolean(stat.urgent),
      _remark: stat.remark,
    };
  });
