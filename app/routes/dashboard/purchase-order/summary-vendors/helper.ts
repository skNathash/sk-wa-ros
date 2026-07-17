import { endOfDay, startOfDay } from "date-fns";
import { AuthService } from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import VendorService from "~/services/VendorService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareFilterParams = (
  filters: Record<string, any>,
  pagination: PaginationState
) => {
  let params: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {},
    groupByCond: "vendor",
    groupByType: filters.groupByType || "total",
  };

  const search = filters.search?.trim();
  if (search) {
    params.search = search;
  }

  if (filters.dateRange?.length === 2) {
    params.startDate = startOfDay(filters.dateRange[0]).toISOString();
    params.endDate = endOfDay(filters.dateRange[1]).toISOString();
  }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  try {
    const response = await PurchaseOrderService.getPoDashboardSummary(
      AuthService.getLoggedInUserId(),
      params
    );
    const vendorList = response.data?.data?.vendorList || [];
    return vendorList.map((vendor: any) => {
      const { type, color, description } = VendorService.getVendorType({
        name: vendor.vendorInfo?.name || "",
        vendorType: vendor.vendorInfo?.isOwnVendor ? "OWN" : "",
      });
      return {
        ...vendor,
        _vendorType: type,
        _vendorTypeColor: color,
        _vendorTypeInfo: description,
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
      return response.data?.data?.overallSummary?.totalVendors || 0;
    } else if (params.groupByType === "received") {
      return response.data?.data?.receivedSummary?.totalVendors || 0;
    } else if (params.groupByType === "notReceived") {
      return response.data?.data?.notReceivedSummary?.totalVendors || 0;
    }
  } catch (error) {
    console.error(error);
    return 0;
  }
};
