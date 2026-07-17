import OmsDashboardService from "~/services/OmsDashboardService";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";
import { merge } from "lodash";
import type { AxiosRequestConfig } from "axios";

export const prepareParams = (
  formData: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const params: any = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    groupBy: "product",
    filter: {},
  };

  const commonParams = OmsDashboardService.prepareCommonFilterParams(formData);

  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  if (formData.search) {
    params.matchFilter = {
      $or: [
        {
          "items.dealName": {
            $regex: formData.search,
            $options: "i",
          },
        },
        {
          "items.dealRefId": {
            $regex: formData.search,
            $options: "i",
          },
        },
      ],
    };
  }

  if (formData.status && formData.status !== "All") {
    const statusOption = OmsService.getOrderStatuses().find(
      (option) => option.value === formData.status,
    );
    if (statusOption && statusOption.statuses) {
      params.matchFilter = {
        status: { $in: statusOption.statuses },
      };
    }
  }

  return merge({}, commonParams, params);
};

export const getData = async (
  params: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const response = await OmsDashboardService.getOrderReport(params, config);
  const raw = response?.data?.data || [];

  const data = (raw || []).map((rec: any) => {
    rec.statusColor = OmsService.getStatusColor(rec.status || "");
    rec.displayStatus = OmsService.getStatusLabel(rec.status || "");
    rec.typeColor = OmsService.getOrderTypeColor(rec.orderType || "");
    return rec;
  });

  return {
    data,
    total: response?.data?.pagination?.totalItems || 0,
    isClientError:
      response?.data?.message?.toLowerCase().includes("client error") || false,
  };
};
