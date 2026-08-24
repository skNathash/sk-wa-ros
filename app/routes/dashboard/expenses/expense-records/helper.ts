import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import ExpenseService from "~/services/ExpenseService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort?: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination?.activePage ?? 1,
    count: pagination?.rowsPerPage ?? 20,
    filter: {},
  };

  // Sorting
  if (sort && sort.key) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  // Search across reference or description
  if (filters.search?.trim()) {
    params.filter.$or = [
      { title: filters.search.trim() },
      // { description: { $regex: filters.search.trim(), $options: "i" } },
    ];
  }

  // Date range filter: expect [from, to]. When no range is selected,
  // default to the current month so the list shows current-month records.
  const hasDateRange =
    filters.dateRange &&
    Array.isArray(filters.dateRange) &&
    filters.dateRange.length === 2 &&
    filters.dateRange[0] &&
    filters.dateRange[1];

  const [rangeStart, rangeEnd] = hasDateRange
    ? filters.dateRange
    : [startOfMonth(new Date()), endOfMonth(new Date())];

  params.filter.expenseDate = {
    $gte: startOfDay(rangeStart).toISOString(),
    $lte: endOfDay(rangeEnd).toISOString(),
  };

  // Category / Subcategory filters
  if (filters.category && filters.category?.length > 0) {
    params.filter.categoryId = filters.category[0].value;
  }

  if (filters.subcategory && filters.subcategory?.length > 0) {
    params.filter.subCategoryId = filters.subcategory[0].value;
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    params.filter.status = filters.status;
  }

  // Type filter (e.g., "expense", "refund")
  if (filters.type && filters.type !== "all") {
    params.filter.type = filters.type;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await ExpenseService.getTransactions(params);
  // ExpenseService.getTransactions returns an object via AjaxService; normalize to array
  return response?.data?.data || [];
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await ExpenseService.getTransactions({
    ...rest,
    outputType: "count",
  });

  return response?.data?.total || 0;
};
