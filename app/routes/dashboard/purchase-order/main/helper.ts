import { endOfDay, startOfDay, subYears } from "date-fns";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import InventoryDashboardService from "~/services/InventoryDashboardService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";

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

/** SK Wallet balance shown in the hub hero. Returns null when unavailable. */
export const getSkWalletBalance = async (): Promise<number | null> => {
  try {
    const response = await FranchiseService.getBalance(
      AuthService.getLoggedInUserId(true),
    );
    return response?.balance ?? 0;
  } catch (e) {
    return null;
  }
};

/**
 * Reorder banner count. Uses the same source the inventory dashboard's
 * "Reorder required" list uses (inventory-risk analytics, type
 * "reorderRequired"), so the banner matches that page.
 */
export const getReorderSkuCount = async (): Promise<number> => {
  try {
    const response = await InventoryDashboardService.getInventoryRisk(
      "reorderRequired",
      { outputType: "count" },
    );
    return response?.data?.count || 0;
  } catch (e) {
    return 0;
  }
};

/** Total vendors on the franchise's own list ("Local vendors" row). */
export const getVendorCount = async (): Promise<number> => {
  try {
    const response = await VendorService.getDashboardVendorList({
      outputType: "count",
    });
    return response?.data?.count || 0;
  } catch (e) {
    return 0;
  }
};

/** Distance (km) used to scope the "Sellers on SK" nearby-retailers count. */
const NEARBY_SELLERS_DISTANCE_KM = 100;

/**
 * Network ("Sellers on SK") count. Uses nearby retailers within a fixed
 * distance, the same source the Network Purchase seller list uses.
 */
export const getNetworkSellerCount = async (): Promise<number> => {
  try {
    const response = await FranchiseService.getRetailersNearby({
      distance: NEARBY_SELLERS_DISTANCE_KM,
      outputType: "count",
    });
    return response?.data?.data || 0;
  } catch (e) {
    return 0;
  }
};

const ACTIVE_PO_STATUSES = ["Approved", "Partially Received"];

/** Active purchase orders: approved or partially received, not yet closed. */
export const getActivePoCount = async (): Promise<number> => {
  try {
    const response = await PurchaseOrderService.getCount({
      filter: { status: { $in: ACTIVE_PO_STATUSES } },
    });
    return response?.data?.count || 0;
  } catch (e) {
    return 0;
  }
};

/** Active POs whose expected delivery date falls today ("arriving today"). */
export const getArrivingTodayPoCount = async (): Promise<number> => {
  try {
    const now = new Date();
    const response = await PurchaseOrderService.getCount({
      filter: {
        status: { $in: ACTIVE_PO_STATUSES },
        expectedDeliveryDate: {
          $gte: startOfDay(now).toISOString(),
          $lte: endOfDay(now).toISOString(),
        },
      },
    });
    return response?.data?.count || 0;
  } catch (e) {
    return 0;
  }
};
