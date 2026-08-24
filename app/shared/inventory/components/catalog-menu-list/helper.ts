import SellerCatalogService from "~/services/SellerCatalogService";

/** A single menu row rendered by {@link CatalogMenuList}. */
export interface CatalogMenuItem {
  /** Menu id — what the product list filters on (`menuId`). */
  _id: string;
  name: string;
  _displayName: string;
  /** Deals stocked under this menu. */
  dealsCount: number;
  /** Deal count, thousands-separated — e.g. `1,240`. */
  _countLabel: string;
  /** First letter of the display name, painted on the tint tile. */
  _initial: string;
}

/** Where a row lands: the product list, narrowed to that one menu. */
export const MENU_LIST_PATH = "/dashboard/inventory/products/list";

/**
 * The seller's own menus (categories), ranked by how many deals sit under each,
 * so the pane leads with the ones actually worth filtering by.
 *
 * `getMenus` is the seller-deal list grouped by menu — the same feed the
 * catalogue's menu page reads — so ids line up with the `menuId` param the
 * product list's facet filter writes.
 *
 * Never throws: the pane is a shortcut, not the page, so a failed feed renders
 * empty rather than taking the host screen down.
 */
export const getCatalogMenus = async (
  count: number,
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<CatalogMenuItem[]> => {
  try {
    const response = await SellerCatalogService.getMenus(
      {
        page: 1,
        count,
        sort: { totalDeals: -1 },
        ...params,
      },
      { signal },
    );

    const menus = SellerCatalogService.formatMenuResponse(
      response.data?.data || [],
    );

    return menus
      .filter((menu: any) => menu._id)
      .map((menu: any) => {
        const label = menu._displayName || menu.name || "";
        const dealsCount = menu.dealsCount || 0;
        return {
          _id: menu._id,
          name: menu.name || "",
          _displayName: label,
          dealsCount,
          _countLabel: dealsCount.toLocaleString("en-IN"),
          _initial: label.trim().charAt(0).toUpperCase() || "#",
        };
      });
  } catch (error) {
    console.error("Error fetching catalog menus:", error);
    return [];
  }
};

/**
 * Total deals in the seller's catalogue — what the "All items" row shows.
 *
 * The menu feed only carries the top `limit` menus, so summing their deal counts
 * undercounts the catalogue. This asks the deal list for a straight count
 * instead, mirroring the products list header (`getCount` in
 * `routes/dashboard/inventory/products/list/helper`) so both screens agree.
 *
 * Any seller-deal `filter` handed to the menu feed is applied here too, keeping
 * the row in step with the rows below it. Never throws — the row falls back to
 * the summed menu counts when this returns null.
 */
export const getAllItemsCount = async (
  params: Record<string, any> = {},
  signal?: AbortSignal,
): Promise<number | null> => {
  try {
    const response = await SellerCatalogService.getProducts(
      {
        page: 1,
        count: 1,
        filter: { ...(params.filter || {}) },
        showAllDeals: true,
        includeVariants: true,
        outputType: "count",
      },
      {},
      { signal },
    );
    if (response.statusCode === 200) return response.data?.count || 0;
    return null;
  } catch (error) {
    console.error("Error fetching catalog items count:", error);
    return null;
  }
};

/** Query the product list needs to open in menu view, pre-filtered on one menu. */
export const getMenuListQuery = (menu: CatalogMenuItem) => ({
  tab: "products",
  view: "menu",
  menuId: menu._id,
  menuName: menu._displayName || menu.name,
  menuCount: menu.dealsCount,
});
