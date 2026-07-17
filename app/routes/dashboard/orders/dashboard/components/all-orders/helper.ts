import { merge } from "lodash";
import OmsDashboardService from "~/services/OmsDashboardService";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";
import type { AxiosRequestConfig } from "axios";

export const prepareParams = (
  formData: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const params: any = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    groupBy: "order",
    filter: {},
  };

  const commonParams = OmsDashboardService.prepareCommonFilterParams(formData);

  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  const status = formData.status;
  if (status && status !== "all") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === status,
    );
    if (statusOption && statusOption.statuses) {
      params.filter.status = { $in: statusOption.statuses };
    }
  }

  if (formData.search) {
    params.filter.$or = [
      {
        orderRefNo: { $regex: formData.search, $options: "i" },
      },
      {
        "customerInfo.name": { $regex: formData.search, $options: "i" },
      },
    ];
  }

  return merge({}, commonParams, params);
};

export const getData = async (
  params: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const response = await OmsDashboardService.getOrderReport(params, config);
  const raw = response?.data?.data || [];

  const data = (raw || []).map((order: any) => {
    order.statusColor = OmsService.getStatusColor(order.orderStatus);
    order.displayStatus = OmsService.getStatusLabel(order.orderStatus);
    order.typeColor = OmsService.getOrderTypeColor(order.orderType);

    let userLink = "";
    const customerId = order.orderedBy?.customerId;
    if (customerId) {
      if (order.orderType === "B2B") {
        userLink = `/dashboard/network/view/b2b/${customerId}`;
      } else {
        userLink = `/dashboard/network/view/b2c/${customerId}`;
      }
    }

    order.userLink = userLink;

    return order;
  });

  return {
    data,
    total: response?.data?.pagination?.totalItems || 0,
    isClientError:
      response?.data?.message?.toLowerCase().includes("client error") || false,
  };
};
