import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";

// Prepare filter parameters for API calls
export const prepareParams = (
  filter: any,
  pagination: any,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    filter: {
      $or: [
        {
          "toParty.id": filter.vendorId,
        },
        {
          "fromParty.id": filter.vendorId,
        },
      ],
    },
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.sourceReference = filter.search.trim();
  }

  // Add date range filter
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.filter["transactionDate"] = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  // if (filter.vendorId) {
  //   params.filter["vendorDetails.id"] = filter.vendorId;
  // }

  if (filter.status && filter.status !== "all") {
    params.filter.status = filter.status;
  }

  if (filter.type && filter.type !== "all") {
    params.filter.sourceType = filter.type;
  }

  return params;
};

// Get vendor receivables data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await AccountService.getTransactions(params);
    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      return AccountService.formatTransactionResponse(response.data?.data);
    }
    return [];
  } catch (error) {
    console.error("Error fetching vendor receivables:", error);
    return [];
  }
};

// Get vendor receivables count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await AccountService.getTransactions({
      ...params,
      outputType: "count",
    });
    if (response.statusCode === 200) {
      return {
        count: response.data?.data?.count || 0,
        value: response.data?.totalValue || 0,
      };
    }
    return { count: 0, value: 0 };
  } catch (error) {
    console.error("Error fetching vendor receivables count:", error);
    return { count: 0, value: 0 };
  }
};
