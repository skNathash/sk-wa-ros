import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export interface StatementFilter {
  /** Seller whose wallet the transactions belong to. */
  sellerId: string;
  search?: string;
  dateRange?: Date[];
}

/**
 * Params for `GET accounts/paylater/statement`.
 *
 * The B2B/B2C network statement reads the same endpoint from the seller's side
 * (`userInfo.id` = the buyer). Here the logged-in retailer is the buyer, so the
 * pair is flipped: my transactions on the wallet this seller issued.
 */
export const prepareParams = (
  filter: StatementFilter,
  pagination: PaginationState,
  sort: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      "userInfo.id": AuthService.getLoggedInUserId(),
      "franchiseInfo.id": filter.sellerId,
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      { sourceReference: { $regex: search, $options: "i" } },
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

  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response: any = await PaylaterService.getStatements(params);
  const transactions = response?.data?.data?.transactions;
  return Array.isArray(transactions)
    ? PaylaterService.formatStatements(transactions)
    : [];
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, sort, ...rest } = params;
  const response: any = await PaylaterService.getStatements({
    ...rest,
    outputType: "count",
  });
  return response?.data?.data?.count || 0;
};
