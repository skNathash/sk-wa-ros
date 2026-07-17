import { endOfDay, format, startOfDay } from "date-fns";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
  planId?: string;
  dateFrom?: string;
  dateTo?: string;
  // Add other filters as needed
}

export const defaultFilter: FilterFormData = {
  search: "",
  planId: FranchiseService.getPlanId() || "",
  dateFrom: "",
  dateTo: "",
};

/**
 * Prepares query parameters from filter form data
 * @param formData - The filter form data
 * @returns Object with query parameters ready for URL search params
 */
export const prepareFilterQueryParams = (
  formData: FilterFormData
): Record<string, any> => {
  const params: Record<string, any> = {
    search: formData.search || "",
    dateFrom: formData.dateFrom || "",
    dateTo: formData.dateTo || "",
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
    filter: {},
  };

  if (filters.search?.trim()) {
    const s = filters.search?.trim();
    params.filter.$or = [
      { refId: { $regex: s } },
      { description: { $regex: s } },
      { planName: { $regex: s } },
      { planRefId: { $regex: s } },
      { transactionId: { $regex: s } },
    ];
  }

  // Filter by selected plan
  if (
    filters.planId &&
    typeof filters.planId === "string" &&
    filters.planId.trim() !== ""
  ) {
    params.filter.planId = filters.planId;
  }

  // Add date range filter
  if (filters.dateFrom && filters.dateTo) {
    params.filter["createdAt"] = {
      $gte: startOfDay(new Date(filters.dateFrom)).toISOString(),
      $lte: endOfDay(new Date(filters.dateTo)).toISOString(),
    };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getPlatformFeeStatement(params);
  return (response?.data?.data || []).map((item: any) =>
    FranchiseService.formatPlanStatementItem(item)
  );
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await FranchiseService.getPlatformFeeStatement({
    ...rest,
    outputType: "count",
  });
  return response?.data?.count || 0;
};
