import { endOfDay, startOfDay } from "date-fns";
import PosService from "~/services/PosService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for RSP config history fetch
export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      // "franchiseInfo.id": AuthService.getLoggedInUserId(),
    },
    sort: {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    },
  };

  // Handle search filter
  if (filters.search && filters.search.trim()) {
    params.filter.$or = [
      { dealName: { $regex: filters.search.trim(), $options: "i" } },
      { dealRefId: filters.search.trim() },
    ];
  }

  // Handle type filter
  if (filters.type && filters.type !== "All") {
    params.filter.applicableFor = filters.type;
  }

  // Handle date range filter
  if (filters.dateRange && filters.dateRange.length === 2) {
    params.filter.createdAt = {
      $gte: startOfDay(filters.dateRange[0]),
      $lte: endOfDay(filters.dateRange[1]),
    };
  }

  // Handle price mode filter (only 'fixed' supported here)
  if (filters.priceMode) {
    const mode = (filters.priceMode || "").toString();
    if (mode !== "all") {
      // For history we filter based on the new configuration being fixed price
      params.filter["newData.isFixedPrice"] = true;
    }
  }

  return params;
};

// Fetch RSP config history data
export const getData = async (params: Record<string, any>) => {
  const response = await PosService.getSellerPriceConfigLogs(params);
  return PosService.formatPriceConfigLogData(response.data?.data || []);
};

// Fetch count for pagination
export const getCount = async (params: Record<string, any>) => {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.count;
  delete p.sort;

  const response = await PosService.getSellerPriceConfigLogs(p);
  return response.data?.data?.totalCount || 0;
};
