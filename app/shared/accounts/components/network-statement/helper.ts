import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
  dateRange: Date[];
  type: string;
  sourceType: string;
}

export const defaultFilter: FilterFormData = {
  search: "",
  dateRange: [],
  type: "All",
  sourceType: "All",
};

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
  sort: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      "fromParty.id": filter.retailerId,
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

export const getData = async (
  params: Record<string, any>,
  noFormat = false,
) => {
  const response = await AccountService.getTransactions(params);
  if (noFormat) {
    return response?.data;
  }
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

export interface StatementSummaryData {
  opening: number;
  closing: number;
  purchases: number;
  paid: number;
  notes: number;
  /** Placeholder until paylater used is wired to a real data point. */
  paylaterUsed: number;
  periodStart: Date;
  loading: boolean;
}

export const defaultStatementSummary: StatementSummaryData = {
  opening: 0,
  closing: 0,
  purchases: 0,
  paid: 0,
  notes: 0,
  paylaterUsed: 0,
  periodStart: startOfMonth(new Date()),
  loading: true,
};

// Same aggregation endpoint as the accounts overall-statement summary:
// getStatements with outputType "count" returns { totalAmount } for the filter.
const getStatementTotal = async (filter: Record<string, any>) => {
  try {
    const response = await AccountService.getStatements({
      filter,
      outputType: "count",
    });
    return response?.data?.totalAmount || 0;
  } catch (e) {
    return 0;
  }
};

const getPaylaterUsed = async (retailerId: string) => {
  const userId = AuthService.getLoggedInUserId();
  if (!userId || !retailerId) return 0;

  const response = await PaylaterService.getStatements({
    page: 1,
    count: 1,
    filter: {
      "userInfo.id": userId,
      "franchiseInfo.id": retailerId,
    },
    sort: { createdAt: -1 },
  });
  return response?.data?.data?.accountSummary?.totalAmountUsed || 0;
};

/**
 * Month-to-date purchases / paid totals for one counterparty, using the same
 * sourceType/statementType buckets as the overall-statement summary cards
 * (totalPurchase and paymentMade), narrowed to the retailer via toParty.id.
 */
export const getStatementSummary = async (retailerId: string) => {
  const now = new Date();
  const baseFilter = {
    "toParty.id": retailerId,
    paymentDate: {
      $gte: startOfMonth(now),
      $lte: endOfDay(now),
    },
  };

  const [purchases, paid, paylaterUsed] = await Promise.all([
    getStatementTotal({
      ...baseFilter,
      sourceType: {
        $in: ["PO", "INVOICE", "SK_PURCHASE", "LOCAL_PURCHASE", "OWN_PURCHASE"],
      },
      statementType: "credit",
    }),
    getStatementTotal({
      ...baseFilter,
      sourceType: { $in: ["PAYMENT"] },
      statementType: "debit",
    }),
    getPaylaterUsed(retailerId),
  ]);

  return {
    purchases,
    paid,
    paylaterUsed,
    periodStart: startOfMonth(now),
  };
};

export const getAccountsSummary = async (retailerId: string) => {
  const response = await AccountService.getTransactions({
    filter: {
      "toParty.id": retailerId,
    },
  });

  const data = response?.data?.data || [];

  return {
    openingBalance: 0,
    credits: 0,
    debits: 0,
    closingBalance: data?.[0]?.outstandingAmount || 0,
  };
};
