import { endOfDay, startOfDay } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export const defaultSummary = [
  {
    label: "Total Debits",
    value: 0,
    apiKey: "debits",
    loading: true,
    color: "tw:text-red-600",
  },
  {
    label: "Total Credits",
    value: 0,
    apiKey: "credits",
    loading: true,
    color: "tw:text-green-600",
  },
  {
    label: "Current Balance",
    value: 0,
    apiKey: "closingBalance",
    loading: true,
    color: "tw:text-red-600",
  },
];

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      "fromParty.id": filter.vendorId,
    },
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
      {
        sourceReference: search,
      },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.transactionDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.paymentType = filter.type;
  }

  if (filter.sourceType && filter.sourceType !== "All") {
    params.filter.sourceType = filter.sourceType;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await AccountService.getTransactions(params);
  // const response = await VendorService.getVendorStatement(params);
  const data = response?.data?.data || [];
  return AccountService.formatTransactionResponse(data);
};

export const getCount = async (params: Record<string, any>) => {
  // Remove page, limit, and sort from params if present
  const { page, limit, sort, ...rest } = params || {};
  const response = await AccountService.getTransactions({
    ...rest,
    outputType: "count",
  });
  return response?.data?.data?.count || 0;
};

export const getAccountsSummary = async (vendorId: string) => {
  const response = await AccountService.getTransactions({
    filter: {
      "toParty.id": vendorId,
    },
  });

  const data = response?.data?.data || [];

  return {
    openingBalance: 0,
    credits: 0,
    debits: 0,
    closingBalance: data?.[0]?.outstandingAmount || 0,
  };

  // const response = await AccountService.fetchAccountsSummary({
  //   filter: {
  //     partyId: vendorId,
  //   },
  // });
  // const data = response?.data?.data?.[0] || {};
  // return {
  //   openingBalance: data?.openingBalance || 0,
  //   credits: data?.totalCreditAmount || 0,
  //   debits: data?.totalDebitAmount || 0,
  //   closingBalance: data?.currentBalance || 0,
  // };
};
