import AuthService from "~/services/AuthService";
import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import type { UserItem, UserType } from "../../helper";

export interface FilterFormData {
  search: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
};

const roundLimit = (value: number) => {
  if (value <= 0) return 0;
  if (value < 1000) return Math.ceil(value / 50) * 50;
  return Math.ceil(value / 100) * 100;
};

/**
 * Normalizes a network row into the shape the unlock page reads — the display
 * fields (initials, location) and the derived stats are computed here so the
 * list and the unlock view never have to dig through the raw response.
 */
const formatItem = (item: Record<string, any>, type: UserType): UserItem => {
  const displayName = (item?.name || item?.ownerDetails?.name || "")
    .toString()
    .trim();
  const parts = displayName.split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();

  let location = "";
  if (type === "b2c") {
    const city = item?.address?.city || "";
    const state = item?.address?.state || "";
    location = [city, state].filter(Boolean).join(", ");
  } else {
    const cityOrTown = item?.city || item?.town || "";
    const state = item?.state || "";
    location = [cityOrTown, state].filter(Boolean).join(", ");
  }

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

  const suggestedLimit = roundLimit(
    item?.suggestedCreditLimit ??
      item?.suggestedLimit ??
      avgBillValue * (bills >= 20 ? 1.5 : bills >= 10 ? 1.2 : 1),
  );

  return {
    ...item,
    id: item?._id || item?.id,
    name: displayName,
    initials,
    location,
    bills,
    avgBillValue,
    fulfillmentRate,
    suggestedLimit,
    raw: item,
  };
};

export const prepareParams = (
  filter: FilterFormData,
  pagination: PaginationState,
  sort: SortProps,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: sort.key || "name",
    order: sort.value || "asc",
    includePaylater: true,
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

export const getData = async (
  params: Record<string, any>,
  type: UserType = "b2c",
): Promise<UserItem[]> => {
  const response =
    type === "b2c"
      ? await CustomerService.getCustomerNetwork(params)
      : await FranchiseService.getFranchiseNetwork(params);
  const list = response?.data?.data || [];
  return (list || []).map((item: Record<string, any>) => formatItem(item, type));
};

export const getCount = async (
  params: Record<string, any>,
  type: UserType = "b2c",
): Promise<number> => {
  const p = { ...params };
  delete p.page;
  delete p.limit;
  delete p.sort;
  delete p.order;

  if (type === "b2c") {
    const response = await CustomerService.getCustomerNetworkCount(p);
    return response?.data?.data?.count || 0;
  }

  const response = await FranchiseService.getFranchiseNetworkCount(p);
  return response?.data?.data?.total || 0;
};
