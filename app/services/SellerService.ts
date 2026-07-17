import { API } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";

/**
 * Service for Seller related API calls
 */
export class SellerService {
  private static readonly BASE_URL = API;

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

  public static getSubOrderStatusColor(status: string) {
    const statusColors: Record<string, string> = {
      Packed: "primary",
      Created: "info",
      Received: "success",
      "Payment Initiated": "warning",
      Confirmed: "primary",
      Invoiced: "secondary",
      Cancelled: "danger",
      Processing: "warning",
      "Partially Shipped": "warning",
      Shipped: "success",
      "Partially Delivered": "warning",
      Delivered: "success",
      "Partially Returned": "warning",
      Returned: "danger",
      Pending: "warning",
    };
    return statusColors[status] || "secondary";
  }

  static async getSellerOrderDetail(orderId: string) {
    return AjaxService.request(`${this.BASE_URL}sales/order/${orderId}`, "GET");
  }

  static async getSellerOrders(fid: string, params: Record<string, any> = {}) {
    const response = await AjaxService.request(
      `${this.BASE_URL}sales/order/${fid}/list`,
      "GET",
      params
    );
    return response;
  }

  public static formatOrderResponse(orders: any[]): any[] {
    if (!Array.isArray(orders)) return [];

    return orders.map((order) => ({
      ...order,
      _statusColor: this.getStatusColor(order.status || ""),
      _typeColor: order.orderType === "B2B" ? "primary" : "secondary",
      _canProcessOrder:
        order?.sellerInfo?.franchiseId === AuthService.getLoggedInUserId(),
      _payableAmt: order.payableAmount || order.orderAmount,
    }));
  }

  /**
   * Calculate summary fields for an order based on its items
   */
  public static prepareOrderSummary(order: any) {
    if (!order || !Array.isArray(order.items)) return order;
    let totalMrp = 0;
    let totalPrice = 0;
    let itemSavings = 0;
    let finalAmt = 0;
    order.items.forEach((item: any) => {
      if (item.status !== "Cancelled" && item.status !== "Returned") {
        totalMrp += (item.mrp || 0) * (item.quantity || 1);
        totalPrice += (item.price || 0) * (item.quantity || 1);
        itemSavings +=
          ((item.mrp || 0) - (item.finalPrice || 0)) * (item.quantity || 1);
        finalAmt += item.finalPrice || 0;
      }
    });
    order._totalMrp = totalMrp;
    order._totalPrice = totalPrice;
    order._itemSavings = itemSavings;
    order._finalAmt = finalAmt + (order._shippingCharges || 0);

    return order;
  }

  static async generateInvoiceForOrder(params: {
    orderId: string;
    packageIds: string[];
  }) {
    return AjaxService.request(
      `${this.BASE_URL}sales/invoice/generate`,
      "POST",
      params
    );
  }

  public static getOrderStatuses(): Array<{
    name: string;
    value: string;
    statusColor: string;
    statuses: Array<string>;
  }> {
    const statuses = [
      {
        name: "Created",
        value: "Created",
        statusColor: "info",
        statuses: ["Created"],
      },
      {
        name: "Approved",
        value: "Approved",
        statusColor: "primary",
        statuses: ["Approved"],
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

  public static getStatusColor(status: string): string {
    // Find the status in our predefined statuses
    const statusObj: any = this.getOrderStatuses().find((s) =>
      s.statuses.includes(status)
    );

    // Return the color if found, default to secondary
    return statusObj?.statusColor ?? "secondary";
  }

  static async openBox(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/open`,
      "POST",
      params
    );
  }

  static async saveBox(boxId: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/${boxId}/save`,
      "POST",
      params
    );
  }

  static async closeBox(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/close`,
      "POST",
      params
    );
  }

  static async removeBoxItem(boxId: string, itemId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/${boxId}/deal/${itemId}/remove`,
      "POST"
    );
  }

  static async cancelBoxAfterPack(boxId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/${boxId}/cancel`,
      "POST"
    );
  }

  public static async cancelOrder(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/order/${id}/cancel`,
      "PUT",
      params
    );
  }

  static async getProducts(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}catalog/seller-deals`,
      "GET",
      params
    );
  }

  public static async getDealSalesSummary(
    dealId: string,
    params: Record<string, any> = {}
  ) {
    const url = `${this.BASE_URL}sales/dealsummary/${dealId}`;
    return AjaxService.request(url, "GET", params);
  }

  public static async getDealPurchaseSummary(
    dealId: string,
    params: Record<string, any> = {}
  ) {
    const url = `${this.BASE_URL}purchase/dealsummary/${dealId}`;
    return AjaxService.request(url, "GET", params);
  }

  public static async updateOrderStatus(
    orderId: string,
    params: Record<string, any>
  ) {
    return AjaxService.request(
      `${this.BASE_URL}sales/order/${orderId}/status`,
      "PUT",
      params
    );
  }

  public static async getOrderBoxes(
    orderId: string,
    params: Record<string, any> = {}
  ) {
    const response = await AjaxService.request(
      `${this.BASE_URL}sales/package/order/${orderId}`,
      "GET",
      params
    );

    try {
      const boxes = response?.data?.data;
      if (Array.isArray(boxes)) {
        response.data.data = boxes.map((box: any) => ({
          ...box,
          items: Array.isArray(box.items)
            ? box.items.map((item: any) => {
                const snapshots = Array.isArray(item.snapshots)
                  ? item.snapshots
                  : [];
                const mrpToQty: Record<string, number> = {};

                snapshots.forEach((snap: any) => {
                  const mrp = Number(snap?.mrp);
                  const qty = Number(snap?.quantity ?? 0) || 0;
                  if (!Number.isFinite(mrp) || qty <= 0) return;
                  const key = String(mrp);
                  mrpToQty[key] = (mrpToQty[key] || 0) + qty;
                });

                const mrpSnapshots = Object.keys(mrpToQty).map((key) => ({
                  mrp: Number(key),
                  quantity: mrpToQty[key],
                }));

                return {
                  ...item,
                  mrpSnapshots,
                };
              })
            : [],
        }));
      }
    } catch (e) {
      console.warn("Failed to format getOrderBoxes response:", e);
    }

    return response;
  }

  static async cancelPackage(packageId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/${packageId}/delete`,
      "DELETE"
    );
  }

  static async getPackage(packageId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/package/${packageId}`,
      "GET"
    );
  }

  static async getSettlements(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/shipment/settlements`,
      "GET",
      params
    );
  }

  public static formatSettlementsResponse(settlements: any[]): any[] {
    if (!Array.isArray(settlements)) return [];
    return settlements.map((item) => {
      let settledOn = null;
      if (Array.isArray(item.auditLog)) {
        // Find the auditLog entry with status 'Settled' (or customize as needed)
        const settledEntry = item.auditLog.find(
          (log: any) => log.status === "Settled"
        );
        if (settledEntry && settledEntry.createdAt) {
          settledOn = settledEntry.createdAt;
        }
      }
      return {
        ...item,
        settledOn,
      };
    });
  }

  static async bulkUpdateSettlements(params: {
    settlementList: Array<{ id: string; remarks: string }>;
  }) {
    return AjaxService.request(
      `${this.BASE_URL}/sales/shipment/settlements/bulkUpdate`,
      "POST",
      params
    );
  }

  static async getBinPickingList(
    franchiseId: string,
    dealId: string,
    binId: string,
    params: Record<string, any> = {}
  ) {
    // Use the general getPickingList with bin-wise parameters
    return this.getPickingList(franchiseId, dealId, {
      ...params,
      listBy: "binWise",
      binId: binId,
    });
  }

  /**
   * Fetch picking list for a deal. Supports optional bin-wise listing via params:
   * { listBy: 'binWise', binId: 'L1-R2-B8', filter: JSON.stringify({...}) }
   */
  static async getPickingList(
    franchiseId: string,
    dealId: string,
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/seller/${franchiseId}/deal/${dealId}/list`,
      "GET",
      params
    );
  }

  static async getSharedCart(cartId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/${cartId}/shared`,
      "GET"
    );
  }
}

export default SellerService;
