import type { PaginationState } from "~/types/CommonTypes";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import CommonService from "~/services/CommonService";

type BrandSourceType = "subscribe" | "inventory";

export const getData = async (
  type: BrandSourceType,
  params: Record<string, any>
) => {
  try {
    if (type === "subscribe") {
      const response = await InventorySubscribeService.getCategories(params);
      return {
        data: InventorySubscribeService.formatCategoryResponse(
          response.data?.data || []
        ),
      };
    }

    // default -> inventory
    const response = await SellerCatalogService.getCategories(params);
    return {
      data: SellerCatalogService.formatCategoryResponse(
        response?.data?.data || [],
        true
      ).map((e) => ({
        ...e,
        totalDeals: e._raw?.totalDeals || 0,
      })),
    };
  } catch (error) {
    console.error(error);
    return { data: [] };
  }
};

export const getCount = async (
  type: BrandSourceType,
  params: Record<string, any>
) => {
  const p = { ...params };
  delete p.page;
  delete p.count;

  try {
    if (type === "subscribe") {
      const response = await InventorySubscribeService.getCategoriesCount(p);
      // subscribe response returns totalGroups in nested data
      return response.data?.data?.totalGroups || 0;
    }

    // inventory - SellerCatalogService expects outputType=count
    const response = await SellerCatalogService.getCategories({
      ...p,
      outputType: "count",
    });
    return response?.data?.count || 0;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const prepareSubscribeParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const p: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.categoryName": 1,
    },
    dealSubscribeType: filters.dealSubscribeType || "NOTSUBSCRIBED",
  };

  // search
  if (filters?.search?.trim()) {
    const search = filters.search.trim();
    p.filter["applicableCategory.categoryName"] = {
      $regex: search,
      $options: "i",
    };
  }

  // alpha
  if (filters?.alpha) {
    p.filter["applicableCategory.categoryName"] =
      CommonService.prepareAlphaRegexFilter(filters.alpha);
  }

  // category filter mapping
  if (filters?.category?._id) {
    p.filter["applicableCategory.categoryId"] = filters.category._id;
  }

  // sortType
  if (filters.sortType) {
    p.sort = InventorySubscribeService.getSortParams(
      "brand",
      filters.sortType
    )?.sort;
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};

const prepareInventoryParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const p: Record<string, any> = {
    page: pagination?.activePage,
    count: pagination?.rowsPerPage,
    filter: {},
    sort: {
      "_id.categoryName": 1,
    },
  };

  // search
  if (filters?.search?.trim()) {
    const search = filters.search.trim();
    p.filter.search = search;
  }

  // alpha
  if (filters?.alpha) {
    p.filter["applicableCategory.categoryName"] =
      CommonService.prepareAlphaRegexFilter(filters.alpha);
  }

  // category filter mapping
  if (filters?.category?._id) {
    p.filter["applicableCategory.id"] = filters.category._id;
  }

  if (filters?.brandId) {
    p.filter["applicableBrand.brandId"] = filters.brandId;
  }

  if (!Object.keys(p.filter).length) {
    delete p.filter;
  }

  return p;
};

export const prepareParams = (
  type: BrandSourceType,
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  if (type === "subscribe") {
    return prepareSubscribeParams(filters, pagination);
  }
  return prepareInventoryParams(filters, pagination);
};

export default {
  getData,
  getCount,
  prepareParams,
};
