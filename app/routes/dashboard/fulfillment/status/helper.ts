import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

export const defaultFilter = {
  search: "",
  orderType: "",
  sortBy: "",
};

const getData = async (params: Record<string, any>) => {
  const fid = AuthService.getLoggedInUserId() || "";
  const response = await SellerService.getSellerOrders(fid, params);
  return response?.data?.data || [];
};

const getCount = async (params: Record<string, any>) => {
  const fid = AuthService.getLoggedInUserId() || "";
  const response = await SellerService.getSellerOrders(fid, {
    ...params,
    outputType: "count",
  });
  return response?.data?.data || 0;
};

const prepareFilters = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  // Handle search filter
  if (filter.search && filter.search.trim()) {
    const searchTerm = filter.search.trim();
    p.filter.$or = [
      { orderRefNo: { $regex: searchTerm, $options: "i" } },
      { "customerInfo.name": { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Handle order type filter
  if (filter.orderType && filter.orderType !== "All") {
    p.filter.orderType = filter.orderType;
  }

  // Handle sort by
  if (filter.sortBy) {
    p.sortBy = filter.sortBy;
    p.sortOrder = filter.sortBy === "recent" ? "desc" : "asc";
  }

  if (filter.status) {
    const statusValues = getStatusByKey(filter.status);
    if (statusValues) {
      const allStatuses: string[] = [];
      const orderStatuses = SellerService.getOrderStatuses();

      // Loop through each status value and get actual statuses from SellerService
      for (const statusValue of statusValues) {
        const statusObj = orderStatuses.find(
          (status) =>
            status.value === statusValue ||
            status.statuses.includes(statusValue)
        );
        if (statusObj) {
          allStatuses.push(...statusObj.statuses);
        } else {
          // If not found in SellerService, add the status value as is
          allStatuses.push(statusValue);
        }
      }

      p.filter.status = { $in: allStatuses };
    }
  }

  // Handle specific status mappings for fulfillment
  // if (filter.status === "approval-pending") {
  //   p.filter.status = "Created";
  // } else if (filter.status === "picked") {
  //   p.filter.status = "Picked";
  // } else if (filter.status === "packed") {
  //   p.filter.status = "Packed";
  // } else if (filter.status === "shipped") {
  //   p.filter.status = "Shipped";
  // } else if (filter.status === "delivered") {
  //   p.filter.status = "Delivered";
  // }

  return p;
};

const getStatusByKey = (statusKey: string): string[] | undefined => {
  const fulfillmentStatusMappings: Record<string, string[]> = {
    "approval-pending": ["Created", "Pending"],
    picked: ["Picking", "Picked"],
    "packing-invoiced": ["Packing", "Packed"],
    "pending-shipment": ["Invoiced", "Pending Shipment"],
    shipped: ["Shipped"],
    delivered: ["Delivered"],
  };

  return fulfillmentStatusMappings[statusKey];
};

export { getCount, getData, prepareFilters };
