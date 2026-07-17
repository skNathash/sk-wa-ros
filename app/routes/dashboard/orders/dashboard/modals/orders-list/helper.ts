import AuthService from "~/services/AuthService";
import OmsDashboardService from "~/services/OmsDashboardService";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
) => {
  let p: Record<string, any> = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    filter: {
      "sellerInfo.refId": AuthService.getLoggedInUserId(true),
    },
  };

  const search = filter.search?.trim();
  if (search) {
    p.filter = {
      orderRefNo: { $regex: search, $options: "i" },
    };
  }

  if (filter.status === "Picking") {
    p.statusType = "Processing";
  }

  return p;
};

export const getData = async (params: Record<string, any>) => {
  const response = await OmsDashboardService.getByStatus(params);
  return {
    data: (response?.data?.data || []).map((item: any) => ({
      ...item,
      statusColor: OmsService.getStatusColor(item.status || ""),
      displayStatus: OmsService.getStatusLabel(item.status || ""),
    })),
    count: response?.data?.summary?.totalOrders || 0,
  };
};
