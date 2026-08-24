import type { AxiosRequestConfig } from "axios";
import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import { prepareParams } from "../../../search/components/brands/helper";
import { SEARCH_PATH } from "../../helper";

/** Number of brand tiles shown in the "Shop by brand" block. */
export const BRANDS_LIMIT = 9;

export interface DiscoverBrand extends TileDecor {
  _id: string;
  name: string;
  totalDeals: number;
  /** Asset id of the brand logo, for `ImgRender`. */
  assetId?: string;
  /** Search page, pre-filtered to this brand — the card's target. */
  _link: string;
  /** Up to three letters, for the round wordmark badge on phones. */
  _short: string;
}

/** "Nestlé" → "NES", "ITC" → "ITC". Letters and digits only. */
const shortLabel = (label = "") =>
  (label.replace(/[^a-z0-9]/gi, "").slice(0, 3) || "#").toUpperCase();

const brandLink = (id: string, name: string) =>
  `${SEARCH_PATH}?tab=search&hideTab=true&brandId=${encodeURIComponent(
    id,
  )}&brandName=${encodeURIComponent(name)}`;

const formatBrands = (data: any[]): DiscoverBrand[] =>
  InventorySubscribeService.formatBrandResponse(data)
    .filter((brand: any) => brand._id && brand._displayName)
    .map((brand: any) => ({
      _id: brand._id,
      name: brand._displayName || brand.name,
      totalDeals: brand.totalDeals || 0,
      assetId: brand._displayImg,
      _link: brandLink(brand._id, brand.name),
      _short: shortLabel(brand._displayName || brand.name),
      ...tileDecor(brand.name, brand._displayName),
    }));

/**
 * The first page of brands the seller can still subscribe to.
 *
 * Uses the search page's brand-view payload (`prepareParams`) so these cards
 * and the "See all" listing they open stay in step with each other.
 */
export const fetchTopBrands = async (signal?: AbortSignal) => {
  const config: AxiosRequestConfig | undefined = signal
    ? { signal }
    : undefined;

  const response = await InventorySubscribeService.getBrands(
    prepareParams(
      {},
      {
        activePage: 1,
        rowsPerPage: BRANDS_LIMIT,
        totalRecords: 0,
        startSlNo: 1,
        endSlNo: BRANDS_LIMIT,
      },
    ),
    config,
  );

  return formatBrands(response?.data?.data || []).slice(0, BRANDS_LIMIT);
};
