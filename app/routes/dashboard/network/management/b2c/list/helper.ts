import CustomerService from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import { startOfDay, endOfDay } from "date-fns";
import type { PaginationState } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";

export const getData = async (params: Record<string, any>) => {
  const response = await CustomerService.getCustomerNetwork(params);
  const loggedUserId = AuthService.getLoggedInUserId();
  return (response?.data?.data || []).map((item: any) => {
    const initials =
      item.name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase() || "";
    const formattedAddress =
      item.address?.city && item.address?.state
        ? `${item.address.city}, ${item.address.state}`
        : "N/A";
    const connectedFranchise = (item.connectedFranchisesList || []).find(
      (f: any) => f.id === loggedUserId,
    );
    const lastOrderDate = connectedFranchise?.lastOrderDate || null;
    return {
      ...item,
      initials,
      formattedAddress,
      lastOrderDate,
    };
  });
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

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
) => {
  // pagination is optional; provide sensible defaults when not passed
  let params: Record<string, any> = {
    page: pagination?.activePage || 1,
    limit: pagination?.rowsPerPage || 10,
    filter: {},
    sort: "createdAt",
    order: "desc",
  };

  // Add search key
  if (filter.search) {
    params.search = filter.search;
  }

  if (filter.alpha) {
    params.search = `^${filter.alpha}`;
    // params.filter.name = CommonService.prepareAlphaRegexFilter(filter.alpha);
  }

  if (filter.customerFilter && filter.customerFilter !== "all") {
    // params.type = filter.customerFilter;
  }

  if (filter.customerFilter === "birthday") {
    params.filter.dob = {
      $gte: startOfDay(new Date()),
      $lte: endOfDay(new Date()),
    };
  }

  // Add createdAt range if dateRange is present
  if (
    filter.dateRange &&
    Array.isArray(filter.dateRange) &&
    filter.dateRange.length === 2
  ) {
    // params.createdAt = {
    //   $gte: startOfDay(new Date(filter.dateRange[0])),
    //   $lte: endOfDay(new Date(filter.dateRange[1])),
    // };
    params.registeredFrom_date = startOfDay(
      new Date(filter.dateRange[0]),
    ).toISOString();
    params.registeredTo_date = endOfDay(
      new Date(filter.dateRange[1]),
    ).toISOString();
  }

  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

export async function getSummary(filters: Record<string, any>) {
  const defaultFilter = {
    ...filters,
  };

  // prepare params for overall count (pagination values are removed inside getCount)
  const paramsNow = prepareParams(defaultFilter);

  // prepare params for last week created
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const paramsLastWeek = prepareParams({
    ...defaultFilter,
    dateRange: [oneWeekAgo, new Date()],
  });

  const promises = [getCount(paramsNow), getCount(paramsLastWeek)];

  const [total, lastWeekCreated] = await Promise.all(promises);

  return {
    total: total || 0,
    lastWeekCreated: lastWeekCreated || 0,
    loyalty: 0,
    avg: 0,
  };
}
