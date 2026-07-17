import FranchiseService from "~/services/FranchiseService";
import CustomerService from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import type { PaginationState } from "~/types/CommonTypes";

export type CustomerType = "b2b" | "b2c";

export type CustomerItem = {
  _id?: string;
  id?: string;
  referenceId?: string;
  name?: string;
  mobile?: string;
  franchiseId?: string;
  refNo?: string;
  initials?: string;
  location?: string;
  [key: string]: any;
};

const formatItem = (
  item: Record<string, any>,
  type: CustomerType,
): CustomerItem => {
  const displayName = (item?.name || item?.ownerDetails?.name || "")
    .toString()
    .trim();
  const parts = displayName.split(/\s+/).filter(Boolean);
  const initials = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");

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

  return {
    ...item,
    initials: initials.toUpperCase(),
    location,
  };
};

export const getData = async (
  params: Record<string, any>,
  type: CustomerType = "b2b",
): Promise<CustomerItem[]> => {
  const response =
    type === "b2c"
      ? await CustomerService.getCustomerNetwork(params)
      : await FranchiseService.getFranchiseNetwork(params);
  const list = response?.data?.data || [];
  return (list || []).map((item: Record<string, any>) =>
    formatItem(item, type),
  );
};

export const getCount = async (
  params: Record<string, any>,
  type: CustomerType = "b2b",
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

export const fetchCustomerDetails = async (
  customer: CustomerItem,
  type: CustomerType,
): Promise<Record<string, any> | null> => {
  const id = customer._id || customer.id || "";
  if (!id) return null;

  if (type === "b2c") {
    const resp = await CustomerService.getCustomer(id);
    return resp?.data?.data || null;
  } else {
    const resp = await FranchiseService.getFranchise(id);
    return resp?.data?.data || null;
  }
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
): Record<string, any> => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: "name",
    order: "asc",
    includePaylater: false,
  };

  if (filter.search && String(filter.search).trim()) {
    params.search = String(filter.search).trim();
  }

  if (filter.alpha) {
    params.search = `^${filter.alpha}`;
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
