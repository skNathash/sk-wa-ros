import { endOfDay, startOfDay, sub } from "date-fns";
import { merge } from "lodash";
import CommonService from "~/services/CommonService";
import OmsDashboardService from "~/services/OmsDashboardService";
import OmsService from "~/services/OmsService";
import type { PaginationState, SortValue } from "~/types/CommonTypes";

export type SummaryItem = {
  totalOrders: number;
  totalCustomers: number;
  totalValue: number;
  totalUnits?: number;
  loading?: boolean;
};

export const defaultFilter = {
  dateRange: [sub(new Date(), { days: 30 }), new Date()],
  search: "",
  status: "all",
  paymentMethod: "all",
  salesEmployee: null as {
    label: string;
    value: { id: string; name: string };
  } | null,
};

export const defaultSummary: Array<Record<string, any>> = [
  {
    label: "Total Orders",
    value: 0,
    key: "totalOrders",
    valueKey: "totalOrders",
    color: "primary",
  },
  {
    label: "Total Customers",
    value: 0,
    key: "totalCustomers",
    valueKey: "totalCustomers",
    color: "warning",
  },
  {
    label: "Total Value",
    value: 0,
    key: "totalValue",
    valueKey: "totalValue",
    color: "success",
  },
  {
    label: "Total Units",
    value: 0,
    key: "totalUnits",
    valueKey: "totalUnits",
    color: "primary",
  },
];

export const prepareOrderParams = (filter: Record<string, any>) => {
  const params: any = {
    outputType: "count",
    filter: {},
  };

  if (filter.mainTab === "b2b-orders") {
    params.filter.orderType = "B2B";
  } else if (filter.mainTab === "b2c-orders") {
    params.filter.orderType = "B2C";
  }

  if (filter.search?.trim()) {
    params.filter.search = filter.search.trim();
  }

  if (filter.dateRange && filter.dateRange.length > 0) {
    params.filter.createdAt = {
      $gte: startOfDay(filter.dateRange[0]).toISOString(),
      $lte: endOfDay(filter.dateRange[1]).toISOString(),
    };
  }

  if (filter.status && filter.status !== "all") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === filter.status,
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  return params;
};

export const prepareParams = (
  filter: Record<string, any>,
  pagination?: PaginationState,
  sort?: { key: string; value: SortValue },
) => {
  const params: any = {
    page: pagination?.activePage || 1,
    count: pagination?.rowsPerPage || 10,
    filter: {},
  };

  const commonParams = OmsDashboardService.prepareCommonFilterParams(filter);

  return merge({}, commonParams, params);
};

export const formatPaymentSummary = (data: Array<Record<string, any>>) => {
  let prepaid = 0;
  let prepaidPerc = 0;

  let cod = 0;
  let codPerc = 0;

  let payLater = 0;
  let payLaterPerc = 0;

  if (!Array.isArray(data)) {
    return {
      prepaid: 0,
      prepaidPerc: 0,
      cod: 0,
      codPerc: 0,
      payLater: 0,
      payLaterPerc: 0,
    };
  }

  let total = (data || []).reduce(
    (sum, item) => sum + (item.totalValue || 0),
    0,
  );

  (data || []).forEach((item) => {
    if (item.paymentMethod === "PREPAID") {
      prepaid += item.totalValue;
      prepaidPerc = CommonService.roundedByDecimalPlace(
        (prepaid / total) * 100,
        2,
      );
    }
    if (item.paymentMethod === "COD") {
      cod += item.totalValue;
      codPerc = CommonService.roundedByDecimalPlace((cod / total) * 100, 2);
    }
    if (item.paymentMethod === "PAYLATER") {
      payLater += item.totalValue;
      payLaterPerc = CommonService.roundedByDecimalPlace(
        (payLater / total) * 100,
        2,
      );
    }
  });

  return {
    prepaid,
    prepaidPerc,
    cod,
    codPerc,
    payLater,
    payLaterPerc,
  };
};
