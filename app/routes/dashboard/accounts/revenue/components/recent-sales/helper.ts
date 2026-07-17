import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      status: "Delivered",
    },
    sort: {
      orderedDate: -1,
    },
  };

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await SellerService.getSellerOrders(
    AuthService.getLoggedInUserId() || "",
    params
  );
  return SellerService.formatOrderResponse(response?.data?.data || []);
};

export const getCount = async (params: Record<string, any>) => {
  const response = await SellerService.getSellerOrders(
    AuthService.getLoggedInUserId() || "",
    { ...params, outputType: "count" }
  );
  return response?.data?.data || 0;
};
