import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage,
    limit: pagination?.rowsPerPage,
    // sort: { name: 1 },
    filter: {},
    sort: "name",
    order: "asc",
    includeRoutes: false,
  };

  const search = filter?.search?.trim();
  if (search) {
    params.search = search;
  }

  // alpha (starts-with) filter - use CommonService helper to prepare regex
  if (filter.alpha) {
    params.search = "^" + filter.alpha;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (
  type: "b2b" | "b2c",
  params: Record<string, any>,
) => {
  try {
    if (type === "b2b") {
      const response = await FranchiseService.getFranchiseNetwork(params);
      return (response?.data?.data || []).map((item: any) => {
        const name = item.name;
        const mobile = item.mobile;
        const addressParts: string[] = [];
        if (item.city) addressParts.push(item.city);
        if (item.state) addressParts.push(item.state);
        if (item.pincode) addressParts.push(item.pincode);
        const addressStr = addressParts.length
          ? addressParts.join(", ")
          : "N/A";

        const route =
          Array.isArray(item?.routes) && item.routes.length
            ? item.routes[0]
            : null;
        const routeName =
          route?.description ||
          route?.routeCode ||
          route?.name ||
          route?._id ||
          null;
        const routeId = route?._id || null;

        return {
          _id: item._id,
          name,
          mobile,
          addressStr,
          routeName,
          routeId,
        };
      });
    } else if (type === "b2c") {
      const response = await CustomerService.getCustomerNetwork(params);
      return (response?.data?.data || []).map((item: any) => {
        const name = item.name;
        const mobile = item.mobile;
        const addr = item.address || {};
        const addressStr = ["city", "distrcit", "state", "postcode"]
          .map((key) => addr[key])
          .filter(Boolean)
          .join(", ");
        const route =
          Array.isArray(item?.routes) && item.routes.length
            ? item.routes[0]
            : null;
        const routeName =
          route?.description ||
          route?.routeCode ||
          route?.name ||
          route?._id ||
          null;
        const routeId = route?._id || null;

        return {
          _id: item._id,
          name,
          mobile,
          addressStr,
          routeName,
          routeId,
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const getCount = async (
  type: "b2b" | "b2c",
  params: Record<string, any>,
) => {
  try {
    if (type === "b2b") {
      let p: Record<string, any> = { ...params };
      delete p.page;
      delete p.limit;
      delete p.sort;
      delete p.order;

      const response = await FranchiseService.getFranchiseNetworkCount(p);
      return response?.data?.data?.total || 0;
    } else if (type === "b2c") {
      let p: Record<string, any> = { ...params, outputType: "count" };
      delete p.page;
      delete p.limit;
      delete p.sort;

      const response = await CustomerService.getCustomerNetworkCount(p);
      return response?.data?.data?.count || 0;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// Format helper to derive a display name for the assigned route
// NOTE: `format` removed. `getData` now provides `routeName` taken from `routes[0]`.
