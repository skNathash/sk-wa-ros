import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import CommonService from "~/services/CommonService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getParentCategories(
      params
    );
    return {
      data: InventorySubscribeService.formatParentCategoryResponse(
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
    const response = await InventorySubscribeService.getParentCategoriesCount(
      p
    );
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
      "_id.parentCategoryName": 1,
    },
  };

  // Handle search filter
  if (params.search) {
    const search = params.search.trim();
    if (search) {
      p.search = search;
      // p.filter["applicableParentCategory.parentCategoryName"] = {
      //   $regex: search,
      //   $options: "i",
      // };
    }
  }

  // Add menu filter if present
  if (params.menuId) {
    p.filter["applicableMenu.menuId"] = params.menuId;
  }

  if (params.alpha) {
    p.filter["applicableParentCategory.parentCategoryName"] =
      CommonService.prepareAlphaRegexFilter(params.alpha);
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  if (params.sortType) {
    // For alphabetic sorts use parentCategoryName, otherwise reuse existing sort types
    if (params.sortType === "a-z") {
      p.sort = { "_id.parentCategoryName": 1 };
    } else if (params.sortType === "z-a") {
      p.sort = { "_id.parentCategoryName": -1 };
    } else {
      p.sort = InventorySubscribeService.getSortParams(
        "category",
        params.sortType
      )?.sort;
    }
  }

  return p;
};
