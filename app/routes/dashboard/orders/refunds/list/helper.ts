import { endOfDay, startOfDay } from "date-fns";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";

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

export const REFUND_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "Pending", label: "Pending" },
  { value: "Submitted", label: "Refunded" },
];

export const prepareParams = (
  filter: Record<string, any> = {},
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage || 1,
    count: pagination.rowsPerPage || 10,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { refundSettlementId: { $regex: search, $options: "i" } },
      { orderRefNo: { $regex: search, $options: "i" } },
      { "customerInfo.name": { $regex: search, $options: "i" } },
      { "customerInfo.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.status && filter.status !== "all") {
    params.filter.status = filter.status;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getSummary = async (filter: Record<string, any> = {}) => {
  try {
    const pagination: PaginationState = {
      activePage: 1,
      rowsPerPage: 1,
      startSlNo: 1,
      endSlNo: 1,
      totalRecords: 0,
    };
    const promises = [
      getCount(prepareParams({ ...filter, status: "" }, pagination)),
      getCount(prepareParams({ ...filter, status: "Submitted" }, pagination)),
      getCount(prepareParams({ ...filter, status: "Pending" }, pagination)),
    ];
    const [totalCount, refundedCount, pendingCount] =
      await Promise.all(promises);
    return {
      totalCount: totalCount || 0,
      refundedCount: refundedCount || 0,
      pendingCount: pendingCount || 0,
    };
  } catch (error) {
    console.error("Error fetching summary:", error);
    return {
      totalCount: 0,
      refundedCount: 0,
      pendingCount: 0,
    };
  }
};

export const getData = async (params: Record<string, any>) => {
  const response = await OmsService.getSellerRefundSettlements(params);
  const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
  const formatted = OmsService.formatRefundResponse(rows);
  return formatted.map((row) => {
    const customerId = row.customerInfo?.customerId || row.customerInfo?.refId;
    const isB2B = row.orderType === "B2B";
    const customerLink = customerId
      ? `/dashboard/network/view/${isB2B ? "b2b" : "b2c"}/${customerId}`
      : "";
    return {
      ...row,
      _customerLink: customerLink,
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await OmsService.getSellerRefundSettlements(countParams);
  return response?.data?.data || 0;
};
