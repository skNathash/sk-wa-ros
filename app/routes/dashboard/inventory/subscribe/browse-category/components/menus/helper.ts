import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getMenus(params);
    return {
      data: InventorySubscribeService.formatMenuResponse(
        response.data?.data || []
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

export const prepareParams = (
  params: Record<string, any>,
  pagination: PaginationState
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    dealSubscribeType: "NOTSUBSCRIBED",
    sort: {
      "_id.menuName": 1,
    },
  };

  // Handle search filter
  if (params.search) {
    const search = params.search.trim();
    if (search) {
      p.search = search;
      // p.filter["applicableMenu.menuName"] = { $regex: search, $options: "i" };
    }
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  if (params.sortType) {
    p.sort = InventorySubscribeService.getSortParams(
      "menu",
      params.sortType
    )?.sort;
  }

  return p;
};
