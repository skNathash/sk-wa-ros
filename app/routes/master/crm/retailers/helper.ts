import FranchiseService from "~/services/FranchiseService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export interface RetailerFilterForm {
  search: string;
  state: string;
  district: string;
  town: string;
  pincode: string;
}

export const defaultFilter: RetailerFilterForm = {
  search: "",
  state: "",
  district: "",
  town: "",
  pincode: "",
};

// Values that mean "no filter" for the dependent location selects
const isSet = (value?: string) => !!value && value.trim() && value !== "All";

// Build the API request params from the current filter + pagination state.
export const prepareParams = (
  filter: Partial<RetailerFilterForm>,
  pagination: PaginationState,
  sort?: { key: string; value: SortValue },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: sort?.key
      ? { [sort.key]: sort.value === "asc" ? 1 : -1 }
      : { name: 1 },
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.search = search;
  }

  if (isSet(filter.state)) {
    params.filter.state = filter.state;
  }

  if (isSet(filter.district)) {
    params.filter.district = filter.district;
  }

  if (isSet(filter.town)) {
    params.filter.town = filter.town;
  }

  const pincode = filter.pincode?.trim();
  if (pincode) {
    const numeric = Number(pincode);
    params.filter.pincode = Number.isNaN(numeric) ? pincode : numeric;
  }

  return params;
};

// Fetch the franchise list. franchise/list returns the array at data.data.
export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getFranchises(params);
  return response?.data?.data || [];
};

// Fetch the total count (franchise endpoint with outputType: "count").
export const getCount = async (params: Record<string, any>) => {
  const { page, count, sort, ...rest } = params || {};
  const response = await FranchiseService.getFranchisesCount(rest);
  const d = response?.data?.data;
  console.log(response);
  const total = typeof d === "number" ? d : (d?.count ?? d?.total ?? 0);
  return typeof total === "number" ? total : 0;
};
