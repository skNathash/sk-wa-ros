import { endOfDay, startOfDay, subYears } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

export const prepareFilterParams = (filter: Record<string, any>) => {
  let params: Record<string, any> = {
    outputType: "count",
    filter: {},
  };

  if (filter.search?.trim()) {
    // params.filter.orderId = { $regex: filter.search.trim(), $options: "i" };
    params.search = filter.search.trim();
  }

  if (filter.vendorInfo?._id) {
    params.filter["from.refId"] = filter.vendorInfo.vendorId;
  }

  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    params.startDate = startOfDay(filter.dateRange[0]).toISOString();
    params.endDate = endOfDay(filter.dateRange[1]).toISOString();
  }

  return params;
};

export const getLastFourYearsDateRange = () => {
  const now = new Date();
  return {
    startDate: startOfDay(subYears(now, 4)).toISOString(),
    endDate: endOfDay(now).toISOString(),
  };
};

export const getData = async (params: Record<string, any>) => {
  let response = await PurchaseOrderService.getPoSellerDashboardSummary(
    AuthService.getLoggedInUserId(),
    params
  );
  return response.data?.data;
};
