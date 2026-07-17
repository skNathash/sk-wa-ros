import { endOfDay, startOfDay, sub, format } from "date-fns";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

export interface FilterFormData {
  search: string;
  dateRange?: Date[];
  type: string;
  sourceType: string;
}

export const defaultFilter: FilterFormData = {
  dateRange: [sub(new Date(), { months: 3 }), new Date()],
  search: "",
  type: "All",
  sourceType: "All",
};

export const baseSummaryData = [
  {
    labelKey: "totalSales",
    infoKey: "accountsummary.description.totalSales",
    value: 0,
    icon: null, // will be set in component
    color: "success",
  },
  {
    labelKey: "totalPurchase",
    infoKey: "accountsummary.description.totalPurchase",
    value: 0,
    icon: null,
    color: "danger",
  },
  {
    labelKey: "platformFee",
    infoKey: "accountsummary.description.totalCharges",
    value: 0,
    icon: null,
    color: "danger",
  },
  {
    labelKey: "totalExpense",
    infoKey: "accountsummary.description.totalExpense",
    value: 0,
    icon: null,
    color: "danger",
  },
  {
    labelKey: "paymentReceived",
    infoKey: "accountsummary.description.paymentReceived",
    value: 0,
    icon: null,
    color: "success",
  },
  {
    labelKey: "paymentMade",
    infoKey: "accountsummary.description.paymentMade",
    value: 0,
    icon: null,
    color: "danger",
  },
];

/**
 * Prepares query parameters from filter form data
 * @param formData - The filter form data
 * @returns Object with query parameters ready for URL search params
 */
export const prepareFilterQueryParams = (
  formData: FilterFormData
): Record<string, any> => {
  // const dateFrom = formData.dateRange?.[0]
  //   ? format(formData.dateRange[0], "yyyy-MM-dd")
  //   : "";
  // const dateTo = formData.dateRange?.[1]
  //   ? format(formData.dateRange[1], "yyyy-MM-dd")
  //   : "";

  const params: Record<string, any> = {
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

  return params;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" }
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
  };

  const search = filter.search?.trim();
  if (search) {
    params.filter.$or = [
      {
        notes: {
          $regex: search,
          $options: "i",
        },
      },
      {
        sourceReference: search,
      },
      {
        "toParty.name": {
          $regex: search,
          $options: "i",
        },
      },
      {
        "toParty.refId": search,
      },
    ];
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.paymentDate = {
      $gte: startOfDay(filter.dateRange[0]),
      $lte: endOfDay(filter.dateRange[1]),
    };
  }

  if (filter.type && filter.type !== "All") {
    params.filter.statementType = filter.type;
  }

  if (filter.sourceType && filter.sourceType !== "All") {
    params.filter.sourceType = filter.sourceType;
  }

  if (!Object.keys(params.filter).length) {
    delete params.filter;
  }

  if (sort && sort.key) {
    params.sort = {
      [sort.key]: sort.value === "asc" ? 1 : -1,
    };
  }

  return params;
};

export const getData = async (
  params: Record<string, any>,
  noFormat = false
) => {
  const response = await AccountService.getStatements(params);
  return noFormat
    ? response?.data
    : AccountService.formatStatementResponse(response?.data?.data || []);
};

export const getSummaryData = async (filter: Record<string, any>) => {
  const globalFilter =
    prepareParams(
      filter,
      {
        activePage: 1,
        rowsPerPage: 10,
        startSlNo: 1,
        endSlNo: 10,
        totalRecords: 0,
      },
      { key: "paymentDate", value: "desc" }
    ).filter || {};

  const dateFilter = {
    paymentDate: globalFilter.paymentDate || {
      $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
      $lte: new Date().toISOString(),
    },
  };

  const getStatements = async (filterParams: Record<string, any>) => {
    try {
      const response = await AccountService.getStatements({
        ...filterParams,
        outputType: "count",
      });
      return response.data?.totalAmount || 0;
    } catch (error) {
      return 0;
    }
  };

  let promises = [
    // sales (debit)
    getStatements({
      filter: {
        ...globalFilter,
        ...dateFilter,
        sourceType: {
          $in: ["POS_SALES", "B2B_SALES", "CLUB_SALES", "SALES"],
        },
        statementType: "debit",
      },
    }),
    // purchase (credit)
    getStatements({
      filter: {
        ...globalFilter,
        ...dateFilter,
        sourceType: {
          $in: [
            "PO",
            "INVOICE",
            "SK_PURCHASE",
            "LOCAL_PURCHASE",
            "OWN_PURCHASE",
          ],
        },
        statementType: "credit",
      },
    }),
    // PO charge (debit)
    getStatements({
      filter: {
        ...globalFilter,
        ...dateFilter,
        sourceType: {
          $in: ["PO_CHARGE", "PLATFORM_FEE"],
        },
        statementType: "debit",
      },
    }),
    // expense (debit)
    getStatements({
      filter: {
        ...globalFilter,
        ...dateFilter,
        sourceType: {
          $in: ["EXPENSE"],
        },
        statementType: "debit",
      },
    }),
    // payment received (sourceType PAYMENT, statementType debit)
    getStatements({
      filter: {
        ...globalFilter,
        ...dateFilter,
        sourceType: {
          $in: ["PAYMENT"],
        },
        statementType: "credit",
      },
    }),
    // payment made (sourceType PAYMENT, statementType credit)
    getStatements({
      filter: {
        ...globalFilter,
        ...dateFilter,
        sourceType: {
          $in: ["PAYMENT"],
        },
        statementType: "debit",
      },
    }),
  ];

  const responses = await Promise.all(promises);

  return responses;
};

export const getCount = async (params: Record<string, any>) => {
  const { page, count, ...rest } = params || {};
  const response = await AccountService.getStatements({
    ...rest,
    outputType: "count",
  });
  return response?.data?.count || 0;
};
