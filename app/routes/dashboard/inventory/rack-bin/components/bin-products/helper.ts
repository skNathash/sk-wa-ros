import RackBinService from "~/services/RackBinService";
import AuthService from "~/services/AuthService";
import {
  RACK_BIN_LOCATION_NON_SELLABLE,
  RACK_BIN_LOCATION_SELLABLE,
} from "~/constants";

const getData = async (params: Record<string, any>, location: string) => {
  const response = await RackBinService.getBinProducts(
    AuthService.getLoggedInUserId() || "",
    location === "sellable"
      ? RACK_BIN_LOCATION_SELLABLE
      : RACK_BIN_LOCATION_NON_SELLABLE,
    params
  );
  return Array.isArray(response.data?.data) ? response.data.data : [];
};

const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await RackBinService.getRackBinProductsByBin(countParams);
  return response;
};

const prepareParams = (
  filter: Record<string, any>,
  pagination: Record<string, any>
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    sort: {
      dealName: 1,
    },
  };

  if (filter.search) {
    const search = filter.search.trim();
    params.search = search;
  }

  if (filter.alpha) {
    params.filter.dealName = `^${filter.alpha}`;
  }

  if (!Object.keys(filter).length) {
    delete params.filter;
  }

  return params;
};

export { getData, getCount, prepareParams };
