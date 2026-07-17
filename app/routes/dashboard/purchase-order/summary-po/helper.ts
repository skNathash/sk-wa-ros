import { endOfDay, startOfDay } from "date-fns";
import { AuthService } from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

export const purchasedFromOptions = [
  { value: "All", label: "All Types", langKey: "allTypes" },
  { value: "Local Vendor", label: "Local Vendor" },
  { value: "StoreKing", label: "StoreKing" },
  { value: "Added Stock", label: "Added Stock" },
];

export const prepareFilterParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    groupByCond: "po",
    groupByType: filters.groupByType || "total",
  };

  const search = filters.search?.trim();
  if (search) {
    params.search = search;
    // params.filter.$or = [
    //   {
    //     "to.name": { $regex: search, $options: "i" },
    //   },
    //   {
    //     "orderData.refId": { $regex: search, $options: "i" },
    //   },
    //   {
    //     "to.refId": { $regex: search, $options: "i" },
    //   },
    // ];
  }

  if (filters.vendorInfo?._id) {
    params.filter["vendorInfo.vendorId"] = filters.vendorInfo._id;
  }

  if (filters.dateRange?.length === 2) {
    // If grouping by received POs, the backend expects received date range keys
    if (0 && filters.groupByType === "received") {
      params.receivedStartDate = startOfDay(filters.dateRange[0]).toISOString();
      params.receivedEndDate = endOfDay(filters.dateRange[1]).toISOString();
    } else {
      params.startDate = startOfDay(filters.dateRange[0]).toISOString();
      params.endDate = endOfDay(filters.dateRange[1]).toISOString();
    }
  }

  if (filters.status && filters.status !== "All") {
    const found = PurchaseOrderService.getStatuses().find(
      (x) => x.value === filters.status
    )?.status;
    if (found) params.filter.status = { $in: found };
  }

  if (filters.purchasedFrom && filters.purchasedFrom !== "All") {
    if (filters.purchasedFrom === "Local Vendor") {
      params.filter.source = "manual";
    } else if (filters.purchasedFrom === "StoreKing") {
      params.filter.source = "sk_order";
    } else if (filters.purchasedFrom === "Added Stock") {
      params.filter.source = "add_stock_inventory";
    }
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId(),
      params
    );
    return (response.data?.data?.poList || []).map((e: any) => {
      const formatted: Record<string, any> =
        PurchaseOrderService.formatPoDashboardSummary(e);

      const status = PurchaseOrderService.getStatusLabelAndColor(
        formatted.status,
        PurchaseOrderService.getStatuses()
      );

      return {
        ...formatted,
        _statusLabel: status.label,
        _statusColor: status.color,
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getCount = async (params: Record<string, any>) => {
  const { groupByType, groupByCond, ...rest } = params;

  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId(),
      {
        ...rest,
      }
    );

    if (params.groupByType === "total") {
      return response.data?.data?.overallSummary?.totalPO || 0;
    } else if (params.groupByType === "received") {
      return response.data?.data?.receivedSummary?.totalPO || 0;
    } else if (params.groupByType === "notReceived") {
      return response.data?.data?.notReceivedSummary?.totalPO || 0;
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};
