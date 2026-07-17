import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: "Shipped",
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderRefNo: search },
      { "invoices.shippingDetails.name": { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  return params;
};

export async function getData(params: Record<string, any>) {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params
  );
  return OmsService.formatOrderResponse(response?.data?.data || []) || [];
}

export async function getCount(params: Record<string, any>) {
  const p: Record<string, any> = { ...params, outputType: "count" };

  delete p.page;
  delete p.limit;

  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    p
  );
  return response?.data?.data || 0;
}
