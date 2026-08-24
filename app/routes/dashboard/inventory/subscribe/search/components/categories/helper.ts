import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getCategories(params);
    return {
      data: InventorySubscribeService.formatCategoryResponse(
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
    const response = await InventorySubscribeService.getCategoriesCount(p);
    return response.data?.data?.totalGroups || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  params: Record<string, any>,
  pagination: PaginationState,
) => {
  const p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    dealSubscribeType: "NOTSUBSCRIBED",
    sort: {
      "_id.categoryName": 1,
    },
  };

  if (params.search) {
    const search = params.search.trim();
    if (search) {
      p.filter["applicableCategory.categoryName"] = {
        $regex: search,
        $options: "i",
      };
    }
  }

  if (params.alpha) {
    p.filter["applicableCategory.categoryName"] =
      CommonService.prepareAlphaRegexFilter(params.alpha);
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};
