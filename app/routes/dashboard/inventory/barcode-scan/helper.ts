import { orderBy } from "lodash";

import type { ScanResolveSummaryProps } from "~/shared/inventory/subscribe-scan/components/ScanResolveSummary";

/** Phases of the scan journey — drives the gamified step tracker + screens. */
export type ScanPhase =
  | "idle" // nothing scanned yet
  | "skSearching" // looking up the SK Library (searchInSk)
  | "matched" // found in matchedSkDeals
  | "aiSearching" // asking StoreKing AI (searchInAi)
  | "suggestions" // skSuggestedDeals / aiSuggestedDeals available
  | "notFound"; // nothing anywhere

export type SortKey = "relevance" | "mrp_asc" | "mrp_desc";

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "relevance", label: "Best match" },
  { key: "mrp_asc", label: "MRP: Low to High" },
  { key: "mrp_desc", label: "MRP: High to Low" },
];

/** Product extracted by StoreKing AI (see product-extractor ai-search response). */
export interface AiSuggestedProduct {
  name: string;
  description?: string;
  mrp?: number;
  tax?: number;
  hsnNumber?: string;
  companyName?: string;
  brandName?: string;
  categoryName?: string;
  parentCategoryName?: string;
  barcodes: string[];
  packagingType?: string;
  packSize?: number;
  uom?: string;
  isVegetarian?: boolean;
  originCountry?: string;
  highlights: string[];
  itemForm?: string;
  productSize?: string;
  // Cache id for the AI-extracted product — passed through to the create payload
  // so the backend can correlate the created item with its AI extraction.
  aiCacheId?: string;
  // Absolute image URLs from an external origin (e.g. the brand's CDN). They
  // must be rendered through the image proxy, not as catalog asset ids.
  images: string[];
  // The untouched AI extraction. The card renders from the flattened fields
  // above, but AiExtractedDetailsModal reads the raw nested shape
  // (applicableBrand, csaAttr, highlights, …) when creating the request.
  raw: any;
}

export const formatAiSuggestions = (raw: any[]): AiSuggestedProduct[] =>
  (raw || [])
    .filter((p: any) => p?.name)
    .map((p: any) => ({
      name: p.name,
      description: p.description || "",
      mrp: typeof p.mrp === "number" ? p.mrp : Number(p.mrp) || undefined,
      tax: p.tax,
      hsnNumber: p.hsnNumber || "",
      companyName: p.companyName || "",
      brandName: p.applicableBrand?.brandName || "",
      categoryName: p.applicableCategory?.categoryName || "",
      parentCategoryName: p.applicableParentCategory?.categoryName || "",
      barcodes: p.barcodes || [],
      packagingType: p.packagingType || "",
      packSize: p.packSize,
      uom: p.uom || "",
      isVegetarian: p.isVegetarian,
      originCountry: p.originCountry || "",
      highlights: p.highlights || [],
      itemForm: p.itemForm || "",
      productSize: p.productSize || "",
      aiCacheId: p.aiCacheId,
      images: Array.isArray(p.images) ? p.images : [],
      raw: p,
    }));

/** Pre-fill payload for AddProductModal from an AI-extracted product. */
export const buildProductPrefill = (
  ai: AiSuggestedProduct | null,
  fallbackBarcode?: string | null,
) => ({
  barcode: ai?.barcodes?.[0] || fallbackBarcode || "",
  name: ai?.name || "",
  description: ai?.description || "",
  mrp: ai?.mrp ?? "",
  uom: ai?.uom || "",
  brandName: ai?.brandName || "",
  hsn: ai?.hsnNumber || "",
  gst: ai?.tax ?? "",
  // Pre-fill the AI-extracted images. These are absolute external URLs, so the
  // modal renders them through the image proxy (it detects the http(s) prefix).
  images: ai?.images || [],
});

/**
 * Tag each formatted deal with its API position so "Best match" sorting can
 * restore the server's relevance order after MRP sorts.
 */
export const withRelevance = <T extends Record<string, any>>(deals: T[]) =>
  deals.map((d, i) => ({ ...d, _relevance: i }));

/** Unique chips (with counts) for a given facet of skSuggestedDeals. */
const getFacetOptions = <T>(deals: T[], pick: (d: T) => string | undefined) => {
  const counts = new Map<string, number>();
  deals.forEach((d) => {
    const name = pick(d)?.trim();
    if (!name) return;
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  return Array.from(counts, ([name, count]) => ({ name, count }));
};

/** Unique brand chips (with counts) derived from skSuggestedDeals. */
export const getBrandOptions = (deals: Array<{ brand?: { name?: string } }>) =>
  getFacetOptions(deals, (d) => d.brand?.name);

/** Unique category chips (with counts) derived from skSuggestedDeals. */
export const getCategoryOptions = (
  deals: Array<{ category?: { name?: string } }>,
) => getFacetOptions(deals, (d) => d.category?.name);

/** Active filter selections for skSuggestedDeals. */
export interface DealFilters {
  brand: string | null;
  category: string | null;
}

/** Client-side filter + sort (lodash orderBy) for skSuggestedDeals. */
export const filterAndSortDeals = <
  T extends {
    brand?: { name?: string };
    category?: { name?: string };
    mrp?: number;
    _relevance?: number;
  },
>(
  deals: T[],
  filters: DealFilters,
  sortKey: SortKey,
): T[] => {
  const { brand, category } = filters;
  const filtered = deals.filter(
    (d) =>
      (!brand || d.brand?.name === brand) &&
      (!category || d.category?.name === category),
  );

  switch (sortKey) {
    case "mrp_asc":
      return orderBy(filtered, [(d) => Number(d.mrp) || 0], ["asc"]);
    case "mrp_desc":
      return orderBy(filtered, [(d) => Number(d.mrp) || 0], ["desc"]);
    default:
      return orderBy(filtered, [(d) => d._relevance ?? 0], ["asc"]);
  }
};

/** Step tracker position for each phase, reused by the resolve summary. */
const STEP_LABEL: Record<ScanPhase, { step: number; label: string }> = {
  idle: { step: 1, label: "Scan" },
  skSearching: { step: 2, label: "Resolve" },
  aiSearching: { step: 2, label: "Resolve" },
  matched: { step: 3, label: "Review" },
  suggestions: { step: 3, label: "Review" },
  notFound: { step: 2, label: "Resolve" },
};

/** The whole scan result, handed over untouched. */
export interface ScanResolveResult {
  phase: ScanPhase;
  barcode: string | null;
  matchedDeals: Array<{ isSubscribed?: boolean }>;
  skSuggested: Array<{ isSubscribed?: boolean }>;
  aiSuggested: AiSuggestedProduct[];
}

/**
 * Turn a live single-scan result into the counts + copy the shared
 * ScanResolveSummary panel renders.
 */
export const buildScanResolveSummary = ({
  phase,
  barcode,
  matchedDeals,
  skSuggested,
  aiSuggested,
}: ScanResolveResult): ScanResolveSummaryProps => {
  const skMatch = matchedDeals.length;
  const skTotal = skMatch + skSuggested.length;
  const skAi = aiSuggested.length;
  const total = skTotal + skAi;

  // Already in the seller's own catalog — subscribing again is a no-op, so
  // these are called out separately from the fresh catalog hits.
  const yours = [...matchedDeals, ...skSuggested].filter(
    (d) => d.isSubscribed,
  ).length;

  const code = barcode || "this code";
  let title = `Reading ${code}`;
  if (phase === "skSearching") title = `Matching ${code} in SK Library`;
  else if (phase === "aiSearching") title = `No SK Library hit — asking SK AI`;
  else if (phase === "matched")
    title = `${skMatch} exact ${skMatch === 1 ? "match" : "matches"} in SK Library`;
  else if (phase === "suggestions")
    title = `${total} ${total === 1 ? "product" : "products"} found for ${code}`;
  else if (phase === "notFound") title = `No match anywhere for ${code}`;

  const { step, label } = STEP_LABEL[phase];

  return {
    eyebrow: `Step ${step} · ${label}`,
    title,
    sk: { count: skTotal, live: phase === "skSearching" },
    ai: {
      count: skAi,
      live: phase === "aiSearching",
      // The AI leg only runs when the library came back empty.
      ran:
        phase === "aiSearching" ||
        phase === "suggestions" ||
        phase === "notFound",
    },
    yours,
  };
};
