import { API } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import SellerCatalogService from "./SellerCatalogService";
import { set } from "date-fns";

class OmsService {
  public static getOrderStatuses(): Array<{
    name: string;
    value: string;
    statusColor: string;
    statuses: Array<string>;
  }> {
    const statuses = [
      {
        name: "Approval Pending",
        value: "Pending",
        statusColor: "warning",
        statuses: ["Pending"],
      },
      {
        name: "Approved",
        value: "Created",
        statusColor: "success",
        statuses: ["Created"],
      },
      {
        name: "Picking",
        value: "Picking",
        statusColor: "warning",
        statuses: ["Picking"],
      },
      {
        name: "Packing",
        value: "Packing",
        statusColor: "primary",
        statuses: ["Packing"],
      },
      {
        name: "Packed",
        value: "Packed",
        statusColor: "primary",
        statuses: ["Packed"],
      },
      {
        name: "Invoiced",
        value: "Invoiced",
        statusColor: "secondary",
        statuses: ["Invoiced"],
      },
      {
        name: "Shipped",
        value: "Shipped",
        statusColor: "success",
        statuses: ["Shipped"],
      },
      {
        name: "Delivered",
        value: "Delivered",
        statusColor: "success",
        statuses: ["Delivered"],
        apiFilter: {
          filter: {
            status: {
              $in: ["Delivered"],
            },
          },
        },
      },
      {
        name: "Cancelled",
        value: "Cancelled",
        statusColor: "danger",
        statuses: ["Cancelled"],
        apiFilter: {
          filter: {
            status: {
              $in: ["Cancelled"],
            },
          },
        },
      },
    ];

    return statuses;
  }

  public static prepareOrderSummary(order: any) {
    if (!order || !Array.isArray(order.items)) return order;
    let totalMrp = 0;
    let totalPrice = 0;
    let itemSavings = 0;
    let finalAmt = 0;
    order.items.forEach((item: any) => {
      if (item.status !== "Cancelled" && item.status !== "Returned") {
        totalMrp += (item.mrp || 0) * (item.quantity || 1);
        totalPrice += item.finalPrice || 0;
        itemSavings += (item.mrp || 0) - (item.finalPrice || 0);
        finalAmt += item.finalPrice || 0;
      }
    });
    order._totalMrp = totalMrp;
    order._totalPrice = totalPrice;
    order._itemSavings = itemSavings;
    order._finalAmt = finalAmt + (order._shippingCharges || 0);
    order.netAmount = order.netAmount || 0;

    return order;
  }

  public static getStatusSummary(subOrders: any[]) {
    const statusSummary: Record<
      string,
      { count: number; status: string; color: string }
    > = {};
    subOrders.forEach((subOrder: any) => {
      if (statusSummary[subOrder.status]) {
        statusSummary[subOrder.status].count++;
      } else {
        statusSummary[subOrder.status] = {
          count: 1,
          status: subOrder.status,
          color: this.getStatusColor(subOrder.status),
        };
      }
    });
    return Object.values(statusSummary);
  }

  static async getSalesOrders(fid: string, params: Record<string, any> = {}) {
    const response = await AjaxService.request(
      `${API}sales/order/${fid}/list`,
      "GET",
      params,
    );
    return response;
  }

  static async getPendingOrderCount(): Promise<number> {
    try {
      const fid = AuthService.getLoggedInUserId() || "";
      const statuses = ["Created", "Pending"];
      if (AuthService.isBuyerUser()) {
        statuses.push("Shipped");
      }
      const params = {
        outputType: "count",
        filter: { status: { $in: statuses } },
      };
      const resp = await OmsService.getSalesOrders(fid, params);
      return resp?.data?.data || 0;
    } catch (e) {
      return 0;
    }
  }

  static async getMyOrders(params: Record<string, any>) {
    return AjaxService.request(
      `${API}sales/order/customer/list`,
      "GET",
      params,
    );
  }

  public static getStatusColor(status: string): string {
    const statusObj: any = this.getOrderStatuses().find((s) =>
      s.statuses.includes(status),
    );

    // Return the color if found, default to secondary
    return statusObj?.statusColor ?? "secondary";
  }

  static getStatusLabel(status: string): string {
    const statusObj: any = this.getOrderStatuses().find((s) =>
      s.statuses.includes(status),
    );

    // Return the label if found, default to "Unknown"
    return statusObj?.name ?? status;
  }

  static getOrderTypeColor(orderType: string): string {
    return orderType === "B2B" ? "primary" : "success";
  }

  static getRefundStatusColor(status: string): string {
    const map: Record<string, string> = {
      Pending: "warning",
      Submitted: "success",
      Approved: "success",
      Completed: "success",
      Success: "success",
      Rejected: "danger",
      Failed: "danger",
      Cancelled: "danger",
    };
    return map[status] ?? "secondary";
  }

  static getRefundDisplayStatus(status: string): string {
    return status === "Submitted" ? "Refunded" : status || "";
  }

  static formatRefundResponse(rows: any[]): any[] {
    return (rows || []).map((row) => ({
      ...row,
      _statusColor: this.getRefundStatusColor(row.status || ""),
      _typeColor: this.getOrderTypeColor(row.orderType || ""),
      displayStatus: this.getRefundDisplayStatus(row.status || ""),
    }));
  }

  /**
   * Return a display color for the order sub-type.
   * Known sub-types: POS, CLUB, RETAIL, COINSTORE
   * Mapping chosen to match existing app color tokens.
   */
  static getOrderSubTypeColor(orderSubType: string): string {
    switch ((orderSubType || "").toUpperCase()) {
      case "POS":
        return "primary";
      case "CLUB":
        return "success";
      case "RETAIL":
        return "secondary";
      case "COINSTORE":
        return "warning";
      default:
        return "secondary";
    }
  }

  static getPaymentStatusColor(paymentStatus: string): string {
    switch ((paymentStatus || "").toUpperCase()) {
      case "PENDING":
      case "APPROVAL PENDING":
        return "warning";
      case "APPROVED":
      case "PAID":
        return "success";
      case "REJECTED":
      case "UNPAID":
        return "danger";
      default:
        return "secondary";
    }
  }

  /**
   * Return a display color token for a payment method.
   * Examples: CASH, CARD, UPI, PAYLATER, WALLET, NETBANKING, EMI
   */
  public static getPaymentMethodColor(paymentMethod: string): string {
    switch ((paymentMethod || "").toUpperCase()) {
      case "UPI":
        return "primary";
      case "COD":
        return "success";
      case "PAYLATER":
        return "secondary";
      case "PREPAID":
        return "primary";
      default:
        return "secondary";
    }
  }

  public static buildRefundSettlementFields(refundSettlement: any) {
    const settlements: any[] = Array.isArray(refundSettlement)
      ? refundSettlement
      : refundSettlement
        ? [refundSettlement]
        : [];
    const normalized = settlements.map((s: any) => ({
      id: s?._id ?? s?.refundSettlementId,
      refundSettlementId: s?.refundSettlementId ?? s?._id,
      refundSettlementRefId: s?.refundSettlementRefId,
      status: s?.status,
      amount: s?.amount || 0,
      remarks: s?.remarks || "",
    }));
    const pending = normalized.filter((s) => s.status === "Pending");
    return {
      refundSettlements: normalized,
      refundPending: pending.length > 0,
      pendingRefundAmount: pending.reduce((a, s) => a + (s.amount || 0), 0),
    };
  }

  public static formatOrderResponse(orders: any[]): any[] {
    if (!Array.isArray(orders)) return [];

    return orders.map((order) => {
      const isMyOrder =
        (order.sellerInfo?.franchiseId || "") ===
        AuthService.getLoggedInUserId();

      // Cart discount is now stored under `discountInfo`; normalize it onto
      // `order.discount` so existing consumers keep working.
      order.discount = order.discountInfo?.totalAmount ?? order.discount ?? 0;

      // Split the discount breakup into coupon vs cart discount. A breakup
      // entry with source "Coupon" is a coupon discount; anything else is a
      // generic cart discount.
      const breakup: Record<string, any>[] = order.discountInfo?.breakup ?? [];
      const couponBreakup = breakup.find(
        (b) => (b.source || "").toLowerCase() === "coupon",
      );
      order.couponAppliedValue = couponBreakup?.finalValue ?? 0;
      order.couponAppliedCode = couponBreakup?.code ?? "";

      // Everything that isn't a coupon is treated as cart discount.
      order.cartDiscount = breakup
        .filter((b) => (b.source || "").toLowerCase() !== "coupon")
        .reduce((sum, b) => sum + (b.finalValue ?? 0), 0);

      if (
        order.deliveryTimeSlot?.date &&
        order.deliveryTimeSlot?.from &&
        order.deliveryTimeSlot?.to
      ) {
        const dt = order.deliveryTimeSlot?.date;

        const fromHour = Math.floor(order.deliveryTimeSlot?.from);
        const fromMins =
          order.deliveryTimeSlot?.from % 1 == 0
            ? 0
            : (order.deliveryTimeSlot?.from % 1) * 100;

        const toHour = Math.floor(order.deliveryTimeSlot?.to);
        const toMins =
          order.deliveryTimeSlot?.to % 1 == 0
            ? 0
            : (order.deliveryTimeSlot?.to % 1) * 100;

        order.deliveryTimeSlot._from = set(dt, {
          hours: fromHour,
          minutes: fromMins,
          seconds: 0,
        }).toISOString();
        order.deliveryTimeSlot._to = set(dt, {
          hours: toHour,
          minutes: toMins,
          seconds: 0,
        }).toISOString();

        try {
          const now = new Date();
          const toDate = new Date(order.deliveryTimeSlot._to);
          order.deliveryTimeSlot.isDelayed = now > toDate;
        } catch (e) {
          order.deliveryTimeSlot.isDelayed = false;
        }
      }

      order.items?.map((e: Record<string, any>) => {
        e._statusColor = this.getStatusColor(e.status || "");
        e._statusLbl = this.getStatusLabel(e.status || "");
        let cancelOrder = false;
        if (e.remainingQty > 0) {
          cancelOrder = true;
        }

        e.packSoldQty = 0;

        if (e.packType?.toLowerCase() != "unit") {
          e.packSoldQty = SellerCatalogService.convertUnitsToPackQty(
            e.quantity || 0,
            e.packQuantity || 0,
          );
        }

        if (
          !isMyOrder &&
          ["Pending", "Created", "Approved"].includes(order.status || "")
        ) {
          cancelOrder = false;
        }

        // Disable item-level cancel for coin store orders
        if ((order.orderSubType || "").toUpperCase() === "COINSTORE") {
          cancelOrder = false;
        }

        e._showCancel = cancelOrder;
        e._totalValue = e.quantity * e.price;
      });

      const coinsRewared = order.loyaltyPoints?.rewardedCoin || 0;
      const coinsRedeemed = order.loyaltyPoints?.redeemedCoin || 0;
      const coinsRedeemedValue = order.loyaltyPoints?.redeemedValue || 0;

      const sellerFranchiseId = order.sellerInfo?.franchiseId || "";

      let payableAmt = order.payableAmount || order.orderAmount;

      if (order.invoices?.length > 0) {
        payableAmt = order.invoices[0].invoiceAmount;

        // Coupon and cart discounts are not reflected in the invoice amount;
        // deduct them
        // payableAmt -= order.couponAppliedValue || 0;
        payableAmt -= order.cartDiscount || 0;

        // Coins redeemed are not reflected in the invoice amount;
        // deduct their value for non coin-store orders
        if ((order.orderSubType || "").toUpperCase() !== "COINSTORE") {
          payableAmt -= coinsRedeemedValue;
        }
      }

      let cancelFullOrder = false;
      const cancelableStatuses = [
        "Pending",
        "Created",
        "Approved",
        "Picking",
        "Packing",
        // "Packed",
      ];

      if (cancelableStatuses.includes(order.status || "")) {
        cancelFullOrder = true;
      }

      if (
        !isMyOrder &&
        ["Created", "Approved", "Pending"].includes(order.status || "")
      ) {
        cancelFullOrder = true;
      }

      // Disable full-order cancel for coin store orders
      if ((order.orderSubType || "").toUpperCase() === "COINSTORE") {
        cancelFullOrder = false;
      }

      let canProcess = false;
      if (sellerFranchiseId === AuthService.getLoggedInUserId()) {
        if (
          order.orderSubType === "POS" &&
          order.orderType === "B2C" &&
          !order.assistedOrder
        ) {
          canProcess = false;
        } else {
          canProcess = true;
        }
      }

      let customerLink = "";

      if (order.customerInfo?.franchiseId && order.orderType === "B2B") {
        customerLink = `/dashboard/network/view/b2b/${order.customerInfo?.franchiseId}`;
      }

      if (order.customerInfo?.customerId) {
        customerLink = `/dashboard/network/view/b2c/${order.customerInfo?.customerId}`;
      }

      order._customerLink = customerLink;

      let paymentStatus = order.paymentStatus;

      if (Array.isArray(order.paymentMode) && order.paymentMode.length > 0) {
        const pm = order.paymentMode.find(
          (mode: any) => mode.approvalStatus === "Pending",
        );

        const pmReject = order.paymentMode.find(
          (mode: any) => mode.approvalStatus === "Rejected",
        );

        if (pm) {
          paymentStatus = "Approval Pending";
        }

        if (pmReject) {
          paymentStatus = "Rejected";
        }
      }

      const splitOrderStatuses = ["Created", "Pending"];
      const hasReserveItem =
        Array.isArray(order.items) &&
        order.items.some(
          (i: any) => i?.isReserve === true || i?.isReserveOrder === true,
        );
      const hasPendingShiplaterRequest =
        order.shiplaterRequest?.status === "Pending";
      const canDoSplitOrder =
        splitOrderStatuses.includes(order.status || "") &&
        hasReserveItem &&
        !order.isSplitOrder;

      const needsPaymentApproval =
        paymentStatus === "Approval Pending" &&
        ["Created", "Approved", "Pending"].includes(order.status || "") &&
        isMyOrder &&
        !hasPendingShiplaterRequest;

      const hasInsufficientStock =
        (order.isReserveOrder || hasReserveItem) &&
        !order.shiplaterRequest &&
        !needsPaymentApproval &&
        Array.isArray(order.items) &&
        order.items.some(
          (it: any) => it?.showAddStock && it?.status !== "Cancelled",
        );

      const createdBy = order.createdBy
        ? {
            ...order.createdBy,
            redirect: this.getCreatedByRedirect(order.createdBy),
          }
        : order.createdBy;

      return {
        ...order,
        createdBy,
        // mark orders coming from coin store
        isKcStore: order.orderSubType === "COINSTORE",
        _showCancelFullOrder: cancelFullOrder,
        _statusColor: this.getStatusColor(order.status || ""),
        _statusLbl: this.getStatusLabel(order.status || ""),
        _typeColor: this.getOrderTypeColor(order.orderType || ""),
        _subTypeColor: this.getOrderSubTypeColor(order.orderSubType || ""),
        _canProcessOrder: canProcess,
        _payableAmt: payableAmt,
        coinsRewared,
        coinsRedeemed,
        coinsRedeemedValue,
        isMyOrder,
        isPaylaterOrder: order.paymentMethod === "PAYLATER",
        pickupType: order.pickUpAtStore ? "Pickup from store" : "",
        pickupTypeColor: order.pickUpAtStore ? "warning" : "primary",
        _paymentMethodColor: this.getPaymentMethodColor(
          order.paymentMethod || "",
        ),
        _needToApprove:
          order.status === "Pending" &&
          isMyOrder &&
          order.shiplaterRequest?.status !== "Pending",
        _needPaymentApproval: needsPaymentApproval,
        _hasRoundDifference: order.actualOrderAmount !== order.payableAmount,
        _paymentStatusColor: this.getPaymentStatusColor(paymentStatus || ""),
        _paymentStatusLbl: paymentStatus || "",
        canDoSplitOrder,
        _isReserveOrder: order.isReserveOrder || hasReserveItem,
        showApproveForShiplater:
          order.shiplaterRequest?.status === "Pending" &&
          !isMyOrder &&
          order.isReserveOrder &&
          !needsPaymentApproval,
        waitingForBuyerApproval:
          order.shiplaterRequest?.status === "Pending" &&
          isMyOrder &&
          !needsPaymentApproval,
        showShipLaterButton:
          order.isReserveOrder &&
          !order.shiplaterRequest &&
          order.status === "Pending" &&
          isMyOrder &&
          !needsPaymentApproval,
        _canCancelShipLaterRequest:
          order.shiplaterRequest?.status === "Pending" && isMyOrder,
        _hasInsufficientStock: hasInsufficientStock,
        ...this.buildRefundSettlementFields(order.refundSettlements || []),
      };
    });
  }

  private static getCreatedByRedirect(
    createdBy: Record<string, any>,
  ): { path: string; params?: Record<string, string> } | null {
    const userType = (createdBy.userType || "").toLowerCase();

    if (userType === "manpower" && createdBy.id) {
      return {
        path: `/dashboard/employee/view/${createdBy.id}`,
      };
    }

    return null;
  }

  public static async convertToPurchaseOrder(id: string) {
    return AjaxService.request(
      `${API}/purchase/orders/convert/to/po/${id}`,
      "POST",
      {},
    );
  }

  static async getSellerOrderDetail(orderId: string) {
    return AjaxService.request(`${API}sales/order/${orderId}`, "GET");
  }

  static async approveOrder(orderId: string) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/approve`,
      "PUT",
      {},
    );
  }

  static async shipLaterRequest(
    orderId: string,
    data: { expectedDeliveryDate: string; reason: string },
  ) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/shiplater-request`,
      "POST",
      data,
    );
  }

  static async cancelShipLaterRequest(
    orderId: string,
    data: { remarks: string },
  ) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/shiplater-request/cancel`,
      "POST",
      data,
    );
  }

  static async respondShipLaterRequest(
    orderId: string,
    data: { acceptRequest: boolean; remarks: string },
  ) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/shiplater-request/respond`,
      "PUT",
      data,
    );
  }

  /**
   * Submit payment details for an order
   * Endpoint: PUT sales/order/{orderId}/payment
   */
  static async submitOrderPayment(orderId: string, data: any) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/payment`,
      "PUT",
      data,
    );
  }

  /**
   * Update payment mode approval status for an order.
   * Endpoint: /order/:orderId/payment-mode/status
   * Payload: { action: string, remarks?: string }
   */
  static async updatePaymentStatus(
    orderId: string,
    data: { action: string; remarks?: string },
  ) {
    return AjaxService.request(
      `${API}/sales/order/${orderId}/payment-mode/status`,
      "PUT",
      data,
    );
  }

  static async getSellerInvoices(orderId: string) {
    return AjaxService.request(`${API}sales/invoices`, "GET");
  }

  static async getSellerOrderInvoiceDetail(invoiceId: string) {
    return AjaxService.request(`${API}/sales/invoice/${invoiceId}`, "GET");
  }

  static async cancelOrderItem(orderId: string, data: any) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/items/cancel`,
      "POST",
      data,
    );
  }

  static async submitRefundSettlementPayment(
    refundSettlementId: string,
    data: any,
  ) {
    return AjaxService.request(
      `${API}sales/refundsettlement/${refundSettlementId}/payment`,
      "PUT",
      data,
    );
  }

  static async getSellerRefundSettlements(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}sales/refundsettlement/seller/list`,
      "GET",
      params,
    );
  }

  static async getRefundSettlement(refundSettlementId: string) {
    return AjaxService.request(
      `${API}sales/refundsettlement/${refundSettlementId}`,
      "GET",
    );
  }

  static async createSplitRequest(orderId: string, data: any) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/split-request`,
      "POST",
      data,
    );
  }

  static async getOrderSplitRequests(orderId: string, params: any = {}) {
    return AjaxService.request(
      `${API}sales/order/${orderId}/split-requests`,
      "GET",
      params,
    );
  }

  static async getSplitRequestCustomerList(params: any = {}) {
    return AjaxService.request(
      `${API}sales/order/split-request/customer/list`,
      "GET",
      params,
    );
  }

  static async respondSplitRequest(requestId: string, data: any) {
    return AjaxService.request(
      `${API}sales/order/split-request/${requestId}/respond`,
      "PUT",
      data,
    );
  }

  static async approveSplitRequest(requestId: string) {
    return this.respondSplitRequest(requestId, {
      AcceptParentOrder: true,
      AcceptSplitOrder: true,
    });
  }

  static async rejectSplitRequest(requestId: string, remarks?: string) {
    return this.respondSplitRequest(requestId, {
      AcceptParentOrder: true,
      AcceptSplitOrder: false,
      remarks: remarks,
    });
  }

  static getSplitRequestStatusColor(status: string): string {
    switch (status) {
      case "Pending":
        return "warning";
      case "Approved":
        return "success";
      case "Rejected":
        return "danger";
    }
    return "secondary";
  }

  static formatSplitRequestCustomerList(item: Record<string, any>) {
    const order = item.order;
    return {
      ...item,
      order,
      orderedOn: item?.orderDate,
      orderId: item?.orderId,
      statusColor: this.getSplitRequestStatusColor(item.status || ""),
    };
  }

  static async getShippedPackagesFromSK(params: any = {}) {
    return AjaxService.request(
      `${API}/purchase/orders/shipped/from/sk`,
      "GET",
      params,
    );
  }

  static async getDeliveredPackagesFromSK(params: any = {}) {
    return AjaxService.request(
      `${API}/purchase/orders/delivered/from/sk`,
      "GET",
      params,
    );
  }

  static async getShippedPackagesFromSKDetails(id: string, params: any = {}) {
    return AjaxService.request(
      `${API}/purchase/orders/package/${id}/details`,
      "GET",
      params,
    );
  }

  /**
   * Trigger print/download for shipment package summary invoice
   * Endpoint: purchase/shipmentpackagesummary/invoice/{InvoiceId}/print
   */
  static async printShipmentPackageInvoice(invoiceId: string) {
    return AjaxService.request(
      `${API}purchase/shipmentpackagesummary/invoice/${invoiceId}/print`,
      "GET",
    );
  }

  /**
   * Update order configuration such as accepting pre-orders (orders without stock)
   * Payload: { acceptPreOrder: boolean }
   */
  static async createInvoiceFromPicking(pickingId: string, orderId: string) {
    return AjaxService.request(`${API}sales/invoice/from-picking`, "POST", {
      pickingId,
      orderId,
    });
  }

  static async getSellerDealSyncStatus(dealId: string) {
    return AjaxService.request(
      `${API}catalog/seller-deals/sync-status/${dealId}`,
      "GET",
    );
  }

  static async updateSellerDealQuantity(data: {
    sellerId: string;
    action: string;
    remarks?: string;
    dealId: string;
    quantity?: number;
  }) {
    return AjaxService.request(
      `${API}catalog/seller-deals/update-quantity`,
      "PATCH",
      data,
    );
  }

  static async updateOrderConfig(data: { acceptPreOrder: boolean }) {
    return AjaxService.request(
      `${API}franchise/${AuthService.getLoggedInUserId()}/configParams`,
      "PUT",
      data,
    );
  }
}

export default OmsService;
