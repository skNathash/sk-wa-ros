import { endOfDay, startOfDay } from "date-fns";
import OmsService from "~/services/OmsService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for product sales history fetch
export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  // Search by order number or name using $or and $regex
  if (filters.search) {
    const search = filters.search.trim();
    params.filter.$or = [
      {
        orderId: search,
        customerName: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }
  // Type filter
  if (filters.type && filters.type !== "All") {
    params.filter.orderType = filters.type;
  }
  // Status filter
  if (filters.status && filters.status !== "All") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === filters.status
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  // Date range filter
  if (filters.dateRange && filters.dateRange.length === 2) {
    params.filter.orderedDate = {
      $gte: startOfDay(new Date(filters.dateRange[0])),
      $lte: endOfDay(new Date(filters.dateRange[1])),
    };
  }

  return params;
};

// Fetch product sales history data
export const getData = async (dealId: string, params: Record<string, any>) => {
  const response = await SellerService.getDealSalesSummary(dealId, params);
  const d = Array.isArray(response.data?.data) ? response.data?.data : [];
  d.forEach((item: any) => {
    item._statusColor = OmsService.getStatusColor(item.status);
    item._statusLbl = OmsService.getStatusLabel(item.status);
    item._typeColor = OmsService.getOrderTypeColor(item.orderType);
  });
  return d;
};

// Fetch count for pagination
export const getCount = async (dealId: string, params: Record<string, any>) => {
  const { page, count, ...p }: Record<string, any> = { ...params };
  const response = await SellerService.getDealSalesSummary(dealId, {
    ...p,
    outputType: "count",
  });
  return {
    count: response.data?.count || 0,
    totalUnits: response.data?.totalUnits || 0,
    totalRevenue: response.data?.totalSalesValue || 0,
  };
};
