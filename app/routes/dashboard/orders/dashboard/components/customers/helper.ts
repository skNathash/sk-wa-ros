import { merge } from "lodash";
import OmsDashboardService from "~/services/OmsDashboardService";
import OmsService from "~/services/OmsService";
import type { PaginationState } from "~/types/CommonTypes";
import type { AxiosRequestConfig } from "axios";

export const prepareParams = (
  filter: Record<string, any>,
  pagination: PaginationState,
  sort: { key: string; value: "asc" | "desc" },
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {},
    groupBy: "customer",
  };

  const commonParams = OmsDashboardService.prepareCommonFilterParams(filter);

  const search = filter.search?.trim();
  if (search) {
    params.filter["customerInfo.name"] = { $regex: search, $options: "i" };
  }

  if (sort.key && sort.value) {
    params.sort = { [sort.key]: sort.value === "asc" ? 1 : -1 };
  }

  return merge({}, commonParams, params);
};

export const getData = async (
  params: Record<string, any>,
  config?: AxiosRequestConfig,
) => {
  const response = await OmsDashboardService.getOrderReport(params, config);
  const raw = response?.data?.data || [];

  const total = response?.data?.pagination?.totalItems || 0;

  const formatAddress = (addr: any) => {
    if (!addr) return "";
    const city = addr.city || "";
    const district = addr.district || "";
    const state = addr.state || "";
    const pincode = addr.pincode || addr.pin || "";

    const parts: string[] = [];
    if (city) parts.push(city);
    if (district) parts.push(district);
    if (state) parts.push(state);

    const left = parts.join(", ");
    if (left && pincode) return `${left} - ${pincode}`;
    if (left) return left;
    return pincode || "";
  };

  const mapped = raw.map((r: any) => {
    const addr = r.address;
    let userLink = "";
    if (r.orderType === "B2B") {
      userLink = `/dashboard/network/view/b2b/${r.customerId}`;
    } else {
      userLink = `/dashboard/network/view/b2c/${r.customerId}`;
    }
    return {
      ...r,
      addressStr: formatAddress(addr),
      typeColor: OmsService.getOrderTypeColor(r.orderType || ""),
      userLink: userLink,
    };
  });

  return {
    data: mapped,
    total,
    isClientError:
      response?.data?.message?.toLowerCase().includes("client error") || false,
  };
};
