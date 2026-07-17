import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareFilterParams = (
  filters: Record<string, any>,
  pagination?: PaginationState,
) => {
  let params: Record<string, any> = {
    filter: {},
    groupByCond: "vendor",
    groupByType: filters.groupByType || "total",
  };

  if (pagination) {
    params.page = pagination.activePage;
    params.count = pagination.rowsPerPage;
  } else {
    params.outputType = "count";
  }

  if (filters.search?.trim()) {
    params.search = filters.search.trim();
  }

  if (filters.vendorInfo?._id) {
    params.filter["from.refId"] = filters.vendorInfo.vendorId;
  }

  if (
    filters.dateRange &&
    Array.isArray(filters.dateRange) &&
    filters.dateRange.length === 2
  ) {
    params.startDate = startOfDay(filters.dateRange[0]).toISOString();
    params.endDate = endOfDay(filters.dateRange[1]).toISOString();
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  let response = await PurchaseOrderService.getPoSellerDashboardSummary(
    AuthService.getLoggedInUserId(),
    params,
  );
  const retailerList = response.data?.data?.vendorList || [];

  return retailerList;
};

export const getCount = async (params: Record<string, any>) => {
  const { groupByType, groupByCond, ...rest } = params;

  try {
    const response = await PurchaseOrderService.getPoSellerDashboardSummary(
      AuthService.getLoggedInUserId(),
      {
        ...rest,
      },
    );

    if (params.groupByType === "total") {
      return response.data?.data?.overallSummary?.totalVendors || 0;
    } else if (params.groupByType === "received") {
      return response.data?.data?.receivedSummary?.totalVendors || 0;
    } else if (params.groupByType === "notReceived") {
      return response.data?.data?.notReceivedSummary?.totalVendors || 0;
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};
