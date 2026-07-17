import { endOfDay, startOfDay } from "date-fns";
import { AuthService } from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import type { PaginationState } from "~/types/CommonTypes";

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

  if (filters.dateRange?.length === 2) {
    params.startDate = startOfDay(filters.dateRange[0]).toISOString();
    params.endDate = endOfDay(filters.dateRange[1]).toISOString();
  }

  if (filters.search?.trim()) {
    // params.filter.orderId = { $regex: filters.search.trim(), $options: "i" };
    params.search = filters.search.trim();
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId(),
      params
    );
    const poList: any[] = response.data?.data?.poList || [];

    // Attach status label and color for each PO item using PurchaseOrderService helpers
    try {
      const statuses = PurchaseOrderService.getStatuses();
      return (poList || []).map((item: any) => {
        const { label, color } = PurchaseOrderService.getStatusLabelAndColor(
          item.status,
          statuses
        );
        return {
          ...item,
          _statusLabel: label,
          _statusColor: color,
        };
      });
    } catch (err) {
      // If anything goes wrong while mapping status, return the original list
      console.error("Error attaching status metadata to poList:", err);
      return poList;
    }
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
