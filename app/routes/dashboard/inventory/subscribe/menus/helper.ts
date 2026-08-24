import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: {
    search?: string;
    alpha?: string;
  } = {},
  pagination: PaginationState,
): Record<string, any> => {
  const { search, alpha } = filter || {};

  // Shared deal filter, so each tile's SKU count matches the list it opens.
  const params: Record<string, any> = {
    ...InventorySubscribeService.getSubscribableDealParams(
      alpha
        ? {
            filter: {
              "applicableMenu.menuName":
                CommonService.prepareAlphaRegexFilter(alpha),
            },
          }
        : {},
    ),
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    sort: {
      "_id.menuName": 1,
    },
  };

  if (search) {
    params.search = search.trim();
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getMenus(params);
    return {
      data: InventorySubscribeService.formatMenuResponse(
        response.data?.data || [],
      ),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.count;
  try {
    const response = await InventorySubscribeService.getMenusCount(p);
    return response.data?.data?.totalGroups || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};
