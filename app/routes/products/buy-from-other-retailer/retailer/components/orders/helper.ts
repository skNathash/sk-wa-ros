import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface FilterFormData {
  retailerId: string;
}

export const defaultFilter = {
  retailerId: "",
};

export const prepareParams = (
  filter: FilterFormData,
  pagination: PaginationState,
  sort?: { key: string; value: SortValue },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      $or: [
        {
          "customerInfo.customerId": AuthService.getLoggedInUserId(),
        },
        {
          "sellerInfo.franchiseId": AuthService.getLoggedInUserId(),
        },
      ],
    },
  };

  // Sorting (if needed)
  if (sort?.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>, fid?: string) => {
  const fidToUse = fid || "";
  const response = await OmsService.getSalesOrders(fidToUse, params);

  const orders = Array.isArray(response?.data?.data)
    ? response?.data?.data
    : [];

  return OmsService.formatOrderResponse(orders);
};

export const getCount = async (params: Record<string, any>, fid?: string) => {
  const countParams = { ...params, outputType: "count" };
  const fidToUse = fid || "";
  const response = await OmsService.getSalesOrders(fidToUse, countParams);

  const totalOrders = response?.data?.data || 0;
  const metrics = response?.data?.metrics || {};

  return {
    totalOrders: totalOrders || 0,
    totalRevenue: metrics.totalSalesValue || 0,
    avgOrderValue: metrics.avgOrderValue || 0,
    uniqueCustomers: metrics.uniqueCustomers || 0,
  };
};
