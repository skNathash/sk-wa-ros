import { orderBy } from "lodash";

import InventorySubscribeService from "./InventorySubscribeService";

export type SortKey = "relevance" | "mrp_asc" | "mrp_desc";

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "relevance", label: "Best match" },
  { key: "mrp_asc", label: "MRP: Low to High" },
  { key: "mrp_desc", label: "MRP: High to Low" },
];

export interface ReviewDeal {
  id: string;
  dealId?: string;
  title: string;
  brandName?: string;
  brandId?: string;
  image?: string;
  images: string[];
  mrp: number;
  price: number;
  barcode?: string;
  qty?: number;
  isSubscribed?: boolean;
  /** Already sitting in the subscribe cart (matched against the local cart). */
  isInCart?: boolean;
  /** Cart line id for the deal, when it is already in the cart. */
  cartItemId?: string;
  /** Quantity already added to the cart for this deal. */
  cartQuantity?: number;
  /** Cache id of the AI extraction this deal came from (AI-suggested rows). */
  aiCacheId?: string;
  /**
   * The untrimmed source deal this row was built from. AI-suggested rows carry
   * the full StoreKing AI extraction here (csaAttr, highlights, description,
   * classification, hsn/tax, …) so screens that need more than the summary
   * fields — e.g. the AiExtractedDetailsModal — can render it.
   */
  raw?: any;
}

export type MatchStatus = "Pending" | "NotFound" | "FoundInSk" | "FoundInAi";

export interface MatchStatusBadge {
  label: string;
  text: string;
  bg: string;
  dot: string;
  /** Optional muted second line shown below the pill (e.g. a caveat). */
  subLabel?: string;
}

export const MATCH_STATUS_BADGE: Record<MatchStatus, MatchStatusBadge> = {
  Pending: {
    label: "SK AI is Finding…",
    text: "tw:text-violet-700",
    bg: "tw:bg-violet-50",
    dot: "tw:bg-violet-500",
  },
  FoundInSk: {
    label: "Found in SK Library",
    text: "tw:text-emerald-700",
    bg: "tw:bg-emerald-50",
    dot: "tw:bg-emerald-500",
  },
  FoundInAi: {
    label: "Found by SK AI",
    text: "tw:text-emerald-700",
    bg: "tw:bg-emerald-50",
    dot: "tw:bg-emerald-500",
    subLabel: "Not in SK Library",
  },
  NotFound: {
    label: "Not found in SK AI or SK Library",
    text: "tw:text-gray-600",
    bg: "tw:bg-gray-100",
    dot: "tw:bg-gray-400",
  },
};

export interface ReviewItem {
  id?: string;
  /** Parent bulk-scan batch id — needed to delete the item server-side. */
  batchId?: string;
  barcode: string;
  qty: number;
  matchStatus: MatchStatus;
  badge: MatchStatusBadge;
  deal: ReviewDeal | null;
  skSuggestions: ReviewDeal[];
  createdAt?: string;
  status?: string;
}

/**
 * Pick the first usable barcode out of a set of candidates. The scan API is
 * inconsistent about the field it carries the code in — sometimes a plain
 * string, sometimes an array (`barcodes`), sometimes objects like
 * `{ barcode: "890…" }` — so accept all three rather than dropping the code.
 */
function firstBarcode(...candidates: any[]): string {
  for (const candidate of candidates) {
    for (const value of Array.isArray(candidate) ? candidate : [candidate]) {
      const code =
        typeof value === "string" || typeof value === "number"
          ? String(value)
          : value?.barcode || value?.code || value?.value || "";
      if (code.trim()) return code.trim();
    }
  }
  return "";
}

/** Payload for the client-side deal filter (brand chip + text search). */
export interface DealFilter {
  /** Selected brand — matches `brandId` (falls back to `brandName`). */
  brandId?: string;
  /** Free-text query matched against title, brand, deal id and barcode. */
  search?: string;
}

export default class BarcodeScanBulkService {
  /**
   * Client-side filter for suggestion deals. Takes the source deals and a
   * filter payload, narrowing by brand and/or a free-text search. Both
   * criteria are optional — an empty filter returns the deals unchanged.
   */
  static filterDeals(deals: ReviewDeal[], filter: DealFilter): ReviewDeal[] {
    const search = (filter.search || "").trim().toLowerCase();
    const brandId = filter.brandId || "";
    if (!search && !brandId) return deals;
    return deals.filter((d) => {
      if (brandId && (d.brandId || d.brandName) !== brandId) return false;
      if (search) {
        const haystack = [d.title, d.brandName, d.dealId, d.barcode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }

  /**
   * Client-side sort for suggestion deals. "Best match" keeps the server
   * order; the MRP options sort by price (lodash orderBy).
   */
  static sortDeals(deals: ReviewDeal[], sortKey: SortKey): ReviewDeal[] {
    switch (sortKey) {
      case "mrp_asc":
        return orderBy(deals, [(d) => Number(d.mrp) || 0], ["asc"]);
      case "mrp_desc":
        return orderBy(deals, [(d) => Number(d.mrp) || 0], ["desc"]);
      default:
        return deals;
    }
  }

  static dealImageProps(
    image: string,
  ): { src: string; isAbsolute: true } | { assetId: string } {
    return /^https?:\/\//i.test(image)
      ? { src: image, isAbsolute: true }
      : { assetId: image };
  }

  static toReviewDeal(raw: any, barcode?: string): ReviewDeal {
    let images: string[] = [];
    if (Array.isArray(raw?.images)) {
      images = raw.images;
    }
    const mrp = Number(raw?.mrp) || 0;
    // The subscribe cart is keyed on the deal's `_id` (same key SubscribeBtn
    // writes), so a row can say "In cart" without a second round trip.
    const cartItem = raw?._id
      ? InventorySubscribeService.getLocalCartItem(raw._id)
      : null;
    return {
      id: raw?._id || raw?.dealId || barcode || raw?.name || "",
      dealId: raw?.dealId,
      title: raw?.name || "",
      brandName: raw?.applicableBrand?.brandName,
      brandId: raw?.applicableBrand?.brandId,
      image: images[0],
      images,
      mrp,
      price: Number(raw?.price) || mrp,
      barcode: firstBarcode(raw?.barcode, raw?.barcodes, raw?.ean) || barcode,
      qty: raw?.qty,
      isSubscribed: raw?.isSubscribed,
      isInCart: !!cartItem?.dealId,
      cartItemId: cartItem?.itemId,
      cartQuantity: cartItem?.quantity || 0,
      aiCacheId: raw?.aiCacheId,
      raw,
    };
  }

  /**
   * Build the raw AI-product shape the AiExtractedDetailsModal expects from a
   * review-row deal. Prefer the untrimmed `raw` extraction (csaAttr, highlights,
   * description, classification, hsn/tax, …) so the modal can render the full
   * detail; the summary fields are overlaid as a safety net so name/mrp/images/
   * barcode always resolve even when `raw` is absent. Returns null with no deal.
   */
  static dealToAiProduct(deal: ReviewDeal | null): any {
    if (!deal) return null;
    const raw = deal.raw || {};
    return {
      ...raw,
      name: raw.name || deal.title || "",
      mrp: raw.mrp ?? deal.mrp,
      images:
        (Array.isArray(raw.images) && raw.images.length
          ? raw.images
          : deal.images) || [],
      barcodes:
        Array.isArray(raw.barcodes) && raw.barcodes.length
          ? raw.barcodes
          : deal.barcode
            ? [deal.barcode]
            : [],
      aiCacheId: deal.aiCacheId ?? raw.aiCacheId,
      applicableBrand:
        raw.applicableBrand ||
        (deal.brandName ? { brandName: deal.brandName } : undefined),
    };
  }

  static formatItem(item: any): ReviewItem {
    const result = item?.result ?? {};
    const barcode: string = firstBarcode(
      result?.barcode,
      result?.barcodes,
      item?.barcode,
      item?.barcodes,
      item?.searchKeyword,
      result?.searchKeyword,
      result?.text,
      item?.text,
    );
    const matchStatus: MatchStatus = item?.matchStatus || "NotFound";

    const matched: ReviewDeal[] = [];
    for (const d of result?.matchedSkDeals ?? []) {
      matched.push(this.toReviewDeal(d, barcode));
    }
    const aiSuggested: ReviewDeal[] = [];
    for (const d of result?.aiSuggestedDeals ?? []) {
      aiSuggested.push(this.toReviewDeal(d, barcode));
    }
    const skSuggestions: ReviewDeal[] = [];
    for (const d of result?.skSuggestedDeals ?? []) {
      skSuggestions.push(this.toReviewDeal(d, barcode));
    }

    let deal: ReviewDeal | null = null;
    if (matched[0]) {
      deal = matched[0];
    } else if (matchStatus === "FoundInAi") {
      deal = aiSuggested[0] ?? null;
    }

    return {
      id: item?._id,
      batchId: item?.batchId || "",
      // Items scanned by name (or whose scan echo dropped the code) carry no
      // barcode of their own — show the matched deal's code instead of a blank.
      barcode: barcode || deal?.barcode || "",
      qty: Number(result?.qty ?? item?.qty) || 0,
      matchStatus,
      badge: MATCH_STATUS_BADGE[matchStatus] ?? MATCH_STATUS_BADGE.NotFound,
      deal,
      skSuggestions,
      createdAt: item?.createdAt || item?.updatedAt,
      status: item?.status,
    };
  }

  static seedReviewItems(
    scanned: { barcode: string; qty: number }[],
  ): ReviewItem[] {
    const seen = new Set<string>();
    const seeds: ReviewItem[] = [];
    for (const { barcode, qty } of scanned) {
      if (!barcode || seen.has(barcode)) continue;
      seen.add(barcode);
      seeds.push({
        barcode,
        qty,
        matchStatus: "Pending",
        badge: MATCH_STATUS_BADGE.Pending,
        deal: null,
        skSuggestions: [],
      });
    }
    return seeds;
  }

  static rank(status: MatchStatus): number {
    if (status === "FoundInSk") {
      return 0;
    }
    if (status === "NotFound") {
      return 2;
    }
    return 1;
  }

  static sortSkFirst(a: ReviewItem, b: ReviewItem): number {
    return this.rank(a.matchStatus) - this.rank(b.matchStatus);
  }
}
