import { endOfDay, startOfDay } from "date-fns";
import CommonService from "~/services/CommonService";
import SellerCatalogService from "~/services/SellerCatalogService";

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.alpha) {
    params.filter.dealName = CommonService.prepareAlphaRegexFilter(
      filter.alpha
    );
  }

  // Add date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter["createdAt"] = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (filter.status && filter.status !== "All") {
    params.filter.status = filter.status;
  }

  if (filter?.category?.value) {
    params.filter["applicableCategory.categoryId"] = filter.category.value?.id;
  }

  if (filter?.brand?.value) {
    params.filter["applicableBrand.brandId"] = filter.brand.value?.id;
  }

  if (filter.velocity && filter.velocity !== "All") {
    if (filter.velocity === "outOfStock") {
      params.filter.quantity = { $lte: 0 };
    } else {
      params.filter.movementType = filter.velocity;
    }
  }

  // Toggle stock availability
  if (typeof filter.withoutStock === "boolean" && filter.withoutStock) {
    // Only show products without stock (quantity <= 0)
    params.filter.quantity = { $lte: 0 };
  }
  // When withoutStock is false, don't add any quantity filter to show all products

  if (filter.globalSort && filter.globalSort !== "all") {
    params.sort = filter.globalSort;
  }

  return params;
};

// Get seller products data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params);
    return SellerCatalogService.formatProductResponse(
      response.data?.data || []
    );
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return [];
  }
};

// Get seller products count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts({
      ...params,
      outputType: "count",
    });
    if (response.statusCode === 200 && response.data?.count) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching seller products count:", error);
    return 0;
  }
};
