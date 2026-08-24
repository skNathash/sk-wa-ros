import type { AxiosRequestConfig } from "axios";
import { tileDecor, type TileDecor } from "~/components/core/tint/tints";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import { prepareParams } from "../../../search/components/categories/helper";
import { SEARCH_PATH } from "../../helper";

/** Number of category tiles shown in the "Shop by category" block. */
export const CATEGORIES_LIMIT = 9;

export interface DiscoverCategory extends TileDecor {
  _id: string;
  name: string;
  totalDeals: number;
  /** Asset id of the category image, for `ImgRender`. */
  assetId?: string;
  /** Search page, pre-filtered to this category — the tile's target. */
  _link: string;
}

const categoryLink = (id: string, name: string) =>
  `${SEARCH_PATH}?tab=search&hideTab=true&categoryId=${encodeURIComponent(
    id,
  )}&categoryName=${encodeURIComponent(name)}`;

const formatCategories = (data: any[]): DiscoverCategory[] =>
  InventorySubscribeService.formatCategoryResponse(data)
    .filter((category: any) => category._id && category._displayName)
    .map((category: any) => ({
      _id: category._id,
      name: category._displayName || category.name,
      totalDeals: category.totalDeals || 0,
      assetId: category._displayImg,
      _link: categoryLink(category._id, category.name),
      ...tileDecor(category.name, category._displayName),
    }));

/**
 * The first page of catalog heads the seller can still subscribe to.
 *
 * The payload comes straight from the search page's category view
 * (`prepareParams`), so the tiles here and the "See all" listing they open are
 * reading the same slice of the catalog — a tile can never lead somewhere that
 * shows a different set.
 */
export const fetchTopCategories = async (signal?: AbortSignal) => {
  const config: AxiosRequestConfig | undefined = signal
    ? { signal }
    : undefined;

  const response = await InventorySubscribeService.getCategories(
    prepareParams(
      {},
      {
        activePage: 1,
        rowsPerPage: CATEGORIES_LIMIT,
        totalRecords: 0,
        startSlNo: 1,
        endSlNo: CATEGORIES_LIMIT,
      },
    ),
    config,
  );

  return formatCategories(response?.data?.data || []).slice(0, CATEGORIES_LIMIT);
};
