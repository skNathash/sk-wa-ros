import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import { formatDistanceToNow } from "date-fns";
import type { VariantColor } from "~/types/CommonTypes";

/**
 * Service for Customer related API calls
 */
export class CustomerService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  /**
   * Validate a mobile number for login/registration
   * @param params - { mobileNo: string }
   * @returns Promise with validation result
   */
  public static validateNumber(params: { mobileNo: string }) {
    // The actual endpoint may differ; this is a placeholder based on conventions
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/validate/number`,
      "POST",
      params,
    );
  }

  static getCustomerReqStatusLabel(
    status: string,
    tranStatus: string,
    type: string,
  ): string {
    const statusObj: Record<string, string> = {
      Created: "Approval Pending",
      Approved: "Yet to Process",
      Rejected: "Rejected",
      Validate: "Payment Pending",
      Cancelled: "Cancelled",
      Delivered: "Delivered",
      Shipped: "Shipped",
      Closed: "Success",
      Invoiced: "Ready to Ship",
    };
    let s = statusObj[status] || status;

    if (status === "Closed") {
      if (tranStatus === "Failed") {
        s = "Failed";
      } else if (tranStatus === "Cancelled") {
        s = "Cancelled";
      } else if (["Success", "Successful"].includes(tranStatus)) {
        s = "Success";
      }
    }

    if (type === "addBeneficiary" && status === "Approved") {
      s = "Beneficiary Create Pending";
    }

    return s;
  }

  static getCustomerReqStatusBg(status: string): string {
    const s: Record<string, string> = {
      "Approval Pending": "warning",
      "Yet to Process": "secondary",
      "Yet to Ship": "info",
      "Ready to Ship": "info",
      Rejected: "danger",
      Success: "success",
      Failed: "danger",
      Cancelled: "danger",
      "Payment Pending": "warning",
      Delivered: "success",
      Shipped: "info",
      Expired: "danger",
      Returned: "dark",
    };
    return s[status] || "default";
  }

  /**
   * Badge copy and colour for a directory row. The buyer flag decides Active /
   * Inactive; a switched-off account outranks both.
   *
   * Inactive carries its own red classes: the badge's `light` variant falls
   * through to the themed `secondary` surface, which reads green in theme-2.
   */
  static getCustomerStatusBadge(
    isActiveBuyer: boolean,
    isEnabled: boolean,
  ): { label: string; color: VariantColor; className?: string } {
    if (!isEnabled) return { label: "Disabled", color: "danger" };
    return isActiveBuyer
      ? { label: "Active", color: "success" }
      : {
          label: "Inactive",
          color: "light",
          className: "tw:bg-red-50! tw:text-red-600! tw:border-transparent!",
        };
  }

  static getCustomerRequestSummaryStatuses() {
    return [
      "approvalPending",
      "yetToProcess",
      "readyToShip",
      "shipped",
      "delivered",
    ];
  }

  static getCustomerRequestStatuses() {
    return [
      {
        label: "Approval Pending",
        value: "approvalPending",
        color: "warning",
        statuses: ["Created"],
      },
      {
        label: "Yet to Process",
        value: "yetToProcess",
        color: "secondary",
        statuses: ["Approved"],
      },
      {
        label: "Shipped",
        value: "shipped",
        color: "success",
        statuses: ["Shipped"],
      },
      {
        label: "Delivered",
        value: "delivered",
        color: "success",
        statuses: ["Delivered"],
      },
      {
        label: "Ready to Ship",
        value: "readyToShip",
        color: "info",
        statuses: ["Invoiced", "Packed"],
      },
      {
        label: "Cancelled",
        value: "cancelled",
        color: "danger",
        statuses: ["Cancelled"],
      },
      {
        label: "Rejected",
        value: "rejected",
        color: "danger",
        statuses: ["Rejected"],
      },
      {
        label: "Expired",
        value: "expired",
        color: "danger",
        statuses: ["Expired"],
      },
      {
        label: "Returned",
        value: "returned",
        color: "danger",
        statuses: ["Returned"],
      },
    ];
  }

  static createCustomer(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/create`,
      "POST",
      params,
    );
  }

  static getCustomers(params: Record<string, any>) {
    return AjaxService.request(`${this.BASE_URL}/customer/list`, "GET", params);
  }

  static getCustomersCount(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/count`,
      "GET",
      params,
    );
  }

  static getCustomer(id: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${id}`,
      "GET",
      params,
    );
  }

  static updateCustomer(id: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${id}`,
      "PUT",
      params,
    );
  }

  static linkCustomerToFranchise(customerId: string, franchiseId: string) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${customerId}/link-franchise`,
      "POST",
      { franchiseId },
    );
  }

  static getClubRequests(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/customerServiceRequest`,
      "GET",
      params,
    );
  }

  static getClubRequestsCount(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/customerServiceRequest/count`,
      "GET",
      params,
    );
  }

  static formatCustomerOrderRequests(data: any[]): any[] {
    return (data || []).map((e: any) => {
      e["_statusLbl"] = this.getCustomerReqStatusLabel(
        e["status"],
        e["transactionStatus"] || "",
        e["type"],
      );

      e["_bgCss"] = this.getCustomerReqStatusBg(e["_statusLbl"]);

      let totMrp = 0;
      let totPrice = 0;
      let totFreePrdPrice = 0;

      if (e.deliveryTimeSlot?.date) {
        const dt = e.deliveryTimeSlot.date;

        e.deliveryTimeSlot._from = new Date(
          new Date(dt).setHours(e.deliveryTimeSlot.from, 0, 0, 0),
        ).toISOString();

        e.deliveryTimeSlot._to = new Date(
          new Date(dt).setHours(e.deliveryTimeSlot.to, 0, 0, 0),
        ).toISOString();

        const now = new Date();
        const endTime = new Date(e.deliveryTimeSlot._to);
        e.deliveryTimeSlot.remainingTime = formatDistanceToNow(endTime, {
          addSuffix: true,
          includeSeconds: true,
        });

        if (endTime < now) {
          e.deliveryTimeSlot.remainingTime = "Time Expired";
        }
      }

      if (typeof e.collectAmount === "undefined") {
        e.collectAmount = e.orderAmount;
      }

      e._displayFinalAmt =
        e.paidAmount || e.payableAmount || e.collectAmount || e.orderAmount;

      // Prepare timeline data

      (e.listingPayload || []).forEach((x: any) => {
        // Set status color
        const statusColorMap: Record<string, string> = {
          Created: "info",
          Pending: "warning",
          Approved: "success",
          Rejected: "danger",
          Completed: "primary",
        };
        x._statusColor = statusColorMap[x.status] || "default";

        x._totalMrp = x.quantity * x.mrp;
        x._totalPrice = x.quantity * x.price;

        if (x.status === "Rejected") {
          (x.offerDetails?.deals || []).forEach((offer: any) => {
            offer.status = "Rejected";
            offer.remarks = x.remarks;
          });
        } else {
          totMrp += x._totalMrp;

          (x.offerDetails?.deals || []).forEach((offer: any) => {
            offer.status = x.status;
            offer._totalMrp = offer.quantity * offer.mrp;
            offer._totalPrice = offer.quantity * offer.price;

            offer.dealId = offer.id;

            totMrp += offer._totalMrp;

            if (offer.isFree) {
              totFreePrdPrice += offer._totalMrp;
            } else {
              totPrice += offer._totalPrice;
            }
          });

          if (x.isFree) {
            totFreePrdPrice += x._totalMrp;
          } else {
            totPrice += x._totalPrice;
          }
        }
      });

      e._totalItems =
        e.listingPayload?.filter((x: any) => x.status !== "Rejected").length ||
        0;

      e._totalMrp = totMrp;
      e._totalPrice = totPrice;
      e._itemSavings = totMrp - totPrice + totFreePrdPrice;

      e._redeemedCoins = e.redeemCoins || { value: 0 };

      e._displayShippingAddress =
        e.shippingAddress?.address?.full_address ||
        [e.shippingAddress?.address?.line1, e.shippingAddress?.address?.line2]
          .filter(Boolean)
          .join(", ");

      return e;
    });
  }

  static updateClubRequestStatus(id: string, status: string, params?: any) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/customerServiceRequest/updatestatus/${id}/${status}`,
      "PUT",
      params || {},
    );
  }

  static updateClubRequest(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/customerServiceRequest/updateList/status`,
      "PUT",
      params,
    );
  }

  static confirmBuyandSellOrder(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/customerServiceRequest/confirmBuyandSellOrder`,
      "POST",
      params,
    );
  }

  public static getRewardedCoins(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/coins/rewarded`,
      "GET",
      params,
    );
  }

  public static getCustomerInsight(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/customer/insights`,
      "GET",
      params,
    );
  }

  static async getCallLogs(params: Record<string, any>) {
    const r = await AjaxService.request(
      `${this.BASE_URL}/notification/${this.API_VERSION}/callLog/fetch`,
      "GET",
      params,
    );

    if (Array.isArray(r.data)) {
      r.data.forEach((e: any) => {
        e._statusType = e.status == "Failed" ? "danger" : "success";
      });
    }
    return r;
  }

  static async getCallLogsCount(params: Record<string, any>) {
    const r = await AjaxService.request(
      `${this.BASE_URL}/notification/${this.API_VERSION}/callLog/fetch/count`,
      "GET",
      params,
    );
    return { count: r.data || 0 };
  }

  static callToCustomer(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/notification/${this.API_VERSION}/callLog/manual/create`,
      "POST",
      params,
    );
  }

  static getClubList(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/customer/${this.API_VERSION}/club/list`,
      "GET",
      params,
    );
  }

  static getCustomerNetwork(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}customer/network`,
      "GET",
      params,
    );
  }

  /**
   * Customer directory list for the franchise dashboard. Returns the rows
   * along with `pagination` (page/limit/total/pages), so the list screens do
   * not need a separate count call.
   */
  static getCustomerDashboardList(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}customer/dashboard/customers`,
      "GET",
      params,
    );
  }

  static getCustomerNetworkCount(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}customer/network/count`,
      "GET",
      params,
    );
  }
}

export default CustomerService;
