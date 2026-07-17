import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        receiptId: {
          $regex: search,
          $options: "i",
        },
      },
      {
        refId: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // no type filter for purchase commission

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getCommissionInvoices(params);
  return response?.data?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await AccountService.getCommissionInvoices({
    ...rest,
    outputType: "count",
  });
  return {
    count: response?.data?.data?.count || 0,
    amount: response?.data?.data?.totalAmount || 0,
  };
};
