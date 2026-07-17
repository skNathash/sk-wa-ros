import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage ?? 1,
    count: pagination?.rowsPerPage ?? 20,
    filter: {
      sourceType: "EXPENSE",
    },
  };

  if (filters.search?.trim()) {
    params.filter.$or = [
      {
        notes: filters.search.trim(),
      },
      {
        description: filters.search.trim(),
      },
    ];
  }

  if (filters.dateRange && filters.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filters.dateRange[0]).toISOString(),
      $lte: endOfDay(filters.dateRange[1]).toISOString(),
    };
  }

  return params;
};

export const getCount = async (params: Record<string, any>) => {
  const response = await AccountService.getStatements({
    ...params,
    outputType: "count",
  });
  return response.data?.count || 0;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getStatements({
    ...params,
  });
  return AccountService.formatStatementResponse(response.data?.data || []);
};
