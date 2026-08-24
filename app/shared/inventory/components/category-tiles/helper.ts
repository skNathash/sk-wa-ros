import SellerCatalogService from "~/services/SellerCatalogService";

/** A single category tile rendered by {@link CategoryTiles}. */
export interface CategoryTileItem {
  /** Category id — what the product list filters on (`categoryId`). */
  _id: string;
  name: string;
  _displayName: string;
  /** Deals subscribed under this category. */
  dealsCount: number;
  /** First letter of the display name, painted on the tint tile. */
  _initial: string;
}

/** Where a tile lands: the product list, narrowed to that one category. */
export const CATEGORY_LIST_PATH = "/dashboard/inventory/products/list";

/**
 * The seller's own categories, ranked by how many deals sit under each, so the
 * strip leads with the ones actually worth filtering by.
 *
 * `getCategories` is the seller-deal list grouped by category, which is the
 * same feed the catalogue's category page reads — ids therefore line up with
 * the `categoryId` param the product list expects.
 *
 * Never throws: the block is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the host screen down.
 */
export const getCategoryTiles = async (
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<CategoryTileItem[]> => {
  try {
    const response = await SellerCatalogService.getCategories(
      {
        page: 1,
        count,
        sort: { totalDeals: -1 },
        ...params,
      },
      { signal },
    );

    const categories = SellerCatalogService.formatCategoryResponse(
      response.data?.data || [],
    );

    return categories
      .filter((category: any) => category._id)
      .map((category: any) => {
        const label = category._displayName || category.name || "";
        return {
          _id: category._id,
          name: category.name || "",
          _displayName: label,
          dealsCount: category.dealsCount || 0,
          _initial: label.trim().charAt(0).toUpperCase() || "#",
        };
      });
  } catch (error) {
    console.error("Error fetching category tiles:", error);
    return [];
  }
};

/** Query the product list needs to open pre-filtered on one category. */
export const getCategoryListQuery = (category: CategoryTileItem) => ({
  tab: "products",
  categoryId: category._id,
  categoryName: category._displayName || category.name,
});
