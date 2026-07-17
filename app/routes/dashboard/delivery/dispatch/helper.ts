import { startOfDay, endOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import SellerService from "~/services/SellerService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      status: { $in: ["Invoiced", "Pending Shipment"] },
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.orderDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.type = filter.type;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export async function getData(params: Record<string, any>) {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params
  );
  return OmsService.formatOrderResponse(response?.data?.data || []);
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
