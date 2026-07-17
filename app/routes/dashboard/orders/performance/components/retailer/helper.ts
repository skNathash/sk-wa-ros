import { endOfDay, startOfDay } from "date-fns";
import FranchiseService from "~/services/FranchiseService";
import type { PaginationState } from "~/types/CommonTypes";

export const defaultFilter = {};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.fName = {
      $regex: search,
      $options: "i",
    };
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.payoutType = filter.type;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.getFranchises(params);
  return response?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const response = await FranchiseService.getFranchisesCount(params);
  return response?.data || 0;
};
