import { endOfDay, startOfDay } from "date-fns";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { PaginationState } from "~/types/CommonTypes";

// Types for filter and pagination
interface Filter {
  search?: string;
  dateRange?: [Date, Date];
  activeTab?: string;
  status?: string;
  feature?: string;
}

export const mapSelectedData = (
  data: Record<string, any>[],
  selected: Record<string, any>
) => {
  return data.map((item) => ({
    ...item,
    selected: selected[item._id]?.selected || false,
  }));
};

// Prepare filter parameters for API calls
export const prepareParams = (filter: Filter, pagination: PaginationState) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { createdAt: -1 },
    filter: {
      locationStatus: "Unallocated",
    },
  };

  // Add search filter
  if (filter.search?.trim()) {
    params.filter.$or = [
      { _id: { $regex: filter.search.trim(), $options: "i" } },
      { "vendorDetails.name": { $regex: filter.search.trim(), $options: "i" } },
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

  // Overwrite status based on activeTab
  if (filter.activeTab === "receive-orders") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x: any) => x.value === "Approved"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  } else if (filter.activeTab === "draft-orders") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x: any) => x.value === "Draft"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  } else if (filter.activeTab === "rejected-orders") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x: any) => x.value === "Rejected"
    )?.status;
    if (statuses) {
      params.filter.status = { $in: statuses };
    }
  } else if (filter.status) {
    const found = PurchaseOrderService.getStatuses().find(
      (x: any) => x.value === filter.status
    )?.status;
    if (found) params.filter.status = { $in: found };
  }

  if (filter.feature === "receive") {
    const statuses = PurchaseOrderService.getStatuses().find(
      (x: any) => x.value === "Approved"
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
    const response = await SellerCatalogService.getProducts(params);
    if (response.statusCode === 200 && Array.isArray(response.data?.data)) {
      return SellerCatalogService.formatProductResponse(response.data?.data);
    }
    return [];
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
};

// Get purchase orders count from API
export const getCount = async (params: Record<string, any>) => {
  const p = { ...params, outputType: "count" };
  try {
    const response = await SellerCatalogService.getProducts(p);
    if (response.statusCode === 200) {
      return response.data?.count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error fetching purchase orders count:", error);
    return 0;
  }
};
