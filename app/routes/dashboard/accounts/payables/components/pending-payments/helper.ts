import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      "fromParty.id": AuthService.getLoggedInUserId(),
    },
  };

  // Add filter parameters if they exist
  if (filter) {
    Object.assign(params, filter);
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getPayablesReceiveables(params);
  return AccountService.formatTransactionResponse(response?.data?.data || []);
};

export const getCount = async (params: Record<string, any>) => {
  const countParams = { ...params, outputType: "count" };
  const response = await AccountService.getTransactions(countParams);
  return response?.data?.data?.count || 0;
};
