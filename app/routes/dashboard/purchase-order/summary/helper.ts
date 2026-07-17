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
    params.filter["vendorInfo.vendorId"] = filter.vendorInfo.vendorId;
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
  const response = await PurchaseOrderService.getPoDashboardSummary(
    AuthService.getLoggedInUserId(),
    params
  );
  return response.data?.data;
};

/**
 * Count of not-received packages. Uses the same source as the "Not Received"
 * tab badge and the Not Received list (getPoPackages, status "Shipped") so the
 * card's Total PO reconciles with the list it links to. A single PO can span
 * multiple shipment packages, so this is package-level, not the PO-level
 * `notReceivedSummary.totalPO` the summary endpoint returns.
 */
export const getNotReceivedCount = async (
  filter: Record<string, any> = {}
): Promise<number> => {
  try {
    const packageFilter: Record<string, any> = { status: "Shipped" };
    if (filter.vendorInfo?._id) {
      packageFilter["from.refId"] = filter.vendorInfo.vendorId;
    }
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      { outputType: "count", filter: packageFilter }
    );
    return response.data?.data?.count || 0;
  } catch (e) {
    return 0;
  }
};
