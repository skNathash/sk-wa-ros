import type { AiSuggestedProduct } from "../../helper";
import type { MatchedDealData } from "../matched-deal/MatchedDeal";

/** Which system produced the row. */
export type ResultSource = "sk" | "ai";

/** Chip value — "all" is the unfiltered view, "mine" shows already subscribed items. */
export type ResultFilter = "all" | "sk" | "ai" | "mine";

/**
 * One row of the unified results table. Both an SK Library deal and an
 * AI extraction normalize to this, so the table renders a single list and the
 * chips only have to filter it.
 */
export interface ScanResultRow {
  key: string;
  source: ResultSource;
  /** Already in the seller's own catalog — "My Items". */
  mine: boolean;
  /** Exact barcode hit in the SK library (vs. a near/similar match). */
  exact: boolean;
  name: string;
  /** First image — an asset id for SK rows, an absolute URL for AI rows. */
  image?: string;
  images: string[];
  /** AI images are external URLs and must go through the image proxy. */
  useProxy: boolean;
  dealId?: string;
  brandName?: string;
  categoryName?: string;
  mrp?: number;
  /** Selling price — SK rows only, and only shown when it beats the MRP. */
  price?: number;
  /** Pack size / net weight line, when the source gives one. */
  packing?: string;
  /** Detail page for the row, empty on AI rows which have nothing to open. */
  href: string;
  /** Present on SK rows — carries the subscribe state and ids. */
  deal?: MatchedDealData;
  /** Present on AI rows — handed back to the create flow untouched. */
  ai?: AiSuggestedProduct;
}

const skRow = (deal: MatchedDealData, exact: boolean): ScanResultRow => ({
  key: `sk-${deal._id}`,
  source: "sk",
  mine: !!deal.isSubscribed,
  exact,
  name: deal.name,
  image: deal.images?.[0],
  images: deal.images || [],
  useProxy: false,
  dealId: deal.dealId,
  brandName: deal.brand?.name,
  categoryName: deal.category?.name,
  mrp: deal.mrp,
  price: deal.price,
  packing: deal.netWeight,
  // A subscribed deal already lives in the seller's own catalog, so it opens
  // there instead of on the network catalog page.
  href: deal.isSubscribed
    ? `/dashboard/inventory/products/view/${deal._id}`
    : `/dashboard/inventory/subscribe/product-detail/${deal._id}`,
  deal,
});

const aiRow = (product: AiSuggestedProduct, index: number): ScanResultRow => ({
  // AI extractions have no id of their own, so the barcode (or the position)
  // keys the row.
  key: `ai-${product.barcodes?.[0] || index}`,
  source: "ai",
  // Nothing AI-found exists in the catalog yet, so it can never be "mine".
  mine: false,
  exact: false,
  name: product.name,
  image: product.images?.[0],
  images: product.images || [],
  useProxy: true,
  brandName: product.brandName,
  categoryName: product.categoryName,
  mrp: product.mrp,
  packing: [product.productSize, product.packagingType]
    .filter(Boolean)
    .join(" · "),
  href: "",
  ai: product,
});

/**
 * Flatten the whole scan result into one list: SK AI suggestions first, then
 * exact SK Library matches, then near matches from the SK Library.
 */
export const buildResultRows = (result: {
  matchedDeals: MatchedDealData[];
  skSuggested: MatchedDealData[];
  aiSuggested: AiSuggestedProduct[];
}): ScanResultRow[] => [
  ...(result.aiSuggested || []).map(aiRow),
  ...(result.matchedDeals || []).map((d) => skRow(d, true)),
  ...(result.skSuggested || []).map((d) => skRow(d, false)),
];

export const matchesResultFilter = (
  row: ScanResultRow,
  filter: ResultFilter,
): boolean => {
  if (filter === "all") return true;
  if (filter === "mine") return row.mine;
  return row.source === filter;
};

/** One brand/category option with its live count. */
export interface ResultFacetOption {
  name: string;
  count: number;
}

/** Selected brand/category, both null when the facets are untouched. */
export interface ResultFacetValue {
  brand: string | null;
  category: string | null;
}

export const EMPTY_FACETS: ResultFacetValue = { brand: null, category: null };

/** Unique named values for one field, in first-seen order, with counts. */
const collectFacet = (
  rows: ScanResultRow[],
  pick: (row: ScanResultRow) => string | undefined,
): ResultFacetOption[] => {
  const map = new Map<string, ResultFacetOption>();
  for (const row of rows) {
    const name = pick(row)?.trim();
    if (!name) continue;
    const existing = map.get(name);
    if (existing) existing.count += 1;
    else map.set(name, { name, count: 1 });
  }
  return Array.from(map.values());
};

/**
 * Brand and category options for the rows currently in view. AI rows carry
 * names only (no ids), so the name is the key on both sources.
 */
export const getResultFacets = (rows: ScanResultRow[]) => ({
  brands: collectFacet(rows, (r) => r.brandName),
  categories: collectFacet(rows, (r) => r.categoryName),
});

export const matchesResultFacets = (
  row: ScanResultRow,
  value: ResultFacetValue,
): boolean => {
  if (value.brand && row.brandName?.trim() !== value.brand) return false;
  if (value.category && row.categoryName?.trim() !== value.category)
    return false;
  return true;
};

export interface ResultChip {
  key: ResultFilter;
  label: string;
  count: number;
}

/** Chip list with live counts — always all four, so the tabs never jump. */
export const getResultChips = (rows: ScanResultRow[]): ResultChip[] => [
  { key: "all", label: "All", count: rows.length },
  {
    key: "sk",
    label: "SK Library",
    count: rows.filter((r) => r.source === "sk").length,
  },
  {
    key: "ai",
    label: "SK AI",
    count: rows.filter((r) => r.source === "ai").length,
  },
  { key: "mine", label: "Subscribed", count: rows.filter((r) => r.mine).length },
];
