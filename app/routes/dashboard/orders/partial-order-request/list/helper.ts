import { startOfDay, endOfDay, format } from "date-fns";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
  status: string;
  dateRange: Date[];
}

export const defaultFilter: FilterFormData = {
  search: "",
  status: "all",
  dateRange: [],
};

import { List, Clock, CheckCircle, XCircle } from "lucide-react";
import AuthService from "~/services/AuthService";

export const defaultSummary = [
  { label: "Total", value: 0, key: "total", color: "primary", icon: List },
  {
    label: "Approval Pending",
    value: 0,
    key: "approval pending",
    color: "warning",
    icon: Clock,
  },
  {
    label: "Approved",
    value: 0,
    key: "approved",
    color: "success",
    icon: CheckCircle,
  },
  {
    label: "Rejected",
    value: 0,
    key: "rejected",
    color: "danger",
    icon: XCircle,
  },
];

export const prepareParams = (
  filter: Record<string, any> = {},
  pagination: PaginationState = {
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage || 1,
    count: pagination.rowsPerPage || 20,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { requestId: { $regex: search, $options: "i" } },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.mobile": { $regex: search, $options: "i" } },
    ];
  }

  if (filter.status && filter.status !== "all") {
    params.filter.status = filter.status;
    // if (filter.status === "Pending") {
    //   params.filter["customerInfo.customerId"] =
    //     AuthService.getLoggedInUserId();
    // }
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // Clean up empty filter
  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await OmsService.getSplitRequestCustomerList(params);
  // expected: response.data.data => array
  const items = response?.data?.data || [];
  return items.map((item: Record<string, any>) =>
    OmsService.formatSplitRequestCustomerList(item),
  );
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await OmsService.getSplitRequestCustomerList(countParams);
  return response?.data?.data?.count || 0;
};

export const getSummary = async (filter: Record<string, any> = {}) => {
  const [total, pending, approved, rejected] = await Promise.all([
    getCount(prepareParams({ ...filter, status: "all" })),
    getCount(prepareParams({ ...filter, status: "Pending" })),
    getCount(prepareParams({ ...filter, status: "Approved" })),
    getCount(prepareParams({ ...filter, status: "Rejected" })),
  ]);

  return {
    total,
    "approval pending": pending,
    approved,
    rejected,
  };
};

export default {
  prepareParams,
  getData,
  getCount,
  getSummary,
};
