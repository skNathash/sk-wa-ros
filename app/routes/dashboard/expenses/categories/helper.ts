import ExpenseService from "~/services/ExpenseService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState
) => {
  const params: Record<string, any> = {
    page: pagination.activePage || 1,
    limit: pagination.rowsPerPage || 10,
    filter: {},
  };

  const search = filter?.search?.trim();
  if (search) {
    params.filter.name = { $regex: search, $options: "i" };
  }

  // Handle status filter: expected values are 'all' | 'active' | 'inactive'
  const status = filter?.status;
  if (status === "active") {
    // backend expects isActive boolean
    params.filter.isActive = true;
  } else if (status === "inactive") {
    params.filter.isActive = false;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await ExpenseService.getCategories(params);
  const items = response.data?.data?.data || [];

  // Enrich items with statusLabel and statusColor based on isActive
  return items.map((it: Record<string, any>) => {
    const isActive = String(it.isActive) === "true" || it.isActive === true;
    return {
      ...it,
      statusLabel: isActive ? "Active" : "Inactive",
      statusColor: isActive ? "success" : "danger",
    };
  });
};

export const getCount = async (params: Record<string, any>) => {
  const response = await ExpenseService.getCategories({
    ...params,
    outputType: "count",
  });
  return response.data?.data?.total || 0;
};
