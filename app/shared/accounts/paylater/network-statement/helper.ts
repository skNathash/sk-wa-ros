import { endOfDay, startOfDay } from "date-fns";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

// Prepare params for API/data filtering (use same shape as orders list helper)
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      "userInfo.id": filter.userId,
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        sourceReference: { $regex: search, $options: "i" },
      },
    ];
  }

  // Date Range
  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  // Sorting
  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Fetch data using same OmsService APIs as orders list helper
export const getData = async (params: Record<string, any>) => {
  const response = await PaylaterService.getStatements(params);
  return (
    PaylaterService.formatStatements(response?.data?.data?.transactions) || []
  );
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await PaylaterService.getStatements(countParams);

  return response?.data?.data?.count || 0;
};
