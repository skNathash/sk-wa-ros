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
    filter: {
      $or: [
        {
          "toInfo.id": filters.customerId,
        },
        {
          "fromInfo.id": filters.customerId,
        },
      ],
    },
  };

  if (filters.search?.trim()) {
    params.filter.$or = [
      {
        sourceReference: filters.search.trim(),
      },
    ];
  }

  if (filters.dateRange && filters.dateRange.length === 2) {
    params.filter.createdAt = {
      $gte: startOfDay(filters.dateRange[0]),
      $lte: endOfDay(filters.dateRange[1]),
    };
  }

  // If sort is provided, map to API expected format if needed
  if (sort && sort.key) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getFranchisePaymentTransactions(params);
  return response?.data?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await AccountService.getFranchisePaymentTransactions({
    ...rest,
    outputType: "count",
  });
  return response?.data?.data?.count || 0;
};
