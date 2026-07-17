import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";
import { startOfDay, endOfDay } from "date-fns";

// Prepare params for API/data filtering
export const prepareParams = (
  filter: Record<string, any>,
  pagination: { activePage: number; rowsPerPage: number },
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    // Pass title search as top-level `search` param
    params.search = search;
  }

  if (filter.user && filter.user !== "All") {
    params.filter.user = filter.user;
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    // Expose date range as top-level startDate/endDate (ISO strings)
    params.startDate = startOfDay(new Date(filter.dateRange[0])).toISOString();
    params.endDate = endOfDay(new Date(filter.dateRange[1])).toISOString();
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

// Returns a promise that resolves to an array of sample activity log data, filtered and paginated
export async function getData(params: Record<string, any>, binId: string) {
  const response = await RackBinService.getBinLogs(
    AuthService.getLoggedInUserId() || "",
    binId,
    params
  );
  return response.data?.data || [];
}

// Returns a promise that resolves to the count of filtered sample activity logs
export async function getCount(
  params: Record<string, any>,
  binId: string
): Promise<number> {
  // Use the same API as getData, but request count output and remove pagination
  const countParams: Record<string, any> = { ...params };
  delete countParams.page;
  delete countParams.count;
  countParams.outputType = "count";

  const response = await RackBinService.getBinLogs(
    AuthService.getLoggedInUserId() || "",
    binId,
    countParams
  );
  return response?.data?.data || 0;
}
