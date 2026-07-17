import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
  dateRange: Date[];
  status: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
  dateRange: [],
  status: "all",
};

export const prepareParams = (
  filter: FilterFormData,
  pagination: PaginationState,
  sort: { key: string; value: SortValue },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { orderId: { $regex: search, $options: "i" } },
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.status && filter.status !== "all") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === filter.status,
    );
    if (statusOption?.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  if (filter.dateRange?.length === 2) {
    params.filter.orderedDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }
  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    params,
  );
  const orders = Array.isArray(response?.data?.data)
    ? response?.data?.data
    : [];
  return OmsService.formatOrderResponse(orders);
};

export const getCount = async (params: Record<string, any>) => {
  const response = await OmsService.getSalesOrders(
    AuthService.getLoggedInUserId() || "",
    { ...params, outputType: "count" },
  );
  return { totalOrders: response?.data?.data || 0 };
};
