import AuthService from "~/services/AuthService";
import CustomerService from "~/services/CustomerService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
};

/**
 * Rounds a suggested credit limit to a clean, presentable value.
 */
const roundLimit = (value: number) => {
  if (value <= 0) return 0;
  if (value < 1000) return Math.ceil(value / 50) * 50;
  return Math.ceil(value / 100) * 100;
};

/**
 * Formats a raw network customer into a "ready to unlock" candidate,
 * deriving the transaction stats and suggested credit limit shown in the list.
 */
const formatItem = (item: Record<string, any>) => {
  const name = (item?.name || "").toString().trim();
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "";

  const location =
    item?.address?.city && item?.address?.state
      ? `${item.address.city}, ${item.address.state}`
      : item?.address?.city || item?.address?.state || "";

  const stats = item?.orderStats || item?.transactionSummary || {};

  const bills = stats.totalOrders ?? item?.totalOrders ?? item?.billsCount ?? 0;
  const avgBillValue =
    stats.avgOrderValue ?? item?.avgOrderValue ?? item?.avgBillValue ?? 0;
  const fulfillmentRate = Math.round(
    stats.fulfillmentRate ??
      item?.fulfillmentRate ??
      item?.paymentReliability ??
      0,
  );

  // Prefer a backend-provided suggestion; otherwise derive one from the
  // customer's average bill value scaled by how established they are.
  const suggestedLimit = roundLimit(
    item?.suggestedCreditLimit ??
      item?.suggestedLimit ??
      avgBillValue * (bills >= 20 ? 1.5 : bills >= 10 ? 1.2 : 1),
  );

  return {
    ...item,
    id: item?._id || item?.id,
    initials,
    location,
    bills,
    avgBillValue,
    fulfillmentRate,
    suggestedLimit,
  };
};

export const prepareParams = (
  filter: FilterFormData,
  pagination: PaginationState,
  sort: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: sort.key || "name",
    order: sort.value || "asc",
    // Include paylater info so already-enrolled customers can be excluded.
    includePaylater: true,
    // Only customers who are eligible but do not yet have paylater.
    paylaterEligible: true,
    hasPaylater: false,
  };

  const search = filter.search?.trim();
  if (search) {
    params.search = search;
  }

  try {
    if (!AuthService.isSkSeller()) {
      params.createdByMe = true;
    }
  } catch (e) {
    // noop
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await CustomerService.getCustomerNetwork(params);
  const list = Array.isArray(response?.data?.data) ? response.data.data : [];
  return list.map(formatItem);
};

export const getCount = async (params: Record<string, any>) => {
  const p = { ...params };
  delete p.page;
  delete p.limit;
  delete p.sort;
  delete p.order;

  const response = await CustomerService.getCustomerNetworkCount(p);
  return response?.data?.data?.count || 0;
};
