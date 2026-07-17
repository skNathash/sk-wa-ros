import SellerCatalogService from "~/services/SellerCatalogService";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";

export interface FilterFormFields {
  search: string;
  configPendingType?: string;
  menu?: Array<{ label: string; value: any }> | null;
  category?: Array<{ label: string; value: any }> | null;
  brand?: Array<{ label: string; value: any }> | null;
  status?: string;
  velocity?: string;
  stockStatus?: string;
  sellIn?: string;
  onlyOffers?: boolean;
  withoutStock?: boolean;
  isGroupDeal?: boolean;
  isPriceSlab?: boolean;
  companyName?: Array<{ label: string; value: any }>;
}

export const defaultFilterValues: FilterFormFields = {
  search: "",
  configPendingType: "packaging",
  menu: null,
  category: null,
  brand: null,
  status: "All",
  velocity: "All",
  stockStatus: "All",
  sellIn: "All",
  onlyOffers: false,
  withoutStock: false,
  isGroupDeal: false,
  isPriceSlab: false,
  companyName: [],
};

// Prepare filter parameters for API calls
export const prepareParams = (filter: FilterFormFields, pagination: any) => {
  const baseParams: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const serviceParams =
    InventoryDealFilterService.prepareDealInventoryFilterParams(filter);

  // Start with service-generated filter (movement, stock status, category, brand, etc.)
  baseParams.filter = {
    ...(serviceParams.filter || {}),
  };

  // Add tab-specific flags to filter payload based on configPendingType
  if (filter?.configPendingType) {
    if (filter.configPendingType === "stock") {
      baseParams.filter.isStockAdded = false;
    } else if (filter.configPendingType === "packaging") {
      baseParams.filter.isPackageTypeUpdated = false;
    } else if (filter.configPendingType === "margin") {
      baseParams.filter.isPriceUpdated = false;
    }
  }

  // Add search filter (extra field)
  if (filter.search?.trim()) {
    baseParams.filter.search = filter.search.trim();
  }

  return baseParams;
};

// Get product data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    return SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    );
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Get product count from API
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
    console.error("Error fetching count:", error);
    return 0;
  }
};
