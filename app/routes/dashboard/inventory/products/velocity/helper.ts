import CommonService from "~/services/CommonService";
import RackBinService from "~/services/RackBinService";
import SellerCatalogService from "~/services/SellerCatalogService";

// Export a title object mapping movement type keys to label and description
export const movementTypeTitles: Record<
  string,
  { label: string; description: string }
> = (() => {
  const types = SellerCatalogService.getMovementTypes();
  const obj: Record<string, { label: string; description: string }> = {};
  types.forEach((type) => {
    obj[type.key] = {
      label: type.label,
      description: type.description || "",
    };
  });
  // Ensure out-of-stock is available as a movement type for UI labeling
  if (!obj["out-of-stock"]) {
    obj["out-of-stock"] = {
      label: "Out of Stock",
      description: "Products with zero or negative stock.",
    };
  }
  return obj;
})();

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {},
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.alpha) {
    params.filter.dealName = CommonService.prepareAlphaRegexFilter(
      filter.alpha
    );
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

  // Handle movement type filter (type key)
  if (filter?.type && filter.type !== "All") {
    if (filter.type === "out-of-stock") {
      params.filter.quantity = { $lte: 0 };
    } else {
      const movementTypes = SellerCatalogService.getMovementTypes();
      params.filter.movementType = movementTypes.find(
        (type: any) => type.key === filter.type
      )?.value;
    }
  }

  return params;
};

// Get deal inventory data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params);
    return SellerCatalogService.formatProductResponse(
      response.data?.data || []
    );
  } catch (error) {
    console.error("Error fetching deal inventory:", error);
    return [];
  }
};

// Get deal inventory count from API
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
    console.error("Error fetching deal inventory count:", error);
    return 0;
  }
};

// Get location details for deals
export const getLocationDetails = async (dealIds: Array<string>) => {
  try {
    const response = await RackBinService.getLocationDetailsOfDeals(dealIds);
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching location details:", error);
    return [];
  }
};
