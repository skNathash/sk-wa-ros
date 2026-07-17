import FranchiseService from "~/services/FranchiseService";
import CustomerService from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import type { PaginationState } from "~/types/CommonTypes";

export type UsersModalType = "b2b" | "b2c";

const formatItem = (item: Record<string, any>, type: UsersModalType) => {
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
  type: UsersModalType = "b2b",
) => {
  const response =
    type === "b2c"
      ? await CustomerService.getCustomerNetwork(params)
      : await FranchiseService.getFranchiseNetwork(params);
  const list = response?.data?.data || [];

  return (list || []).map((item: Record<string, any>) => formatItem(item, type));
};

export const getCount = async (
  params: Record<string, any>,
  type: UsersModalType = "b2b",
) => {
  const p = { ...params };
  delete p.page;
  delete p.limit;
  delete p.sort;

  if (type === "b2c") {
    const response = await CustomerService.getCustomerNetworkCount(p);
    return { total: response?.data?.data?.count || 0 };
  }

  const response = await FranchiseService.getFranchiseNetworkCount(p);
  return response?.data?.data || {};
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort?: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    sort: sort ? { [sort.key]: sort.value === "asc" ? 1 : -1 } : { name: 1 },
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
