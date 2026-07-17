import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

export const getData = async (params: Record<string, any>, tab: string) => {
  try {
    // ensure packages cache is warmed similar to other PO helpers
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      params
    );

    const data = response.data?.data;
    if (response.statusCode === 200 && Array.isArray(data)) {
      // Attach `isReceived` flag for UI logic. Consider boxes with status 'Delivered' as received.
      return data.map((b: Record<string, any>) => ({
        ...b,
        isReceived: (b.status || "").toString().toLowerCase() === "delivered",
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching boxes data:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>, tab: string) => {
  try {
    const { page, count, ...rest } = params;
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      { ...rest, outputType: "count" }
    );
    if (response.statusCode === 200) {
      const data = response.data?.data || {};
      return {
        count: data.count || 0,
        totalItems: data.totalItems || 0,
        totalUnits: data.totalUnits || 0,
        totalValue: data.totalValue || 0,
      };
    }

    return { count: 0, totalItems: 0, totalUnits: 0, totalValue: 0 };
  } catch (error) {
    console.error("Error fetching boxes count:", error);
    return { count: 0, totalItems: 0, totalUnits: 0, totalValue: 0 };
  }
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  // map tab to status
  if (filters.tab === "not-received") {
    params.filter.status = "Shipped";
  } else if (filters.tab === "received") {
    // use Delivered for received boxes
    params.filter.status = "Delivered";
  }

  if (filters.orderId) {
    params.filter["orderData.id"] = filters.orderId;
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    params.filter.$or = [
      { refNo: q },
      { "orderData.refId": q },
      { "invoiceData.refId": q },
      { "from.name": { $regex: q, $options: "i" } },
      { "from.id": q },
    ];
  }

  if (
    filters.dateRange &&
    Array.isArray(filters.dateRange) &&
    filters.dateRange.length === 2
  ) {
    params.filter.createdAt = {
      $gte: startOfDay(filters.dateRange[0]).toISOString(),
      $lte: endOfDay(filters.dateRange[1]).toISOString(),
    };
  }

  return params;
};
