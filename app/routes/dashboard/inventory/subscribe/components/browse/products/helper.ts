import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import CommonService from "~/services/CommonService";

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await InventorySubscribeService.getDeals(params);
    return {
      data: InventorySubscribeService.formatDealResponse(
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
    const response = await InventorySubscribeService.getDealsCount(p);
    return response.data?.data?.totalDeals || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

export const prepareParams = (
  params: Record<string, any>,
  pagination: PaginationState,
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Active",
      "applicableBrand.brandName": {
        $ne: "",
      },
      // isSubscribed: false,
    },
    dealSubscribeType: "NOTSUBSCRIBED",
    // groupGroupedDeals: true,
  };

  // Handle search filter
  if (params.search) {
    const search = params.search.trim();
    if (search) {
      p.search = search;
    }
  }

  // Handle alpha filter
  if (params.alpha) {
    p.filter["dealName"] = CommonService.prepareAlphaRegexFilter(params.alpha);
  }

  // Menu filter: same key as the subscribe/search helper
  if (params.menu) {
    const menuId =
      params.menu?.value?.id || params.menu?._id || params.menu?.id;
    if (menuId) {
      p.filter["applicableMenu.menuId"] = { $in: [menuId] };
    }
  }

  if (params.category?._id) {
    p.filter["applicableCategory.categoryId"] = params.category?._id;
  }

  // Parent category filtering: accept single id or array of ids
  if (params.parentCategoryId) {
    p.filter["applicableParentCategory.categoryId"] = params.parentCategoryId;
  }

  if (params.brand?._id) {
    p.filter["applicableBrand.brandId"] = params.brand?._id;
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  if (params.sortType) {
    p.sort = InventorySubscribeService.getSortParams(
      "product",
      params.sortType,
    )?.sort;
  }

  return p;
};
