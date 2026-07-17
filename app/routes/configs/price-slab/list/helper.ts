import PriceSlabService from "~/services/PriceSlabService";
import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";

export type PriceSlabType =
  | "product"
  | "global"
  | "menu"
  | "category"
  | "brand";

const getConfigType = (activeTab: string) => {
  if (activeTab === "global") {
    return "Global";
  } else if (activeTab === "menu") {
    return "Menu";
  } else if (activeTab === "category") {
    return "Category";
  } else if (activeTab === "brand") {
    return "Brand";
  } else if (activeTab === "product") {
    return "Deal";
  } else {
    return "Global";
  }
};
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: any,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  let configType = getConfigType(filter?.activeTab);

  params.filter.configType = configType;

  if (sort && sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter?.search) {
    // params.filter.search = filter.search;
    params.filter["$or"] = [
      { "referenceInfo.name": { $regex: filter.search, $options: "i" } },
      { "referenceInfo.refId": { $regex: filter.search, $options: "i" } },
    ];
  }

  if (filter?.status && filter.status !== "All") {
    // params.filter.status = filter.status;
    if (filter.status === "active") {
      params.filter.isActive = true;
    } else if (filter.status === "inactive") {
      params.filter.isActive = false;
    }
  }

  if (filter?.keys && Array.isArray(filter.keys) && filter.keys.length) {
    params.keys = filter.keys.join(",");
  }

  // Date range filter: filter by creation date range if provided
  if (filter?.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (Object.keys(params.filter).length === 0) {
    // delete params.filter;
  }

  // Determine active tab from filter (form stores it)
  const active = filter?.activeTab;

  // If the active tab is global, request only global config with minimal page size
  if (active === "global") {
    params.page = 1;
    params.count = 1;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PriceSlabService.getPriceSlab(params);
    return response.data?.data || [];
  } catch (err) {
    console.error("Error fetching price slabs:", err);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const p: Record<string, any> = { ...(params || {}), outputType: "count" };
    // Remove pagination keys for count queries
    delete p.page;
    delete p.count;
    delete p.sort;

    const response = await PriceSlabService.getPriceSlab(p);
    return response.data?.count || 0;
  } catch (err) {
    console.error("Error fetching price slab count:", err);
    return 0;
  }
};

export const hasCreatedConfig = async (activeTab: string) => {
  let type = getConfigType(activeTab);

  try {
    const response = await getCount({
      filter: { configType: type },
    });

    return { hasConfig: response > 0 };
  } catch (err) {
    return { hasConfig: false };
  }
};
