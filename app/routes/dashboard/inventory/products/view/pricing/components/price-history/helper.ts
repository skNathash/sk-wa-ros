/** Which price series the history is tracking. */
export type PriceTarget = "network" | "customer";

/** One week's prices as returned by the API. */
export interface PriceHistoryWeek {
  label: string;
  at: string;
  mrp: number;
  customerPrice: number;
  networkPrice: number;
}

/** Price history payload — `GET catalog/seller-deals/{dealId}/price-history`. */
export interface PriceHistory {
  success?: boolean;
  sellerDealObjId?: string;
  dealId?: string;
  dealRefId?: string;
  dealName?: string;
  action?: string;
  priceTarget?: PriceTarget;
  weeks?: number;
  current?: {
    mrp: number;
    customerPrice: number;
    networkPrice: number;
  };
  weekly?: PriceHistoryWeek[];
  totalEntries?: number;
}

/** One plotted week — what the chart actually renders. */
export type PricePoint = {
  key: string;
  /** Price for that week; 0 when the week has no recorded price. */
  value: number;
  /** "6 wks ago" … "1 wk ago" … "today". */
  label: string;
};

/** Read the price the chart is tracking out of a weekly entry. */
const readPrice = (
  week: Pick<PriceHistoryWeek, "customerPrice" | "networkPrice">,
  target: PriceTarget,
) => (target === "customer" ? week.customerPrice : week.networkPrice);

/**
 * Flatten the weekly series into plottable points, oldest first — the API
 * already returns them in that order with their own labels.
 */
export const normalizePriceHistory = (
  data: PriceHistory | null | undefined,
  target: PriceTarget = "network",
): PricePoint[] =>
  (data?.weekly || []).map((week, index) => ({
    key: week.at || week.label || String(index),
    value: Number(readPrice(week, target)) || 0,
    label: week.label || "",
  }));

/**
 * Bar heights are scaled between the cheapest and dearest week rather than from
 * zero — week-on-week price moves are small, and a zero baseline flattens them
 * into an unreadable straight line.
 */
export const getBarHeight = (value: number, min: number, max: number) => {
  const MIN_HEIGHT = 8;
  const MAX_HEIGHT = 22;
  if (!value || max <= min) return MIN_HEIGHT;
  return MIN_HEIGHT + ((value - min) / (max - min)) * (MAX_HEIGHT - MIN_HEIGHT);
};
