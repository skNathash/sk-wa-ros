import ExpenseService from "~/services/ExpenseService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  categoryId?: string
) => {
  const params: Record<string, any> = {
    page: pagination.activePage || 1,
    limit: pagination.rowsPerPage || 10,
    filter: {},
  };

  if (categoryId) {
    params.filter.categoryId = categoryId;
  }

  const search = filter?.search?.trim?.();
  if (search) {
    params.filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await ExpenseService.getSubCategories(params);
  const items = response?.data?.data?.data || [];

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
  const response = await ExpenseService.getSubCategories({
    ...params,
    outputType: "count",
  });
  return response?.data?.data?.total || 0;
};
