import { API } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import type { AxiosRequestConfig } from "axios";
import { endOfDay, startOfDay } from "date-fns";

class OmsDashboardService {
  static async getByStatus(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}sales/dashboard/order-by-status`,
      "GET",
      params,
      config,
    );
  }

  static async getOrderCards(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}sales/dashboard/order-cards`,
      "GET",
      params,
      config,
    );
  }

  static async getOrderPayment(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}sales/dashboard/order-payment`,
      "GET",
      params,
      config,
    );
  }

  static async getOrderReport(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${API}sales/dashboard/order/reports`,
      "GET",
      params,
      config,
    );
  }

  static prepareCommonFilterParams(filter: Record<string, any>) {
    const isSalesEmployee = AuthService.isSalesEmployeeLoggedIn();
    const manpower = isSalesEmployee ? AuthService.getManpower() : null;

    const params: Record<string, any> = {
      filter: {
        "sellerInfo.franchiseId": isSalesEmployee
          ? manpower?.franchiseInfo?.franchiseId
          : AuthService.getLoggedInUserId(),
      },
    };

    const salesEmployeeId =
      filter.salesEmployeeId || filter.salesEmployee?.value?.id;

    if (salesEmployeeId) {
      params.filter["createdBy.referenceId"] = salesEmployeeId;
      params.filter["createdBy.userType"] = "Manpower";
    } else if (isSalesEmployee) {
      params.filter["createdBy.referenceId"] = manpower?._id;
      params.filter["createdBy.userType"] = "Manpower";
    }

    // tab
    if (filter.mainTab === "b2b-orders") {
      params.filter.orderType = "B2B";
    }

    if (filter.mainTab === "b2c-orders") {
      params.filter.orderType = "B2C";
    }

    if (filter.dateRange && filter.dateRange.length > 0) {
      params.filter.createdAt = {
        $gte: startOfDay(filter.dateRange[0]),
        $lte: endOfDay(filter.dateRange[1]),
      };
    }

    return params;
  }
}

export default OmsDashboardService;
