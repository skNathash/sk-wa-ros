import AccountService from "~/services/AccountService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    // sort: { [sort.key]: sort.value === "asc" ? 1 : -1 },
    // filter: {
    //   status: "done",
    // },
    // groupbycond: "toPartyId",
    filter: {},
  };

  // If caller provided a paymentType filter (credit/debit) include it
  // filters.activeTab expected values: 'receivePayment' -> credit, 'makePayout' -> debit
  if (filters && filters.activeTab) {
    if (filters.activeTab === "receivePayment") {
      params.filter.paymentType = "credit";
    } else if (filters.activeTab === "makePayout") {
      params.filter.paymentType = "debit";
    }
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getFranchisePaymentTransactions(params);
  const raw = response?.data?.data || [];
  return raw;
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await AccountService.getTransactions({
    ...rest,
    outputType: "count",
  });
  return response?.data?.data?.count || 0;
};
