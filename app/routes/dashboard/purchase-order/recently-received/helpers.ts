import { endOfDay, startOfDay, subDays } from "date-fns";
import CommonService from "~/services/CommonService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { SortValue } from "~/types/CommonTypes";

const now = new Date();
export const defaultFilterData = {
  search: "",
  dateRange: [startOfDay(subDays(now, 6)), endOfDay(now)],
  // status removed
  feature: "purchase",
  activeTab: "by-box",
  alpha: "",
  // received filter removed
};

// Prepare filter parameters for API calls
export const prepareParams = (
  filter: any,
  pagination: any,
  sort?: { key: string; value: SortValue }
) => {
  const params: any = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
    groupBy: "product",
  };

  if (filter.activeTab === "by-product") {
    params.groupBy = "product";
  } else if (filter.activeTab === "by-vendor") {
    params.groupBy = "vendor";
  } else if (filter.activeTab === "by-box") {
    params.groupBy = "box";
  }

  // Add sort parameters if provided
  // if (sort && sort.key && sort.value) {
  //   params.sort = {
  //     [sort.key]: sort.value === "asc" ? 1 : -1,
  //   };
  // }

  // Add search filter
  if (filter.search?.trim()) {
    params.search = filter.search.trim();
  }

  if (Array.isArray(filter.dateRange) && filter.dateRange.length == 2) {
    const startDate = startOfDay(filter.dateRange[0]);
    const endDate = endOfDay(filter.dateRange[1]);
    params.startDate = startDate.toISOString();
    params.endDate = endDate.toISOString();
  }

  // received/status filter removed

  const alpha = filter.alpha?.trim();
  if (alpha) {
    if (filter.activeTab === "by-product") {
      params.filter["items.name"] =
        CommonService.prepareAlphaRegexFilter(alpha);
    } else if (filter.activeTab === "by-vendor") {
      params.filter["from.name"] = CommonService.prepareAlphaRegexFilter(alpha);
    }
  }

  // Remove filter object if it's empty
  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

// Get recently received purchase deals
export const getData = async (params: Record<string, any>) => {
  try {
    let response: any = await PurchaseOrderService.getRecentlyReceived({
      ...params,
    });

    if (response.statusCode === 200) {
      if (Array.isArray(response.data?.data)) {
        return PurchaseOrderService.formatRecentlyReceived(response.data?.data);
      }
    }
    return [];
  } catch (error) {
    console.error("Error fetching purchase data:", error);
    return [];
  }
};

// Get count of recently received purchase deals
export const getCount = async (params: Record<string, any>) => {
  try {
    let response: any = await PurchaseOrderService.getRecentlyReceived({
      ...params,
      outputType: "count",
    });
    if (response.statusCode === 200) {
      return { count: response.data?.data || 0, summary: {} };
    }
    return { count: 0, summary: {} };
  } catch (error) {
    console.error("Error fetching purchase deals count:", error);
    return { count: 0, summary: {} };
  }
};

export const getSummary = async (params: Record<string, any>) => {
  try {
    let response: any = await PurchaseOrderService.getRecentlyReceived({
      ...params,
      outputType: "summary",
    });

    const summaryObj = response?.data?.data || {};

    const result = {
      orders: Number(summaryObj.orders) || 0,
      totalValue: Number(summaryObj.totalReceivedValue) || 0,
      items: Number(summaryObj.items) || 0,
      damaged: Number(summaryObj.damaged) || 0,
      shortage: Number(summaryObj.shortage) || 0,
      boxes: Number(summaryObj.boxes) || 0,
    };

    return result;
  } catch (error) {
    console.error("Error fetching purchase summary:", error);
    return {
      orders: 0,
      totalValue: 0,
      items: 0,
      damaged: 0,
      shortage: 0,
      boxes: 0,
    };
  }
};

export const defaultSummary = [
  {
    label: "totalValue", // Translation key
    key: "totalValue",
    icon: "indian-rupee",
    iconColor: "#059669", // green
  },
  {
    label: "orders", // Translation key
    key: "orders",
    icon: "package",
    iconColor: "#2563eb", // blue
  },
  {
    label: "products", // Translation key
    key: "products",
    icon: "shopping-bag",
    iconColor: "#f59e42", // orange
  },
  {
    label: "boxes", // Translation key
    key: "boxes",
    icon: "box",
    iconColor: "#7c3aed", // violet
  },
  // {
  //   label: "damaged", // Translation key
  //   key: "damaged",
  //   icon: "alert-triangle",
  //   iconColor: "#dc2626", // red
  // },
  // {
  //   label: "shortage", // Translation key
  //   key: "shortage",
  //   icon: "minus-circle",
  //   iconColor: "#a21caf", // purple
  // },
];
