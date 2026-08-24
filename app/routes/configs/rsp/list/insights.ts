import CommonService from "~/services/CommonService";

/**
 * Client-side pricing intelligence for the Manage Price redesign.
 *
 * Everything here is derived from the already-loaded deal list (the same
 * data the table renders) — there is no extra API for margins/HSN coverage,
 * so numbers are computed over the loaded page and fall back to the static
 * design figures when nothing is loaded yet.
 */

/**
 * Aggregate block from
 * `catalog/seller-deals/price-comparison?outputType=summary` — margin figures
 * for the whole catalogue rather than the loaded page.
 */
export interface PriceComparisonSummary {
  totalDeals: number;
  avgMargin: number;
  avgMarginLastWeek: number;
  highMargin: number;
  midMargin: number;
  lowMargin: number;
}

export interface PricingStats {
  /** True when nothing is loaded and the static design figures are shown. */
  isStatic: boolean;
  /** True once the price-comparison summary API has supplied the margins. */
  hasSummary: boolean;
  /** Catalogue-wide deal count from the summary API (0 until it lands). */
  totalDeals: number;
  /** Previous week's average margin — powers the week-over-week delta. */
  avgMarginLastWeek: number;
  totalItems: number;
  pricedItems: number;
  missingMrp: number;
  avgMargin: number;
  highMargin: number; // > 20%
  midMargin: number; // 5–20%
  lowMargin: number; // < 5%
  lowMarginRevisable: number; // < 12% — "consider revising" card
  aboveOnline: number; // priced above the cheapest marketplace listing
}

/** Static figures from the shared designs — used when the API has no data yet. */
export const STATIC_STATS: PricingStats = {
  isStatic: true,
  hasSummary: false,
  totalDeals: 98,
  avgMarginLastWeek: 21.2,
  totalItems: 98,
  pricedItems: 95,
  missingMrp: 3,
  avgMargin: 22.4,
  highMargin: 32,
  midMargin: 55,
  lowMargin: 11,
  lowMarginRevisable: 8,
  aboveOnline: 3,
};

/** Selling price for the active pricing channel. */
export const getSellingPrice = (
  item: any,
  type: "network" | "customer",
): number => (type === "network" ? item?.b2bPrice || 0 : item?.b2cPrice || 0);

/**
 * Realised margin % — (selling − cost) / selling. Returns null when either
 * side is unknown so missing data never reads as a 100% margin.
 */
export const getMarginPct = (
  item: any,
  type: "network" | "customer",
): number | null => {
  const price = getSellingPrice(item, type);
  const cost = item?.purchasePrice || 0;
  if (!price || !cost) return null;
  return ((price - cost) / price) * 100;
};

/** Traffic-light tone for a margin value (matches the HIGH/MID/LOW buckets). */
export const marginTone = (
  margin: number | null,
): "success" | "warning" | "danger" | "muted" => {
  if (margin === null) return "muted";
  if (margin >= 15) return "success";
  if (margin >= 5) return "warning";
  return "danger";
};

/** Cheapest marketplace verdict for a deal (null when no online prices). */
export const getOnlineVerdict = (item: any, type: "network" | "customer") =>
  CommonService.getMarketPriceComparison(
    item?.partnerPriceData,
    getSellingPrice(item, type),
  );

/** JioMart benchmark — looked up in `others`, falling back to `other`. */
export const getJioMartPrice = (item: any): number | null => {
  const p = item?.partnerPriceData;
  if (!p) return null;
  const jio = (p.others || []).find((o: any) => /jio/i.test(o?.name || ""));
  return jio?.price || p.other?.price || null;
};

/** Compute the summary stats over the loaded page; static fallback when empty. */
export const computePricingStats = (
  data: any[],
  totalRecords: number,
  type: "network" | "customer",
): PricingStats => {
  if (!data?.length) return STATIC_STATS;

  const margins = data
    .map((item) => getMarginPct(item, type))
    .filter((m): m is number => m !== null);

  const missingMrp = data.filter((item) => !(item?.mrp > 0)).length;
  const unpriced = data.filter(
    (item) => !(getSellingPrice(item, type) > 0),
  ).length;
  const total = Math.max(totalRecords, data.length);

  const aboveOnline = data.filter(
    (item) => getOnlineVerdict(item, type)?.type === "high",
  ).length;

  return {
    isStatic: false,
    hasSummary: false,
    totalDeals: total,
    avgMarginLastWeek: 0,
    totalItems: total,
    pricedItems: Math.max(total - unpriced, 0),
    missingMrp,
    avgMargin: margins.length
      ? margins.reduce((sum, m) => sum + m, 0) / margins.length
      : 0,
    highMargin: margins.filter((m) => m > 20).length,
    midMargin: margins.filter((m) => m >= 5 && m <= 20).length,
    lowMargin: margins.filter((m) => m < 5).length,
    lowMarginRevisable: margins.filter((m) => m < 12).length,
    aboveOnline,
  };
};

/**
 * Overlay the catalogue-wide summary API on top of the page-derived stats.
 * Margins, bucket counts and the deal total come from the API; MRP
 * coverage and the online-price comparisons stay page-derived (the summary
 * block does not carry them). Returns the base stats untouched when the API
 * gave us nothing.
 */
export const applyPriceSummary = (
  base: PricingStats,
  summary: PriceComparisonSummary | null,
): PricingStats => {
  if (!summary) return base;

  // With no rows loaded the base is the static design block — drop its
  // page-derived figures rather than mixing them with real API numbers.
  const page = base.isStatic
    ? {
        pricedItems: 0,
        missingMrp: 0,
        aboveOnline: 0,
        lowMarginRevisable: 0,
      }
    : base;

  return {
    ...base,
    ...page,
    isStatic: false,
    hasSummary: true,
    totalDeals: summary.totalDeals,
    totalItems: summary.totalDeals || base.totalItems,
    avgMargin: summary.avgMargin,
    avgMarginLastWeek: summary.avgMarginLastWeek,
    highMargin: summary.highMargin,
    midMargin: summary.midMargin,
    lowMargin: summary.lowMargin,
  };
};
