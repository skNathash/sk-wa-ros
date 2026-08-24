import { endOfDay, startOfDay } from "date-fns";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "Total PO Value",
    key: "totalPoValue",
    icon: "indian-rupee",
    value: 0,
    color: "primary",
  },
  {
    label: "Pending Orders",
    key: "pendingOrders",
    icon: "hourglass",
    value: 0,
    color: "warning",
  },
  {
    label: "Received Today",
    key: "receivedToday",
    icon: "calendar",
    value: 0,
    color: "success",
  },
  {
    label: "Total PO",
    key: "totalPo",
    icon: "truck",
    value: 0,
    color: "info",
  },
];

export const prepareFilterParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: SortProps
) => {
  const params: any = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  // Sorting logic
  if (sort && sort.key && sort.value) {
    params.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  }

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.$or = [
      { orderId: filter.search.trim() },
      { "vendorInfo.name": { $regex: filter.search.trim(), $options: "i" } },
    ];
  }

  // Add date range filter
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

  if (filter.vendorId) {
    params.filter["vendorInfo.id"] = filter.vendorId;
  }

  // Status logic
  if (filter.status && filter.status !== "All") {
    const found = PurchaseOrderService.getStatuses().find(
      (x) => x.value === filter.status
    )?.status;
    if (found) params.filter.status = { $in: found };
  }

  if (filter.feature === "receive") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x) => x.value === "Approved"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  }

  return params;
};

// Get purchase orders data from API
export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getList(params);
    const data = response.data?.data;
    if (response.statusCode === 200 && Array.isArray(data)) {
      return data.map((e) => PurchaseOrderService.formatPurchaseOrderData(e));
    }
    return [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
};

// Get purchase orders count from API
export const getCount = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getCount(params);
    if (response.statusCode === 200) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching purchase orders count:", error);
    return 0;
  }
};

export interface PurchaseOrderSummary {
  /** Lifetime PO count and value placed with this vendor. */
  totalCount: number;
  totalValue: number;
  cancelledCount: number;
  /** Amount already settled, and how many POs were delivered. */
  paidAmount: number;
  deliveredCount: number;
  /** Amount still to be paid (incl. paylater) and the PO count behind it. */
  pendingAmount: number;
  pendingCount: number;
}

export const defaultSummaryData: PurchaseOrderSummary = {
  totalCount: 0,
  totalValue: 0,
  cancelledCount: 0,
  paidAmount: 0,
  deliveredCount: 0,
  pendingAmount: 0,
  pendingCount: 0,
};

/**
 * Query params for the summary call: the same list filters (search, date
 * range, status) so the cards stay in sync with the table. Vendor and paging
 * are dropped — the vendor is in the path and analytics returns no rows.
 */
export const prepareSummaryParams = (filter: Record<string, any> = {}) => {
  const { filter: listFilter } = prepareFilterParams(filter);

  delete listFilter["vendorInfo.id"];

  const params: Record<string, any> = { type: "purchaseorder" };

  if (Object.keys(listFilter).length) {
    params.filter = listFilter;
  }

  return params;
};

/**
 * Vendor purchase-order summary cards, narrowed by the current list filter.
 * API: vendor/{vendorId}/analytics?type=purchaseorder
 * Returns zeroed values on failure so the strip still renders.
 */
export const getSummary = async (
  vendorId: string,
  filter: Record<string, any> = {},
): Promise<PurchaseOrderSummary> => {
  if (!vendorId) return { ...defaultSummaryData };

  try {
    const response = await VendorService.getVendorAnalyticsByType(
      vendorId,
      prepareSummaryParams(filter),
    );

    if (response.statusCode !== 200) return { ...defaultSummaryData };

    const data = response.data?.data || {};

    return {
      totalCount: data.totalPurchaseOrders?.count || 0,
      totalValue: data.totalPurchaseOrders?.value || 0,
      cancelledCount: data.totalPurchaseOrders?.cancelledCount || 0,
      paidAmount: data.paidToVendor?.amount || 0,
      deliveredCount: data.paidToVendor?.deliveredPOs || 0,
      pendingAmount: data.paymentPending?.amount || 0,
      pendingCount: data.paymentPending?.poCount || 0,
    };
  } catch (error) {
    console.error("Error fetching vendor purchase order summary:", error);
    return { ...defaultSummaryData };
  }
};
