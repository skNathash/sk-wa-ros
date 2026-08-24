import { endOfDay, format, startOfDay, startOfMonth } from "date-fns";
import AccountService from "~/services/AccountService";
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

/**
 * Prepares URL query parameters from the filter form data. Mirrors the
 * orders/list + overall-statement pattern so the filter state stays in the URL
 * and can be restored on load / back-navigation.
 */
export const prepareFilterQueryParams = (
  formData: FilterFormData,
): Record<string, any> => {
  return {
    search: formData.search || "",
    type: formData.type || "All",
    sourceType: formData.sourceType || "All",
    dateFrom: formData.dateRange?.[0]
      ? format(formData.dateRange[0], "yyyy-MM-dd")
      : "",
    dateTo: formData.dateRange?.[1]
      ? format(formData.dateRange[1], "yyyy-MM-dd")
      : "",
  };
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

export const getData = async (
  params: Record<string, any>,
  noFormat = false,
) => {
  const response = await AccountService.getTransactions(params);
  // const response = await VendorService.getVendorStatement(params);
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
  periodStart: Date;
  loading: boolean;
}

export const defaultStatementSummary: StatementSummaryData = {
  opening: 0,
  closing: 0,
  purchases: 0,
  paid: 0,
  notes: 0,
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

/**
 * Month-to-date purchases / paid totals for one vendor, using the same
 * sourceType/statementType buckets as the overall-statement summary cards
 * (totalPurchase and paymentMade), narrowed to the vendor via toParty.id.
 */
export const getStatementSummary = async (vendorId: string) => {
  const now = new Date();
  const baseFilter = {
    "toParty.id": vendorId,
    paymentDate: {
      $gte: startOfMonth(now),
      $lte: endOfDay(now),
    },
  };

  const [purchases, paid] = await Promise.all([
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
  ]);

  return { purchases, paid, periodStart: startOfMonth(now) };
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
