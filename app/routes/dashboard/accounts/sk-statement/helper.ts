import { endOfDay, format, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
  dateRange?: Date[];
  payoutType: string;
}

export const defaultFilter: FilterFormData = {
  // dateRange: [
  //   startOfMonth(sub(new Date(), { months: 3 })),
  //   endOfMonth(new Date()),
  // ],
  search: "",
  payoutType: "all",
};

/**
 * Prepares query parameters from filter form data
 * @param formData - The filter form data
 * @returns Object with query parameters ready for URL search params
 */
export const prepareFilterQueryParams = (
  formData: FilterFormData
): Record<string, any> => {
  const dateFrom = formData.dateRange?.[0]
    ? format(formData.dateRange[0], "yyyy-MM-dd")
    : "";
  const dateTo = formData.dateRange?.[1]
    ? format(formData.dateRange[1], "yyyy-MM-dd")
    : "";

  const params: Record<string, any> = {
    search: formData.search || "",
    payoutType: formData.payoutType || "all",
    dateFrom,
    dateTo,
  };

  return params;
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { createdAt: -1 },
    filter: {
      transaction: { $elemMatch: { _id: AuthService.getUserAccountId() } },
      walletType: "skWallet",
    },
  };

  if (filters.search?.trim()) {
    params.filter.entityId = filters.search?.trim();
  }

  // Add date range filter
  if (
    filters.dateRange &&
    Array.isArray(filters.dateRange) &&
    filters.dateRange.length === 2
  ) {
    params.filter["createdAt"] = {
      $gte: startOfDay(filters.dateRange[0]).toISOString(),
      $lte: endOfDay(filters.dateRange[1]).toISOString(),
    };
  }

  // Add type filter
  if (filters.payoutType && filters.payoutType !== "all") {
    params.filter.payoutType = filters.payoutType;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getSKStatement(params);
  return AccountService.formatTransactionResponse(response?.data?.data || []);
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await AccountService.getSKStatementCount({
    ...rest,
  });
  return response?.data?.data || 0;
};
