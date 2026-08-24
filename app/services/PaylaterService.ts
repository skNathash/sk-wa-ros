import { API } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import { isAfter, parseISO, differenceInCalendarDays } from "date-fns";
import { merge } from "lodash";

class PaylaterService {
  private static _withSalesEmpFilter(params: Record<string, any> = {}) {
    if (AuthService.isSalesEmployeeLoggedIn()) {
      const manpower = AuthService.getManpower<{ _id: string }>();
      return merge({}, params, { filter: { requestedBy: manpower?._id } });
    }
    return params;
  }

  static getValidityOptions() {
    return [
      { value: "1 Day", label: "1 Day" },
      { value: "7 Days", label: "7 Days" },
      { value: "30 Days", label: "30 Days" },
      { value: "60 Days", label: "60 Days" },
      { value: "90 Days", label: "90 Days" },
      { value: "1 Year", label: "1 Year" },
      { value: "Unlimited", label: "Unlimited" },
    ];
  }

  static createRequest(params: any) {
    return AjaxService.request(
      API + "/accounts/paylater/requests",
      "POST",
      params,
    );
  }

  static getRequests(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/requests`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  static async validateEligibility(params: Record<string, any>) {
    const resp: any = await AjaxService.request(
      `${API}accounts/paylater/validate-eligibility`,
      "POST",
      params,
    );

    if (resp.statusCode === 200 && resp.data.data?.paylaterInfo) {
      let statusColor = "default";
      let statusLbl = resp.data.data.paylaterInfo.status;

      const status = resp.data.data.paylaterInfo.status;
      const creditLimit = resp.data.data.paylaterInfo.creditLimit;
      const creditAvailable = resp.data.data.paylaterInfo.creditAvailable;

      const statusOption = this.getWalletStatusOptions().find(
        (option) => option.value === status,
      );
      if (statusOption) {
        statusColor = statusOption.color;
        statusLbl = statusOption.label;
      } else {
        statusColor = this.getWalletStatusColor(status);
      }

      resp.data.data.paylaterInfo = {
        ...resp.data.data.paylaterInfo,
        statusColor,
        outstandingBalance: creditLimit - creditAvailable,
        _statusLbl: statusLbl,
        _statusColor: statusColor,
      };
    }

    return resp;
  }

  static getWalletStatusOptions() {
    return [
      {
        value: "Approved",
        label: "Active",
        color: "success",
        statuses: ["Approved"],
      },
      {
        value: "Paused",
        label: "Paused",
        color: "warning",
        statuses: ["Paused"],
      },
      {
        value: "Pending",
        label: "Pending",
        color: "warning",
        statuses: ["Pending"],
      },
      {
        value: "Rejected",
        label: "Rejected",
        color: "danger",
        statuses: ["Rejected"],
      },
      {
        value: "Cancelled",
        label: "Stopped",
        color: "danger",
        statuses: ["Cancelled"],
      },
    ];
  }

  static getWalletStatusColor(status: string) {
    let statusColor = "default";
    const statusOption = this.getWalletStatusOptions().find(
      (option) => option.value === status,
    );
    if (statusOption) {
      statusColor = statusOption.color;
    }
    return statusColor;
  }

  static formatPaylaterRequest(data: Array<Record<string, any>>) {
    return data.map((item) => {
      let statusColor = "default";
      let statusLbl = item.status;
      const statusOption = this.getWalletStatusOptions().find(
        (option) => option.value === item.status,
      );
      if (statusOption) {
        statusColor = statusOption.color;
        statusLbl = statusOption.label;
      }

      let kycStatusColor = "default";
      if (item.kycStatus === "Approved") {
        kycStatusColor = "success";
      } else if (item.kycStatus === "Pending") {
        kycStatusColor = "warning";
      } else if (
        item.kycStatus === "Rejected" ||
        item.kycStatus === "Cancelled"
      ) {
        kycStatusColor = "danger";
      }

      // Prepare user redirection link based on userInfo.type
      // If userInfo.type === 'customer' -> b2c view, otherwise b2b view
      const userInfo = item.userInfo || {};
      const userType = (userInfo.type || "").toString().toLowerCase().trim();
      const userId = userInfo.id;
      const userCategory = userType === "customer" ? "B2C" : "B2B";

      let userRedirectionLink = "#";
      if (userId) {
        if (userType === "customer") {
          userRedirectionLink = `/dashboard/network/view/b2c/${userId}/paylater`;
        } else {
          userRedirectionLink = `/dashboard/network/view/b2b/${userId}/paylater`;
        }
      }

      // Prepare expiryStats based on validityEndDate
      let expiryStatus = "";
      let isOverdue = false;
      let isDueToday = false;
      try {
        const validityEnd = item.validityEndDate
          ? parseISO(item.validityEndDate)
          : null;
        if (!validityEnd) {
          expiryStatus = "";
        } else {
          const now = new Date();
          // If already expired
          if (isAfter(now, validityEnd)) {
            expiryStatus = "Over due";
            isOverdue = true;
          } else {
            const days = differenceInCalendarDays(validityEnd, now);
            if (days === 0) {
              expiryStatus = "Due today";
              isDueToday = true;
            } else {
              expiryStatus = `Expires in ${days} ${
                days === 1 ? "day" : "days"
              }`;
            }
          }
        }
      } catch (e) {
        expiryStatus = "";
      }

      item.userInfo._formattedAddress = [
        "doorNo",
        "street",
        "city",
        "district",
        "state",
        "postcode",
      ]
        .map((key) => item.userInfo?.address?.[key])
        .filter(Boolean)
        .join(", ");

      return {
        ...item,
        outstandingBalance: item.creditLimit - item.creditAvailable,
        kycStatusColor,
        userRedirectionLink,
        expiryStatus,
        isOverdue,
        isDueToday,
        userCategory,
        _canManage:
          !["Rejected", "Pending"].includes(item.status) &&
          item.kycStatus === "Approved",
        _statusLbl: statusLbl,
        _statusColor: statusColor,
      };
    });
  }

  static approveRequest(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}accounts/paylater/requests/${id}/approve`,
      "PUT",
      params,
    );
  }

  static rejectRequest(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}accounts/paylater/requests/${id}/reject`,
      "PUT",
      params,
    );
  }

  static updateLimit(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}accounts/paylater/requests/${id}/limit`,
      "PUT",
      params,
    );
  }

  static updateStatus(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}accounts/paylater/requests/${id}/status`,
      "PUT",
      params,
    );
  }

  static getRequest(id: string) {
    return AjaxService.request(`${API}accounts/paylater/requests/${id}`, "GET");
  }

  static updateRequest(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}accounts/paylater/requests/${id}`,
      "PUT",
      params,
    );
  }

  static getDashboardMetrics(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/dashboard`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  /**
   * Portfolio dashboard — the book-level snapshot behind the analytics hero:
   * wallet counts, the active/overdue/due-soon split, a health score, and the
   * outstanding / overdue / recovered money blocks.
   */
  static getPortfolioDashboard(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/portfolio/dashboard`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  /**
   * Insights dashboard — one endpoint keyed by `type` ("aging", "cashflow", …);
   * each type answers with its own slice under `data`.
   */
  static getInsightsDashboard(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/insights/dashboard`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  static getStatements(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/statement`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  static formatStatements(data: Array<Record<string, any>>) {
    return data.map((item) => {
      let user = {
        name: item.userContext?.userName,
        mobile: item.userContext?.userMobile,
        id: item.userContext?.userId,
        type: item.userContext?.userType === "customer" ? "B2C" : "B2B",
        redirectionLink:
          item.userContext?.userType === "customer"
            ? `/dashboard/network/view/b2c/${item.userContext?.id}`
            : `/dashboard/network/view/b2b/${item.userContext?.id}`,
      };

      return {
        ...item,
        user,
      };
    });
  }

  static getTopOutstandingBalances(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/top-outstanding`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  static getRequestCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/requests`,
      "GET",
      this._withSalesEmpFilter({ ...params, outputType: "count" }),
    );
  }

  static getDueAmounts(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/paylater/due-amounts`,
      "GET",
      this._withSalesEmpFilter(params),
    );
  }

  static enablePaylater(type: "b2b" | "b2c", params: Record<string, any>) {
    return AjaxService.request(
      `${API}accounts/paylater/${type}/enable`,
      "POST",
      params,
    );
  }
}

export default PaylaterService;
