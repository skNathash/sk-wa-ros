import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";
import type { PaginationState } from "~/types/CommonTypes";
import { startOfDay, endOfDay } from "date-fns";
import SellerService from "~/services/SellerService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

// Prepare params for product sales history fetch
export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    // sort: {
    //   [sort.key]: sort.value === "asc" ? 1 : -1,
    // },
  };

  // Search by order number or name using $or and $regex
  if (filters.search) {
    const search = filters.search.trim();
    params.filter.$or = [
      {
        orderId: search,
        vendorName: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }
  // Type filter
  if (filters.type && filters.type !== "All") {
    params.filter.type = filters.type;
  }
  // Status filter
  if (filters.status && filters.status !== "All") {
    const statusOption = PurchaseOrderService.getStatuses().find(
      (s) => s.value === filters.status
    );
    if (statusOption) {
      params.filter.status = { $in: [statusOption.value] };
    }
  }
  // Date range filter
  if (filters.dateRange && filters.dateRange.length === 2) {
    params.filter.poDate = {
      $gte: startOfDay(new Date(filters.dateRange[0])),
      $lte: endOfDay(new Date(filters.dateRange[1])),
    };
  }

  return params;
};

// Fetch product sales history data
export const getData = async (dealId: string, params: Record<string, any>) => {
  const response = await SellerService.getDealPurchaseSummary(dealId, params);
  const d = Array.isArray(response.data?.data) ? response.data?.data : [];
  return d.map((e: any) => {
    const statusOption = PurchaseOrderService.getStatuses().find((s) =>
      s.status.includes(e.status)
    );
    return {
      ...e,
      _statusLbl: statusOption ? statusOption.label : e.status,
      _statusColor: statusOption ? statusOption.color : "default",
    };
  });
};

// Fetch count for pagination
export const getCount = async (dealId: string, params: Record<string, any>) => {
  const { page, count, ...p } = { ...params };
  const response = await SellerService.getDealPurchaseSummary(dealId, {
    ...p,
    outputType: "count",
  });
  return response.data?.count || 0;
};
