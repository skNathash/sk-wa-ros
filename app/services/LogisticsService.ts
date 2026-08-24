import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import { merge, orderBy, uniq } from "lodash";
import { add } from "date-fns";
import AuthService from "./AuthService";
import type { LogisticsProductType } from "~/types/LogisticsProductType";
import type { AssignDeliveryPayload } from "~/types/LogisticsTypes";
class LogisticsService {
  static formatShipmentResponse(data: any[]) {
    return data.map((item: any) => ({
      ...item,
      arrivingOn: add(item.shippedOn, { days: 7 }),
      orderTypeColor:
        item.orderType === "My Order"
          ? "success"
          : item.orderType === "Request Order"
          ? "warning"
          : "secondary",
    }));
  }

  static async getYetToReceiveShipments(params: Record<string, any>) {
    const p = merge(
      {},
      {
        groupBy: "package",
        sort: {
          ReceivedOn: -1,
        },
      },
      params
    );
    const response = await AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/fetchshipped`,
      "GET",
      p
    );

    if (Array.isArray(response.data) && response.data.length > 0) {
      response.data = this.formatShipmentResponse(response.data);
    }

    return response;
  }

  static async getYetToReceiveShipmentsCount(params: Record<string, any>) {
    return this.getYetToReceiveShipments({
      ...params,
      displayType: "count",
    });
  }

  static async getReceivedShipments(params: Record<string, any>) {
    const p = merge(
      {},
      {
        groupBy: "package",
        sort: {
          ReceivedOn: -1,
        },
      },
      params
    );
    const response = await AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/fetchdelivered`,
      "GET",
      p
    );

    if (Array.isArray(response.data) && response.data.length > 0) {
      response.data = this.formatShipmentResponse(response.data);
    }

    return response;
  }

  static async getPackageDetails(id: string) {
    const response = await AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/package/${id}/details`,
      "GET"
    );

    if (response?.data?.packages?.length > 0) {
      response.data.packages = response.data.packages.map((item: any) => {
        const uniqBarcodes = uniq(
          item.barcodes.flatMap((barcode: any) => barcode.barcode)
        );
        return {
          ...item,
          uniqBarcodes,
          barcodeStr: uniqBarcodes.join(", "),
          _mrp: item.packages?.mrp || item.packageMrp,
          _qty: item.packages?.quantity || item.packageQuantity,
          _price: item.packages?.price || item.b2bprice || item.dealB2bPrice,
        };
      });
    }

    return response;
  }

  static async getReceivedShipmentsCount(params: Record<string, any>) {
    return this.getReceivedShipments({
      ...params,
      displayType: "count",
    });
  }

  static async getShipments(params: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}logistics/${API_VERSION}`,
      "GET",
      params
    );
    return response;
  }

  static async getShipmentsCount(params: Record<string, any>) {
    return AjaxService.request(
      `${API}logistics/${API_VERSION}/count`,
      "GET",
      params
    );
  }

  static getClaimReasons() {
    return orderBy(
      [
        {
          name: "Damage",
          subValues: [
            {
              name: "Box Condition Good - Product Damaged",
            },
            {
              name: "Box Damaged - Product Damaged",
            },
          ],
        },
        {
          name: "Shortage",
          subValues: [
            {
              name: "Box Condition Good - Product Shortage",
            },
            {
              name: "Box Damaged - Product Shortage",
            },
          ],
        },
        {
          name: "MRP Difference",
          subValues: [],
        },
        {
          name: "Product Mismatch / Wrong Product",
        },
        {
          name: "Free product Not received",
        },
        {
          name: "Wrong Order Received",
        },
        {
          name: "DOA",
        },
        {
          name: "Accessories Issue",
        },
        {
          name: "Device Not working",
        },
        {
          name: "Expired Products",
        },
      ],
      ["name"],
      ["asc"]
    );
  }

  static async getLocationDetailsOfDeals(
    dealIds: Array<string>,
    params: any = {}
  ) {
    let p = merge(
      {},
      {
        queryType: "fetchDataByDeal",
        page: 1,
        count: 1000,
        filter: {
          dealId: { $in: dealIds },
          "sellerInfo._id": AuthService.getLoggedInSellerId(),
        },
      },
      params
    );
    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/stock/getStockMasterData`,
      "GET",
      p
    );
  }

  static async doReceivePackageProcess(data: {
    fran: { name: string; OwnerMobileNo: string };
    boxWeight: number;
    boxId: string;
    doAutoProcess: boolean;
    remarks: string;
  }) {
    let payload: any = {
      goodCondition: true,
      name: data.fran?.name || "",
      contact: data.fran?.OwnerMobileNo
        ? data.fran.OwnerMobileNo.toString()
        : "",
      remarks: data.remarks || "",
      weight: data.boxWeight,
      boxId: data.boxId,
      franchiseId: AuthService.getLoggedInUserId(),
      scan: "in",
    };

    if (data.doAutoProcess) {
      payload.isAutoProcess = true;
    }

    return this.arrivedAtRf(data.boxId, payload);
  }

  static async arrivedAtRf(id: string, params: any) {
    return AjaxService.request(
      `${API}logistics/${API_VERSION}/${id}/arrivedAtRf`,
      "PUT",
      params
    );
  }

  static getStockUpdatePayload(
    data: {
      invoiceNo: string;
      orderId: string;
      packageNo: string;
    },
    products: LogisticsProductType[]
  ) {
    let payload: any = {
      invoiceNo: data.invoiceNo,
      orderId: data.orderId,
      sellerId: AuthService.getLoggedInSellerId(),
      franchiseId: AuthService.getLoggedInUserId(),
      packageNo: data.packageNo,
      deals: [],
    };

    let d: any = [];

    let deals: any = {};

    (products || []).forEach((x: LogisticsProductType, i: number) => {
      const cl = x.claim || { qty: 0, reason: "", attachments: [] };

      let key = x.dealId + "|" + i + "|" + data.packageNo;
      deals[key] = { ...x };

      deals[key].location = {
        rackId: x.selectedRack?.code,
        binId: x.selectedBin?.code,
        area: "",
        name: x.selectedLoc?.label,
        id: x.selectedLoc?.value,
        rackName: x.selectedRack?.name,
        binName: x.selectedBin?.name,
        isSellable: x.selectedBin?.isSellable,
      };

      deals[key].damage = cl.reason === "Damage" ? cl.qty : 0;
      deals[key].shortage = cl.reason === "Shortage" ? cl.qty : 0;
      deals[key].claimQuantity = cl.qty || 0;
      deals[key].damageImages = cl.reason === "Damage" ? cl.attachments : [];
    });

    Object.keys(deals).forEach((key) => {
      const x = deals[key];
      const q = x.packageQuantity - (x.claimQuantity || 0);
      if (q > 0) {
        d.push({
          name: x.dealName,
          dealImages: Array.isArray(x.images) ? x.images : [],
          damagedQuantity: x.damage,
          images: x.damageImages || [],
          shortageQuantity: x.shortage,
          id: x.dealId,
          quantity: q,
          remarks: x.claim?.remarks || "",
          mrp: x._mrp,
          barcode: x.uniqBarcodes?.[0] || "",
          location: x.location || {},
          whId: x.whId,
        });
      }
    });

    payload.deals = d;

    return payload;
  }

  static async updateSfDealStockInvoice(params: any) {
    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/stockUpdateDealWise`,
      "PUT",
      params
    );
  }

  static async claimOrder(params: any) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/orderClaim`,
      "POST",
      params
    );
  }

  static async getMultiplePackageDetails(ids: string[]) {
    return AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/allpackage/details`,
      "GET",
      {
        ids: ids.join(","),
      }
    );
  }

  static async bulkReceivePackage(params: any) {
    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/receiverequestordershippment`,
      "POST",
      params
    );
  }

  static async getInvoices(params: any) {
    const r = await AjaxService.request(
      `${API}oms/${API_VERSION}/invoice`,
      "GET",
      params
    );

    if (Array.isArray(r.data)) {
      r.data = r.data.map((item) => {
        item.deals.forEach((deal: any) => {
          let packages: string[] = [];
          deal.products.forEach((product: any) => {
            product.packages.forEach((pkg: any) => {
              if (packages.indexOf(pkg.packageNo) === -1) {
                packages.push(pkg.packageNo);
              }
            });
          });
          deal.packages = packages;
        });
        return { ...item };
      });
    }

    return r;
  }

  static async getCouriers(params: any) {
    return AjaxService.request(`${API}courier/${API_VERSION}`, "GET", params);
  }

  static async getCouriersCount(params: any) {
    return AjaxService.request(
      `${API}courier/${API_VERSION}/count`,
      "GET",
      params
    );
  }

  static async printBulkInvoice(ids: string[]) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/invoice/printBulkInvoices`,
      "GET",
      {
        filter: {
          $or: [
            { "deals.products.packages.packageNo": { $in: ids } },
            { _id: { $in: ids } },
          ],
        },
      }
    );
  }

  static getSellerPickPackShipments(params: any) {
    return AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/getPackedPackages`,
      "GET",
      params
    );
  }

  static getSellerShippedPackages(params: any) {
    return AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/buyer/packages/shipped`,
      "GET",
      params
    );
  }

  static getSellerDeliveredPackages(params: any) {
    return AjaxService.request(
      `${API}logistics/${API_VERSION}/sf/buyer/packages/delivered`,
      "GET",
      params
    );
  }

  /**
   * Create a new dispute
   * @param payload Dispute creation payload
   * @returns Promise with dispute creation response
   */
  static async createDispute(payload: any) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/dispute`,
      "POST",
      payload
    );
  }

  /**
   * Approve a dispute
   * @param id Dispute ID
   * @param status Dispute status
   * @returns Promise with dispute approval response
   */
  static async approveDispute(id: string, status: string) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/dispute/${id}/status`,
      "PUT",
      { status }
    );
  }

  /**
   * Reject a dispute with remarks
   * @param id Dispute ID
   * @param status Dispute status
   * @param rejectionRemarks Rejection reason/remarks
   * @returns Promise with dispute rejection response
   */
  static async rejectDispute(
    id: string,
    status: string,
    rejectionRemarks: string
  ) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/dispute/${id}/status`,
      "PUT",
      { status, rejectionRemarks }
    );
  }

  /**
   * Get dispute transactions
   * @returns Promise with dispute transactions
   */
  static async getDisputeTransaction() {
    return AjaxService.request(`${API}oms/${API_VERSION}/transaction`, "GET");
  }

  /**
   * Get dispute status color based on status
   * @param status - The dispute status
   * @returns The color variant for the status
   */
  static getDisputeStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      Open: "warning",
      Created: "warning",
      "In Progress": "info",
      "Under Review": "info",
      Resolved: "success",
      Approved: "success",
      Rejected: "danger",
      Declined: "danger",
      Closed: "secondary",
      Completed: "secondary",
    };
    return statusColors[status] || "secondary";
  }

  /**
   * Get dispute list
   * @returns Promise with dispute list
   */
  static async getDisputeList(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}oms/${API_VERSION}/dispute`,
      "GET",
      params
    );

    // Attach statusColor to each dispute in the response
    if (response.statusCode === 200 && response.data) {
      response.data = response.data.map((dispute: any) => ({
        ...dispute,
        statusColor: this.getDisputeStatusColor(dispute.status),
      }));
    }

    return response;
  }

  static async assignDelivery(payload: AssignDeliveryPayload) {
    return AjaxService.request(`${API}sales/shipment/assign`, "POST", payload);
  }

  static async verifyDeliveryCode(params: {
    shipmentId: string;
    approveAuthCode: string;
    remarks: string;
  }) {
    return AjaxService.request(`${API}sales/shipment/approve`, "POST", params);
  }

  /**
   * Fetch shipments for the dispatch desk.
   * Endpoint: GET sales/shipment/fetch
   */
  static async fetchShipments(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}sales/shipment/fetch`, "GET", params);
  }

  static async getBoxes(id: string, params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}sales/package/buyer/${id}/list`,
      "GET",
      params
    );
  }

  static async receiveBox(packageId: string, params: any) {
    return AjaxService.request(
      `${API}sales/package/${packageId}/retailer/recieve`,
      "POST",
      params
    );
  }
}

export default LogisticsService;
