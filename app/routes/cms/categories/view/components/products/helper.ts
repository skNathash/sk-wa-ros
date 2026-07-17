import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const defaultFilter = {
  search: "",
  alpha: "",
  globalSort: "all",
  category: [],
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts({
    ...params,
  });
  return SellerCatalogService.formatProductResponse(response?.data?.data || []);
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerCatalogService.getProducts({
    ...params,
    outputType: "count",
  });

  return response?.data?.count || 0;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      "applicableCategory.id": filter.categoryId,
    },
  };

  // handle sort
  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // search
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  // category can be an array (from CategorySearchInput) or single object
  if (Array.isArray(filter.brand) && filter.brand.length > 0) {
    params.filter["applicableBrand.brandId"] = {
      $in: filter.brand.map((b: any) => b?.value?.id || b?.id),
    };
  }

  // other filters passed directly
  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  // global sort (from global dropdown)
  if (filter.globalSort && filter.globalSort !== "all") {
    params.sort = filter.globalSort;
  }

  return params;
};
