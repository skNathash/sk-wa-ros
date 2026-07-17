import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {},
  };

  // Add search filter
  if (filters.search?.trim()) {
    params.filter.$or = [
      {
        sourceReference: filters.search.trim(),
      },
      {
        "toParty.name": {
          $regex: filters.search.trim(),
          $options: "i",
        },
      },
      {
        "toParty.refId": filters.search.trim(),
      },
    ];
  }

  // Add date range filter
  if (
    filters.dateRange &&
    Array.isArray(filters.dateRange) &&
    filters.dateRange.length === 2
  ) {
    params.filter["transactionDate"] = {
      $gte: startOfDay(filters.dateRange[0]).toISOString(),
      $lte: endOfDay(filters.dateRange[1]).toISOString(),
    };
  }

  // Add status filter
  if (filters.status && filters.status !== "all") {
    params.filter.status = filters.status;
  }

  // Add type filter
  if (filters.type && filters.type !== "all") {
    params.filter.sourceType = filters.type;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getTransactions(params);
  return AccountService.formatTransactionResponse(response?.data?.data || []);
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await AccountService.getTransactions({
    ...rest,
    outputType: "count",
  });
  return response?.data?.data?.count || 0;
};
