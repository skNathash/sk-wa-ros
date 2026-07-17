import { endOfDay, startOfDay } from "date-fns";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState } from "~/types/CommonTypes";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
    sort: { createdAt: -1 },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        sourceReference: {
          $regex: search,
          $options: "i",
        },
      },
      {
        "userInfo.name": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "userInfo.mobile": {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    const start = filter.dateRange[0];
    const end = filter.dateRange[1] || filter.dateRange[0];
    params.filter.createdAt = {
      $gte: startOfDay(start),
      $lte: endOfDay(end),
    };
  }

  // type can be 'all'|'b2b'|'b2c' from the filter UI. Ignore 'all'.
  if (filter.type && String(filter.type).toLowerCase() !== "all") {
    params.filter["userInfo.type"] =
      filter.type === "b2b" ? "franchise" : "customer";
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await PaylaterService.getStatements(params);
  const d = Array.isArray(response?.data?.data?.transactions)
    ? PaylaterService.formatStatements(response?.data?.data?.transactions)
    : [];
  return d;
};

export async function getCount(params: Record<string, any>) {
  const { page, count, ...restParams } = params;
  const resp = await PaylaterService.getStatements({
    ...restParams,
    outputType: "count",
  });
  return resp.data?.data?.count || 0;
}
