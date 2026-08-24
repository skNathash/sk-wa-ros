import { isLooseStockUom, type FastMovingProduct } from "../../helper";
import {
  MOVERS_PATH,
  getAvatarColor,
  getAvatarLabel,
} from "../fast-movers/helper";

export { MOVERS_PATH };

export const SLOW_MOVERS_QUERY = { tab: "products", view: "slow_moving" };

/**
 * Whole days since the last sale, or `null` when the SKU has never sold — the
 * row then reads "Last sold —", which is the worst case, not a missing one.
 */
export const getDaysSinceSale = (lastOrderDate?: string | null) => {
  if (!lastOrderDate) return null;
  const sold = new Date(lastOrderDate).getTime();
  if (Number.isNaN(sold)) return null;
  return Math.max(Math.floor((Date.now() - sold) / 86400000), 0);
};

export const getLastSoldLabel = (lastOrderDate?: string | null) => {
  const days = getDaysSinceSale(lastOrderDate);
  if (days === null) return "Last sold —";
  if (days === 0) return "Last sold today";
  return `Last sold ${days}d ago`;
};

/**
 * Tied-up value and the suggested action. Neither is on the movement feed — it
 * carries units, not landed cost, and the action is a merchandising call no
 * endpoint makes yet — so both are placeholders; the product, last-sold date and
 * stock beside them are live data.
 */
export interface SlowMoverStat {
  tiedUp: number;
  remark: string;
}

export const SLOW_MOVER_STATS: SlowMoverStat[] = [
  { tiedUp: 1020, remark: "Discount 8% or delist" },
  { tiedUp: 1160, remark: "Bundle with Chai" },
  { tiedUp: 1364, remark: "Move to checkout counter" },
  { tiedUp: 0, remark: "Delist · returned zero margin" },
  { tiedUp: 22000, remark: "Push on CLUB · high-value" },
];

export const getSlowMoverStat = (index: number): SlowMoverStat =>
  SLOW_MOVER_STATS[index % SLOW_MOVER_STATS.length];

/** Headline figure — what the rows on screen add up to. */
export const getTiedUpTotal = (count: number) =>
  Array.from({ length: count }, (_, i) => getSlowMoverStat(i).tiedUp).reduce(
    (sum, value) => sum + value,
    0,
  );

/** A movement-feed row with everything the list renders already worked out. */
export interface SlowMoverRow extends FastMovingProduct {
  _key: string;
  _avatarColor: string;
  _avatarLabel: string;
  _lastSoldLabel: string;
  _stockQty: number;
  _isLooseQty: boolean;
  _tiedUp: number;
  _remark: string;
}

/**
 * Turn the raw movement feed into rows the list can render straight out —
 * avatar, last-sold copy, stock and the (placeholder) tied-up figures.
 *
 * Done once here rather than per-cell in the JSX so the row markup is pure
 * markup.
 */
export const prepareSlowMoverRows = (
  products: FastMovingProduct[],
): SlowMoverRow[] =>
  products.map((product, index) => {
    const stat = getSlowMoverStat(index);

    return {
      ...product,
      _key: String(product.dealId || index),
      _avatarColor: getAvatarColor(product.dealName),
      _avatarLabel: getAvatarLabel(product.dealName),
      _lastSoldLabel: getLastSoldLabel(product.lastOrderDate),
      _stockQty: product.availableQuantity ?? 0,
      _isLooseQty: isLooseStockUom(product.selectedStockUom),
      _tiedUp: stat.tiedUp,
      _remark: stat.remark,
    };
  });
