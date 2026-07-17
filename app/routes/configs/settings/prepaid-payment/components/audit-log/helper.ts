import { endOfDay, startOfDay } from "date-fns";
import FranchiseService from "~/services/FranchiseService";

// Prepare filter and pagination params for payment config logs
export const prepareParams = (
  filter: Record<string, any> = {},
  pagination: Record<string, any> = { activePage: 1, rowsPerPage: 10 },
  _sort?: any,
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  return params;
};

export const getData = async (params: Record<string, any> = {}) => {
  try {
    const res = await FranchiseService.getPaymentConfigLogs(params);
    if (res.statusCode === 200 && Array.isArray(res.data?.data)) {
      return res.data.data || [];
    }
    return [];
  } catch (e) {
    console.error("Error fetching payment config logs:", e);
    return [];
  }
};

export const getCount = async (params: Record<string, any> = {}) => {
  try {
    const p = { ...params, outputType: "count" };
    const res = await FranchiseService.getPaymentConfigLogs(p);
    if (res.statusCode === 200 && typeof res.data?.data?.count === "number") {
      return res.data?.data?.count || 0;
    }
    return 0;
  } catch (e) {
    console.error("Error fetching payment config logs count:", e);
    return 0;
  }
};

export default {
  prepareParams,
  getData,
  getCount,
};
