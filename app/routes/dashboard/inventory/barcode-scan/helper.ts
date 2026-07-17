import { orderBy } from "lodash";

/** Phases of the scan journey — drives the gamified step tracker + screens. */
export type ScanPhase =
  | "idle" // nothing scanned yet
  | "skSearching" // looking up the StoreKing catalog (searchInSk)
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
