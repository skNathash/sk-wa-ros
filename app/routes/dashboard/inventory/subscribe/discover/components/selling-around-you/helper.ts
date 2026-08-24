import type { AxiosRequestConfig } from "axios";
import SellerCatalogService from "~/services/SellerCatalogService";
import { SEARCH_PATH } from "../../helper";
import { resolveDealObjectId } from "../../../search/helper";

/** Number of products fetched for the "selling around you" block. */
export const SELLING_AROUND_YOU_LIMIT = 10;

/** Radius (km) used to surface deals that sellers nearby already stock. */
export const SELLING_AROUND_YOU_RADIUS_KM = 5;

/** Deep-linked "See all" target, reusing the existing search page. */
export const SELLING_AROUND_YOU_SEE_ALL = `${SEARCH_PATH}?tab=top&sortType=popular&radiusKms=${SELLING_AROUND_YOU_RADIUS_KM}&hideTab=true`;

/**
 * One row of `catalog/seller-deals/price-comparison?view=network&outputType=list`.
 * Every figure here comes from the API — nothing is derived on the client.
 */
export interface SellingAroundYouDeal {
  /**
   * The deal's ObjectId — row identity, and what subscribe / cart / product
   * detail calls key on.
   */
  _id: string;
  /** Human-readable deal reference (`D…`), shown in the list only. */
  dealRefId: string;
  name: string;
  images: string[];
  brandName: string;
  categoryName: string;
  menuName: string;
  barcodes: string[];
  hsn: string;
  tax: number;
  mrp: number;
  /** Best price offered by a seller in the network; null when nobody stocks it. */
  bestPrice: number | null;
  /** Discount off MRP for {@link bestPrice}, as sent by the API. */
  offMrpPercent: number | null;
  /** Sellers within the requested radius who stock this SKU. */
  sellersCount: number;
  isSubscribed: boolean;
  yourB2bPrice: number | null;
  yourB2cPrice: number | null;
}

/**
 * The `D…` reference shown on the row. Price-comparison rows swap `dealId` and
 * `dealRefId` depending on the deal source, so take whichever key isn't holding
 * the ObjectId {@link resolveDealObjectId} picked.
 */
const resolveDealRef = (deal: any): string => {
  const objectId = resolveDealObjectId(deal);
  return (
    [deal?.dealRefId, deal?.dealId].find(
      (value) => typeof value === "string" && value && value !== objectId,
    ) || objectId
  );
};

const toNumberOrNull = (value: any): number | null =>
  typeof value === "number" ? value : null;

/** Map the price-comparison payload onto the shape the views render. */
const formatSellingAroundYouResponse = (
  data: any[],
): SellingAroundYouDeal[] =>
  (data || []).map((deal: any) => ({
    _id: resolveDealObjectId(deal),
    dealRefId: resolveDealRef(deal),
    name: deal.dealName || "",
    images: deal.images || [],
    brandName: deal.applicableBrand?.brandName || "",
    categoryName: deal.applicableCategory?.categoryName || "",
    menuName: deal.applicableMenu?.menuName || "",
    barcodes: deal.barcode ? [deal.barcode] : [],
    hsn: deal.hsn || "",
    tax: deal.tax || 0,
    mrp: deal.mrp || 0,
    bestPrice: toNumberOrNull(deal.bestPrice),
    offMrpPercent: toNumberOrNull(deal.offMrpPercent),
    sellersCount: deal.sellersCount || 0,
    isSubscribed: !!deal.isSubscribed,
    yourB2bPrice: toNumberOrNull(deal.yourB2bPrice),
    yourB2cPrice: toNumberOrNull(deal.yourB2cPrice),
  }));

export interface SellingAroundYouResult {
  /** The first {@link SELLING_AROUND_YOU_LIMIT} rows, rendered in the block. */
  items: SellingAroundYouDeal[];
  /** Every matching SKU in the radius, not just the page we render. */
  total: number;
}

/**
 * Selling around you — SKUs sellers within {@link SELLING_AROUND_YOU_RADIUS_KM}
 * already stock but this seller hasn't subscribed to yet, with the network
 * price comparison the API computes for each of them.
 *
 * The block renders one page, so the headline count comes off the response's
 * `pagination.total` — the same figure the catalog signal hero quotes — and
 * never off the loaded row count.
 */
export const fetchSellingAroundYou = async (
  signal?: AbortSignal,
): Promise<SellingAroundYouResult> => {
  const config: AxiosRequestConfig | undefined = signal
    ? { signal }
    : undefined;

  const response = await SellerCatalogService.getPriceComparison(
    {
      view: "network",
      outputType: "list",
      distance: SELLING_AROUND_YOU_RADIUS_KM,
      isSubscribed: false,
      page: 1,
      limit: SELLING_AROUND_YOU_LIMIT,
    },
    config,
  );

  const body: any = response?.data || {};
  const items = formatSellingAroundYouResponse(body.data || []);

  return {
    items,
    total: Number(body.pagination?.total) || items.length,
  };
};
