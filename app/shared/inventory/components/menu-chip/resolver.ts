import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { MenuChipEntity, MenuChipSource, MenuItem } from "./types";

/**
 * Fetch the menu list for the chip strip, picking the correct service by
 * `source`. Modelled on the route-local menu helpers
 * (`.../browse-category/components/menus/helper.ts` and
 * `app/routes/dashboard/inventory/menus/helper.ts`) but self-contained so the
 * shared component doesn't depend on route-local files.
 *
 * `entity` is accepted for forward-compatibility (an entity-scoped menu feed
 * would branch here); today the menu feed depends only on `source`.
 */
export const getMenus = async (
  source: MenuChipSource,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _entity: MenuChipEntity,
): Promise<{ data: MenuItem[] }> => {
  try {
    if (source === "subscribe") {
      const response = await InventorySubscribeService.getMenus({
        page: 1,
        count: 30,
        dealSubscribeType: "NOTSUBSCRIBED",
        sort: { "_id.menuName": 1 },
      });
      return {
        data: InventorySubscribeService.formatMenuResponse(
          response.data?.data || [],
        ),
      };
    }

    const response = await SellerCatalogService.getMenus({
      page: 1,
      count: 30,
      sort: { "_id.menuName": 1 },
    });
    return {
      data: SellerCatalogService.formatMenuResponse(response.data?.data || []),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};
