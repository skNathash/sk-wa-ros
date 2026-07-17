import { endOfDay, startOfDay } from "date-fns";
import {
  MOVEMENT_TYPE_EXPIRED_DESCRIPTION,
  MOVEMENT_TYPE_FAST_MOVING_DESCRIPTION,
  MOVEMENT_TYPE_NEAR_EXPIRY_DESCRIPTION,
  MOVEMENT_TYPE_NON_MOVING_DESCRIPTION,
  MOVEMENT_TYPE_NORMAL_DESCRIPTION,
  MOVEMENT_TYPE_OUT_OF_STOCK_DESCRIPTION,
  MOVEMENT_TYPE_SLOW_MOVING_DESCRIPTION,
} from "~/constants";
import CommonService from "~/services/CommonService";
import RackBinService from "~/services/RackBinService";
import SellerCatalogService from "~/services/SellerCatalogService";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";

// Default summary data structure
export interface SummaryItem {
  label: string;
  value: number;
  key: string;
  color: string;
  description: string;
}

export interface MainSummaryData {
  totalProducts: number;
  lowStock: number;
  inventoryValue: number;
  outOfStock: number;
  nearExpiry: number;
  expired: number;
}

export interface SummaryData {
  mainSummary: MainSummaryData;
  productSummary: SummaryItem[];
  rawData?: any;
}

export const SORT_OPTIONS = SellerCatalogService.getGlobalSortOptions().filter(
  (opt) => !opt.value.includes("price"),
);

// Default product summary data
export const DEFAULT_PRODUCT_SUMMARY: SummaryItem[] = [
  {
    label: "fastMoving",
    value: 0,
    key: "fast-moving",
    color: "success",
    description: MOVEMENT_TYPE_FAST_MOVING_DESCRIPTION,
  },
  {
    label: "normal",
    value: 0,
    key: "normal",
    color: "primary",
    description: MOVEMENT_TYPE_NORMAL_DESCRIPTION,
  },
  {
    label: "slowMoving",
    value: 0,
    key: "slow-moving",
    color: "warning",
    description: MOVEMENT_TYPE_SLOW_MOVING_DESCRIPTION,
  },
  {
    label: "nonMoving",
    value: 0,
    key: "non-moving",
    color: "error",
    description: MOVEMENT_TYPE_NON_MOVING_DESCRIPTION,
  },
  {
    label: "outOfStock",
    value: 0,
    key: "out-of-stock",
    color: "danger",
    description: MOVEMENT_TYPE_OUT_OF_STOCK_DESCRIPTION,
  },
  {
    label: "nearExpiry",
    value: 0,
    key: "near-expiry",
    color: "warning",
    description: MOVEMENT_TYPE_NEAR_EXPIRY_DESCRIPTION,
  },

  {
    label: "expired",
    value: 0,
    key: "expired",
    color: "destructive",
    description: MOVEMENT_TYPE_EXPIRED_DESCRIPTION,
  },
];

// Default main summary data
export const DEFAULT_MAIN_SUMMARY: MainSummaryData = {
  totalProducts: 0,
  lowStock: 0,
  inventoryValue: 0,
  outOfStock: 0,
  nearExpiry: 0,
  expired: 0,
};

// Default complete summary data
export const DEFAULT_SUMMARY_DATA: SummaryData = {
  mainSummary: DEFAULT_MAIN_SUMMARY,
  productSummary: DEFAULT_PRODUCT_SUMMARY,
  rawData: null,
};

// Prepare filter parameters for API calls
export const prepareParams = (filter: any, pagination: any, sort: any) => {
  const serviceParams =
    InventoryDealFilterService.prepareDealInventoryFilterParams(filter);

  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: { ...serviceParams.filter },
    showAllDeals: true,
  };

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  } else if (serviceParams.sort) {
    params.sort = serviceParams.sort;
  }

  if (serviceParams.keys) {
    params.keys = serviceParams.keys;
  }

  // Add search filter (extra field)
  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  // Add alpha filter (extra field not handled in prep service)
  if (filter.alpha) {
    params.filter.dealName = CommonService.prepareAlphaRegexFilter(
      filter.alpha,
    );
  }

  // Add date range filter (extra field)
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

  // Add reserve filter (extra field)
  if (filter.reserve && filter.reserve !== "All") {
    // params.filter["reserveConfig.isActive"] = filter.reserve === "Only Reserve";
  }

  // Add "only with stock" filter
  if (filter.onlyWithStockData) {
    params.filter.availableQuantity = { $gt: 0 };
  }

  return params;
};

// Get deal inventory data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await SellerCatalogService.getProducts(params, {
      showOutOfStock: true,
    });
    return SellerCatalogService.formatProductResponse(
      response.data?.data || [],
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

export const downloadProducts = async (params: Record<string, any>) => {
  const p = { ...params };

  delete p.page;
  delete p.count;
  delete p.sort;

  try {
    const response = await SellerCatalogService.getProducts({
      ...p,
      type: "csv",
    });
    return {
      filePath: response.data?.data?.fileName || "",
    };
  } catch (error) {
    return {
      filePath: "",
    };
  }
};

// Get inventory analytics summary
export const getSummary = async (
  params?: Record<string, any>,
): Promise<SummaryData> => {
  try {
    // First API call: without deleting filter keys (for inventory and its value)
    const firstParams = { ...params };
    const firstResponse =
      await SellerCatalogService.getInventoryAnalytics(firstParams);

    // Second API call: with deleting the keys (for other cards)
    const secondParams = { ...params };
    if (secondParams?.filter?.movementTypeFilter) {
      delete secondParams.filter.movementTypeFilter;
    }
    if (secondParams?.filter?.stockStatusFilter) {
      delete secondParams.filter.stockStatusFilter;
    }
    if (
      secondParams?.filter?.quantity &&
      secondParams.filter.quantity.$lte === 0
    ) {
      delete secondParams.filter.quantity;
    }
    const secondResponse =
      await SellerCatalogService.getInventoryAnalytics(secondParams);

    if (
      firstResponse.statusCode === 200 &&
      firstResponse.data?.success &&
      secondResponse.statusCode === 200 &&
      secondResponse.data?.success
    ) {
      const firstData = firstResponse.data.data;
      const secondData = secondResponse.data.data;

      // Format data for InventoryMainSummary component
      // Use first call for totalProducts and inventoryValue
      // Use second call for lowStock, outOfStock, nearExpiry, expired
      const mainSummary: MainSummaryData = {
        totalProducts: firstData.totalDeals || 0,
        lowStock: secondData.lowStockAlert || 0,
        inventoryValue: firstData.inventoryValue || 0,
        outOfStock: secondData.outOfStock || 0,
        nearExpiry: secondData.nearExpiry || 0,
        expired: secondData.expiredDeals || 0,
      };

      // Format data for InventoryProductSummary component
      // Use second call for product summary as it has the filtered data removed
      const productSummary: SummaryItem[] = DEFAULT_PRODUCT_SUMMARY.map(
        (item) => {
          let value = 0;

          // Attach values based on the key
          switch (item.key) {
            case "fast-moving":
              value = secondData.breakdown?.["Fast Moving"]?.totalDeals || 0;
              break;
            case "normal":
              value = secondData.breakdown?.["Normal"]?.totalDeals || 0;
              break;
            case "slow-moving":
              value = secondData.breakdown?.["Slow Moving"]?.totalDeals || 0;
              break;
            case "non-moving":
              value = secondData.breakdown?.["Non-Moving"]?.totalDeals || 0;
              break;
            case "near-expiry":
              value = secondData.nearExpiry || 0;
              break;
            case "out-of-stock":
              value = secondData.outOfStock || 0;
              break;
            case "expired":
              value = secondData.expiredDeals || 0;
              break;
            default:
              value = 0;
          }

          return {
            ...item,
            value,
          };
        },
      );

      return {
        mainSummary,
        productSummary,
        rawData: secondData, // Use second data as rawData since it's the filtered one
      };
    }

    return DEFAULT_SUMMARY_DATA;
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    return DEFAULT_SUMMARY_DATA;
  }
};

export interface FilterFormFields {
  search: string;
  keys?: string[];
  category: Array<{ label: string; value: any }> | null;
  brand: Array<{ label: string; value: any }> | null;
  companyName?: Array<{ label: string; value: any }>;
  velocity: string;
  stockStatus: string;
  status?: string;
  alpha?: string;
  menu?: Array<{ label: string; value: any }> | null;
  onlyOffers?: boolean;
  isGroupDeal?: boolean;
  withoutStock?: boolean;
  sellIn?: string;
  globalSort?: string;
  isPriceSlab?: boolean;
  onlyWithStockData?: boolean;
  reserve?: string;
  isPromotionalDeal?: boolean;
  dealScope?: string;
}

export const defaultFilterValues: FilterFormFields = {
  search: "",
  keys: [],
  category: null,
  brand: null,
  companyName: [],
  velocity: "All",
  stockStatus: "All",
  status: "Active",
  alpha: "",
  menu: null,
  sellIn: "All",
  onlyOffers: false,
  isGroupDeal: false,
  withoutStock: false,
  onlyWithStockData: false,
  globalSort: "recently-subscribed",
  isPriceSlab: false,
  reserve: "All",
  isPromotionalDeal: false,
  dealScope: "All",
};
