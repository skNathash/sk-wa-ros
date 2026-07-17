import { endOfDay, startOfDay, sub } from "date-fns";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import AuthService from "~/services/AuthService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export const defaultFilter = {
  dateRange: [sub(new Date(), { days: 30 }), new Date()],
  search: "",
  ownerType: "Customer",
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: SortValue }
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  // ownerId filter (customer id passed as route param)
  if (filter.ownerId) {
    params.filter.customerId = filter.ownerId;
  }

  // Search - use remarks or transactionType
  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { reason: { $regex: search, $options: "i" } },
      { transactionType: { $regex: search, $options: "i" } },
    ];
  }

  // Date Range - normalize to ISO strings (start/end of day)
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    // params.filter.createdAt = {
    //   $gte: startOfDay(filter.dateRange[0]).toISOString(),
    //   $lte: endOfDay(filter.dateRange[1]).toISOString(),
    // };
  }

  // Sorting
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.type = filter.type;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  // LoyaltyPointService.getStatement returns an object with data
  const response = await LoyaltyPointService.getStatement({ ...params });
  return response?.data?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await LoyaltyPointService.getStatement(countParams);
  return response?.data?.total || 0;
};
