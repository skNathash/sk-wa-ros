import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: { key: string; value: "asc" | "desc" | undefined }
) => {
  const params: any = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {
      status: "Shipped",
    },
  };

  if (sort && sort.key && sort.value) {
    params.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  }

  if (filter.search?.trim()) {
    const q = filter.search.trim();
    params.filter.$or = [
      // Box No (refNo)
      { refNo: q },
      // Order ID (orderData.refId)
      { "orderData.refId": q },
      // Invoice No (invoiceData.refId)
      { "invoiceData.refId": q },
      // Vendor name (from.name) - partial, case-insensitive
      { "from.name": { $regex: q, $options: "i" } },
      // Vendor id (from.id) - exact
      { "from.refId": q },
    ];
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

  if (
    filter.receivedDateRange &&
    Array.isArray(filter.receivedDateRange) &&
    filter.receivedDateRange.length === 2
  ) {
    params.filter.receiptConfirmedAt = {
      $gte: startOfDay(filter.receivedDateRange[0]).toISOString(),
      $lte: endOfDay(filter.receivedDateRange[1]).toISOString(),
    };
  }

  if (filter.purchasedFrom && filter.purchasedFrom !== "All") {
    if (filter.purchasedFrom === "Local Vendor") {
      params.filter.source = "manual";
    } else if (filter.purchasedFrom === "StoreKing") {
      params.filter.source = "sk_order";
    } else if (filter.purchasedFrom === "Added Stock") {
      params.filter.source = "add_stock_inventory";
    }
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    // call packages to ensure packages cache is warmed like list helper
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      params
    );

    const data = response.data?.data;
    if (response.statusCode === 200 && Array.isArray(data)) {
      return data.map((e) => PurchaseOrderService.formatPoDashboardSummary(e));
    }
    return [];
  } catch (error) {
    console.error("Error fetching not-received purchase orders:", error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  try {
    const { page, count, ...rest } = params;
    const response = await PurchaseOrderService.getPoPackages(
      AuthService.getLoggedInUserId() || "",
      { ...rest, outputType: "count" }
    );
    if (response.statusCode === 200) return response.data?.data?.count || 0;
    return 0;
  } catch (error) {
    console.error("Error fetching not-received purchase orders count:", error);
    return 0;
  }
};
