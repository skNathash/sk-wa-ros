import type { PaginationState, SortProps } from "~/types/CommonTypes";
import ExpenseService from "~/services/ExpenseService";

export const prepareParams = (
  _filters: Record<string, any>,
  pagination: PaginationState,
  sort?: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage ?? 1,
    count: pagination?.rowsPerPage ?? 10,
    filter: {},
  };

  if (sort && sort.key) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await ExpenseService.getTransactions(params);
  return response?.data?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const response = await ExpenseService.getTransactions({
    ...params,
    outputType: "count",
  });
  return response?.data?.total || 0;
};
