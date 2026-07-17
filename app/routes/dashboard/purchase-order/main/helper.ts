import { endOfDay, startOfDay, subYears } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

const getLastFourYearsDateRange = () => {
  const now = new Date();
  return {
    startDate: startOfDay(subYears(now, 4)).toISOString(),
    endDate: endOfDay(now).toISOString(),
  };
};

/**
 * Vendor Purchase pending count. Uses the same source the Vendor Purchase
 * summary page uses for its "Not Received" card (getPoPackages, status
 * "Shipped"), so the main-page badge always matches that page.
 */
export const getVendorPendingCount = async (): Promise<number> => {
  try {
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      {
        outputType: "count",
        filter: { status: "Shipped" },
      },
    );
    return response.data?.data?.count || 0;
  } catch (e) {
    return 0;
  }
};

/**
 * Network Purchase pending count. Uses the same source the Network Purchase
 * (seller) summary page uses for its "Not Received" card: the seller dashboard
 * summary over a 4-year window (Not Received ignores the selected date range).
 */
export const getNetworkPendingCount = async (): Promise<number> => {
  try {
    const response = await PurchaseOrderService.getPoSellerDashboardSummary(
      AuthService.getLoggedInUserId(),
      {
        outputType: "count",
        filter: {},
        ...getLastFourYearsDateRange(),
      },
    );
    return response.data?.data?.notReceivedSummary?.totalPO || 0;
  } catch (e) {
    return 0;
  }
};
