import { withTileDecor, type TileDecor } from "~/components/core/tint/tints";
import SellerCatalogService from "~/services/SellerCatalogService";

type GroupedItemBase = {
  _id: string;
  name: string;
  _displayName: string;
  /** asset id used as the thumbnail (taken from a representative product) */
  image?: string;
  /** number of top-selling products that fall under this brand/category */
  count: number;
};

/** What the tiles consume — the grouped entity plus its tile decoration. */
export type GroupedItem = GroupedItemBase & TileDecor;

export type TopBrandsCategoryData = {
  brands: GroupedItem[];
  categories: GroupedItem[];
};

/**
 * Fetches the network top-selling deals (same source as the TopSelling section)
 * and groups them into distinct brands and categories.
 */
export const getTopBrandsAndCategories = async (
  distance: number | string,
  count = 50,
): Promise<TopBrandsCategoryData> => {
  const params = SellerCatalogService.getNetworkTopSellingParams({
    page: 1,
    count,
  });
  const response = await SellerCatalogService.getNetworkDeals(params, distance);
  const products = SellerCatalogService.formatProductResponse(
    response.data?.data || [],
  );

  return groupByBrandAndCategory(products);
};

const groupByBrandAndCategory = (
  products: any[],
): TopBrandsCategoryData => {
  const brands = new Map<string, GroupedItemBase>();
  const categories = new Map<string, GroupedItemBase>();

  const collect = (
    bucket: Map<string, GroupedItemBase>,
    entry: any,
    image?: string,
  ) => {
    const id = entry?._id;
    if (!id) return;
    const existing = bucket.get(id);
    if (existing) {
      existing.count += 1;
      if (!existing.image && image) existing.image = image;
      return;
    }
    bucket.set(id, {
      _id: id,
      name: entry.name || "",
      _displayName: entry._displayName || entry.name || "",
      image,
      count: 1,
    });
  };

  for (const product of products) {
    const image = product?.images?.[0];
    collect(brands, product?.brand, image);
    collect(categories, product?.category, image);
  }

  const byCountDesc = (a: GroupedItemBase, b: GroupedItemBase) =>
    b.count - a.count;

  // Label, initial, tint and ink ride along from here — the tiles just print them.
  return {
    brands: withTileDecor(Array.from(brands.values()).sort(byCountDesc)),
    categories: withTileDecor(Array.from(categories.values()).sort(byCountDesc)),
  };
};
