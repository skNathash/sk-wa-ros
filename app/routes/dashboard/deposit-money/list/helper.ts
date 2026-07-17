import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: Record<string, any>,
  sort?: { key: string; value: string | undefined }
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      franchiseId: AuthService.getLoggedInUserId(true),
    },
  };

  if (sort?.key && sort?.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (filter.type) {
    params.filter.type = filter.type;
  }

  // other filters can be added here

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await AccountService.getReceipts(params || {});
    if (response.statusCode === 200) {
      // normalize to array
      return (response.data?.data || response.data || []) as any[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    // AccountService provides a separate count endpoint
    const response = await AccountService.getReceiptsCount(params);
    if (response.statusCode === 200) {
      return response.data || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching receipts count:", error);
    return 0;
  }
};
