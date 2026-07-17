// Icons moved to simple string keys to remove dependency on ionicons
import { merge } from "lodash";
import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import FranchiseService from "./FranchiseService";
import VendorService from "./VendorService";
import CommonService from "./CommonService";

class PurchaseOrderService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  public static async getList(params: Record<string, any> = {}) {
    const defaultParams = {
      filter: {
        // "franchiseInfo.id": AuthService.getLoggedInUserId(),
      },
    };

    const finalParams = merge({}, defaultParams, params);

    return AjaxService.request(
      `${this.BASE_URL}purchase/orders`,
      "GET",
      finalParams,
    );
  }

  /**
   * Fetch recently received purchase deals
   */
  public static async getRecentlyReceived(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/shipmentpackagesummary/received/list`,
      "GET",
      params,
    );
  }

  /**
   * Sync shipment package summary for a given order (SK packageType)
   * Endpoint: purchase/shipmentpackagesummary/sync
   */
  public static async syncShipmentPackageSummary(orderId: string) {
    const payload = {
      orderId: orderId,
      packageType: "SK",
    };

    return AjaxService.request(
      `${this.BASE_URL}purchase/shipmentpackagesummary/sync`,
      "POST",
      payload,
    );
  }

  public static formatRecentlyReceived(data: any) {
    return data.map((item: any) => {
      const vendor = item.from || {};
      const isSeller = vendor.subType === "SELLER" && vendor.type === "SELLER";

      // Process vendor type
      const {
        type: vendorType,
        color: vendorTypeColor,
        description: vendorTypeInfo,
      } = VendorService.getVendorType({
        name: vendor?.name || "",
        vendorType: vendor?.isOwnVendor ? "OWN" : "",
      });

      return {
        ...item,
        isSeller: isSeller,
        isVendor: vendor.type === "VENDOR",
        isSellerOrder: isSeller,
        _vendorType: vendorType,
        _vendorTypeColor: vendorTypeColor,
        _vendorTypeInfo: vendorTypeInfo,
      };
    });
  }

  /**
   * Fetch recently received vendors
   */
  public static async getRecentlyReceivedVendors(
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/vendors/recent`,
      "GET",
      params,
    );
  }

  public static async getCount(params: Record<string, any> = {}) {
    const defaultParams = {
      outputType: "count",
      filter: {
        // "franchiseInfo.id": AuthService.getLoggedInUserId(),
      },
    };

    const finalParams = merge({}, defaultParams, params);

    return this.getList(finalParams);
  }

  public static async getDetails(id: string, params: Record<string, any> = {}) {
    const finalParams = merge({}, params, {
      filter: {
        _id: id,
        "franchiseInfo.id": AuthService.getLoggedInUserId(),
      },
    });

    return AjaxService.request(
      `${this.BASE_URL}purchase/orders/${id}`,
      "GET",
      finalParams,
    );
  }

  public static async create(data: Record<string, any>) {
    const payload = {
      ...data,
      franchiseId: AuthService.getLoggedInUserId(),
    };

    return AjaxService.request(
      `${this.BASE_URL}purchase/orders`,
      "POST",
      payload,
    );
  }

  public static async update(id: string, data: Record<string, any>) {
    const payload = {
      ...data,
      franchiseId: AuthService.getLoggedInUserId(),
    };

    return AjaxService.request(
      `${this.BASE_URL}purchase/orders/${id}`,
      "PUT",
      payload,
    );
  }

  /**
   * Submit SK Order receive payload for a purchase order
   * Endpoint: purchase/orders/receipt/skorder/[ORDERID]
   */
  public static async submitSkOrderReceipt(
    orderId: string,
    data: Record<string, any>,
  ) {
    const payload = {
      ...data,
      franchiseId: AuthService.getLoggedInUserId(),
    };

    return AjaxService.request(
      `${this.BASE_URL}purchase/orders/receipt/skorder/${orderId}`,
      "PUT",
      payload,
    );
  }

  static async confirmReceipt(id: string, data: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/orders/${id}/confirm-receipt`,
      "POST",
      data,
    );
  }

  public static async getIntakeSummary(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pospo/intakeSummary`,
      "GET",
      params,
    );
  }

  public static async getPoInvSummary(params: Record<string, any> = {}) {
    const response = await this.getIntakeSummary(params);

    // Process the response to match retailer-app format
    if (response.statusCode === 200 && Array.isArray(response.data)) {
      const processedData = response.data.map((item: any) => {
        // Process product list to add calculated fields
        const processedProducts = (item.productList || []).map(
          (product: any) => {
            const receivedQty = product.receivedQuantity || 0;
            let totalValue = receivedQty * product.purchasePrice;
            let displayUnitType = "units";

            // // Calculate total value based on unit type
            // if (product.sellInLooseQty && product.packSize && product.UoM) {
            //   // For loose quantity items, calculate based on UoM
            //   if (product.unitType === "loose") {
            //     totalValue = (receivedQty / product.packSize) * product.price;
            //     displayUnitType = product.unitType;
            //   } else {
            //     totalValue = receivedQty * product.price;
            //     displayUnitType = "units";
            //   }
            // } else {
            //   totalValue = receivedQty * product.price;
            //   displayUnitType = "units";
            // }

            // Calculate shelf life remaining days
            let shelfLifeLeftDays = 0;
            if (product.shelfLife) {
              const shelfLifeDate = new Date(product.shelfLife);
              shelfLifeDate.setHours(23, 59, 59, 999);
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);
              const diffTime = shelfLifeDate.getTime() - currentDate.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              shelfLifeLeftDays = diffDays < 0 ? 0 : diffDays;
            }

            return {
              ...product,
              _totalValue: totalValue,
              _displayUnitType: displayUnitType,
              _shelfLifeLeftDays: shelfLifeLeftDays,
              invCreatedAt: item.createdAt,
            };
          },
        );

        return {
          ...item,
          productList: processedProducts,
        };
      });

      return {
        ...response,
        data: processedData,
      };
    }

    return response;
  }

  public static poSyncWithInvData(invData: any[], invoiceData: any[]): any[] {
    let allProducts: any[] = [];

    // Flatten all products from intake summary data
    (invData || []).forEach((item: any) => {
      const products = (item.productList || []).map((product: any) => ({
        ...product,
        invCreatedAt: item.createdAt,
      }));
      allProducts = allProducts.concat(products);
    });

    // Map invoice details with corresponding products
    return [...(invoiceData || [])].map((invoice: any) => {
      const matchingProducts = allProducts.filter(
        (product: any) => product.invoiceNo === invoice.refno,
      );

      return {
        ...invoice,
        _products: matchingProducts,
        _invCreatedAt:
          matchingProducts.length > 0 ? matchingProducts[0].invCreatedAt : "",
      };
    });
  }

  static getSourceTypes() {
    return [
      {
        name: "Cart Import",
        value: "seller_import_cart_processing",
        color: "primary",
      },
      { name: "Added Stock", value: "add_stock_inventory", color: "success" },
      { name: "Single Sync", value: "single_product_sync", color: "info" },
      {
        name: "Bulk Import",
        value: "seller_import_products",
        color: "warning",
      },
      { name: "SK Order", value: "sk_order", color: "warning" },
    ];
  }

  static getSourceType(sourceTypeValue: string) {
    const sourceTypes = this.getSourceTypes();
    return sourceTypes.find((type) => type.value === sourceTypeValue) || null;
  }

  public static calculateSummaryData(
    purchaseOrder: any,
    _intakeSummaryData: any[] = [],
  ) {
    const summary = {
      price: 0,
      receivedStock: 0,
      stock: 0,
      value: 0,
      pendingPayment: 0,
      invoiceValue: 0,
      looseStock: 0,
      receivedLooseStock: 0,
    };

    // Calculate from items list (new structure)
    const items = purchaseOrder.items || [];

    items.forEach((item: any) => {
      const requestedQty = item.quantity || 0;
      const receivedQty = item.receivedQuantity || 0;
      const price = item.purchasePrice || 0;

      summary.stock += requestedQty;
      summary.receivedStock += receivedQty;
      summary.price += requestedQty * price;
      summary.value += receivedQty * price;

      // Handle loose stock calculations
      if (item.sellInLooseQty) {
        summary.looseStock += requestedQty;
        summary.receivedLooseStock += receivedQty;
      }
    });

    // Calculate invoice value from payment summary
    const paymentSummary = purchaseOrder.paymentSummary || [];
    summary.invoiceValue = paymentSummary.reduce(
      (total: number, payment: any) => total + (payment.amount || 0),
      0,
    );

    // Calculate total paid amount from payment summary
    const totalPaid = paymentSummary.reduce(
      (total: number, payment: any) => total + (payment.paidAmount || 0),
      0,
    );

    summary.pendingPayment = summary.invoiceValue - totalPaid;

    return summary;
  }

  /**
   * Open the server-generated purchase order print page in a new window.
   * Replaces the previous client-side HTML print template.
   */
  public static printOrder(orderId: string) {
    if (!orderId) return;
    const url = `${this.BASE_URL}purchase/orders/${orderId}/print`;
    CommonService.openInNewWindow(url);
  }

  /**
   * DEPRECATED: client-side PO print template. Replaced by printOrder()
   * which opens the server-generated print page. Kept for reference.
   */
  /*
  public static printTemplate(purchaseOrder: any) {
    // Prepare items list for printing (new structure)
    let items = purchaseOrder.items || [];

    // Filter out rejected items
    const includeIds = items
      .filter((x: any) => x.status !== "Rejected")
      .map((x: any) => x.dealId);

    // Filter items based on included IDs
    items = items.filter((item: any) => includeIds.includes(item.dealId));

    const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Order - ${
        purchaseOrder.orderId || purchaseOrder._id
      }</title>
      <style>
        @page { margin: 1in; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.4; 
          color: #000; 
          margin: 0; 
          padding: 0;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        .header h1 { 
          font-size: 18px; 
          margin: 0 0 5px 0; 
          font-weight: bold;
        }
        .header h2 { 
          font-size: 16px; 
          margin: 0 0 5px 0; 
          font-weight: bold;
        }
        .header p { 
          font-size: 11px; 
          margin: 0;
        }
        .section { 
          margin-bottom: 15px; 
        }
        .section h3 { 
          font-size: 14px; 
          margin: 0 0 8px 0;
          font-weight: bold;
          border-bottom: 1px solid #000;
          padding-bottom: 3px;
        }
        .info-row {
          display: flex;
          margin-bottom: 5px;
        }
        .info-label {
          font-weight: bold;
          width: 120px;
          min-width: 120px;
        }
        .info-value {
          flex: 1;
        }
        .products-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px;
          font-size: 11px;
        }
        .products-table th { 
          background: #f0f0f0; 
          border: 1px solid #000; 
          padding: 5px; 
          text-align: left; 
          font-weight: bold;
        }
        .products-table td { 
          border: 1px solid #000; 
          padding: 5px; 
          vertical-align: top;
        }
        .summary { 
          margin-top: 15px; 
          border: 1px solid #000;
          padding: 10px;
        }
        .summary h3 { 
          font-size: 14px; 
          margin: 0 0 8px 0;
          font-weight: bold;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .summary-label {
          font-weight: bold;
        }
        .footer { 
          margin-top: 20px; 
          text-align: center; 
          font-size: 10px;
          border-top: 1px solid #000;
          padding-top: 10px;
        }
        @media print {
          body { font-size: 11px; }
          .section { page-break-inside: avoid; }
          .products-table { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PURCHASE ORDER</h1>
        <h2>PO #${purchaseOrder.orderId || purchaseOrder._id}</h2>
        <p>Date: ${new Date(purchaseOrder.createdAt).toLocaleDateString()}</p>
      </div>

      <div class="section">
        <h3>ORDER DETAILS</h3>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value">${purchaseOrder.status}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Status:</span>
          <span class="info-value">${
            purchaseOrder.paymentStatus || "N/A"
          }</span>
        </div>
        <div class="info-row">
          <span class="info-label">Expected Delivery:</span>
          <span class="info-value">${
            purchaseOrder.expectedDeliveryDate
              ? new Date(
                  purchaseOrder.expectedDeliveryDate,
                ).toLocaleDateString()
              : "N/A"
          }</span>
        </div>
        ${
          purchaseOrder.remarks
            ? `<div class="info-row">
                <span class="info-label">Remarks:</span>
                <span class="info-value">${purchaseOrder.remarks}</span>
               </div>`
            : ""
        }
      </div>

      <div class="section">
        <h3>VENDOR INFORMATION</h3>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${
            purchaseOrder.vendorInfo?.name ||
            purchaseOrder.purchaseFrom?.name ||
            "N/A"
          }</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vendor ID:</span>
          <span class="info-value">${
            purchaseOrder.vendorInfo?.vendorId || "N/A"
          }</span>
        </div>
        ${
          purchaseOrder.vendorInfo?.mobile
            ? `<div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${purchaseOrder.vendorInfo.mobile}</span>
               </div>`
            : ""
        }
        ${
          purchaseOrder.vendorInfo?.email
            ? `<div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${purchaseOrder.vendorInfo.email}</span>
               </div>`
            : ""
        }
        ${
          purchaseOrder.vendorInfo?.panNumber
            ? `<div class="info-row">
                <span class="info-label">PAN:</span>
                <span class="info-value">${purchaseOrder.vendorInfo.panNumber}</span>
               </div>`
            : ""
        }
        ${
          purchaseOrder.vendorInfo?.address
            ? `<div class="info-row">
                <span class="info-label">Address:</span>
                <span class="info-value">${
                  purchaseOrder.vendorInfo.address.doorNo || ""
                } ${purchaseOrder.vendorInfo.address.street || ""}, ${
                  purchaseOrder.vendorInfo.address.city || ""
                }, ${purchaseOrder.vendorInfo.address.state || ""} - ${
                  purchaseOrder.vendorInfo.address.postcode || ""
                }</span>
               </div>`
            : ""
        }
      </div>

      <div class="section">
        <h3>FRANCHISE INFORMATION</h3>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${
            purchaseOrder.franchiseInfo?.name || "N/A"
          }</span>
        </div>
        <div class="info-row">
          <span class="info-label">Franchise ID:</span>
          <span class="info-value">${
            purchaseOrder.franchiseInfo?.franchiseId || "N/A"
          }</span>
        </div>
        ${
          purchaseOrder.franchiseInfo?.email
            ? `<div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${purchaseOrder.franchiseInfo.email}</span>
               </div>`
            : ""
        }
      </div>

      <div class="section">
        <h3>PRODUCTS</h3>
        <table class="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Deal Ref ID</th>
              <th>Qty</th>
              <th>Received</th>
              <th>Price</th>
              <th>MRP</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item: any) => `
              <tr>
                <td>${item.dealName || "N/A"}</td>
                <td>${item.dealRefId || "N/A"}</td>
                <td>${item.quantity || 0}</td>
                <td>${item.receivedQuantity || 0}</td>
                <td>₹${(item.purchasePrice || 0).toFixed(2)}</td>
                <td>₹${(item.mrp || 0).toFixed(2)}</td>
                <td>₹${(
                  (item.receivedQuantity || 0) * (item.purchasePrice || 0)
                ).toFixed(2)}</td>
                <td>${item.status || "Pending"}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="summary">
        <h3>SUMMARY</h3>
        <div class="summary-row">
          <span class="summary-label">Total Items:</span>
          <span>${items.length}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Total Requested Quantity:</span>
          <span>${items.reduce(
            (sum: number, item: any) => sum + (item.quantity || 0),
            0,
          )}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Total Received Quantity:</span>
          <span>${items.reduce(
            (sum: number, item: any) => sum + (item.receivedQuantity || 0),
            0,
          )}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Total Amount:</span>
          <span>₹${(purchaseOrder.totalAmount || 0).toFixed(2)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <p>StoreKing POS System</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
    `;

    const printWindow = window.open("", "SK-POS-Print");
    if (printWindow) {
      printWindow.document.write(template);
      printWindow.document.close();
      printWindow.focus();
    }
  }
  */

  static getStatusLabelAndColor(
    status: string,
    statusList: Array<any>,
  ): { label: string; color: string | undefined } {
    let label = status || "";
    let color = undefined;
    if (status && statusList && Array.isArray(statusList)) {
      for (const s of statusList) {
        if (s.status && Array.isArray(s.status) && s.status.includes(status)) {
          label = s.label;
          color = s.color;
          break;
        }
      }
    }
    return { label, color };
  }

  public static formatPurchaseOrderData(data: any): any {
    let totalValue = 0;
    let totalQuantity = 0;
    const statuses = this.getStatuses();
    const productStatuses = this.getProductStatuses();

    // Handle new items structure
    data.items?.forEach((item: any) => {
      totalValue += item.quantity * item.purchasePrice;
      totalQuantity += item.quantity;

      let qty = item.quantity;
      if (item.status === "Partially Received" || item.status === "Completed") {
        qty = item.receivedQuantity;
      }
      item._totalValue = qty * item.purchasePrice;

      // Use the common function for each item
      const { label, color } = this.getStatusLabelAndColor(
        item.status,
        productStatuses,
      );
      item._statusLabel = label;
      item._statusColor = color;
    });

    // Use the common function for the main status
    const { label: _statusLabel, color: _statusColor } =
      this.getStatusLabelAndColor(data.status, statuses);

    // Get source type information
    const _sourceType = this.getSourceType(data.source);

    const x = {
      ...data,
      _totalQuantity: totalQuantity,
      _totalValue: data.payableAmount,
      _statusLabel,
      _statusColor,
      _sourceType,
      _canReceive: this.canReceivePurchaseOrder(data),
      _canCancel: this.canCancelPurchaseOrder(data),
      _isFromSk: data.source === "sk_order",
      // Add computed fields for backward compatibility
      _id: data._id,
      id: data.orderId,
      vendorDetails: data.vendorInfo || data.purchaseFrom,
      franchise: data.franchiseInfo,
      productList: data.items,
      isCoinStoreOrder: data.isKcStoreOrder,
    };
    return x;
  }

  public static canEditPurchaseOrder(po: any): boolean {
    return po.status === "Draft" || po.status === "Approval Pending";
  }

  public static canReceivePurchaseOrder(po: any): boolean {
    return po.status === "Approved" || po.status === "Partially Received";
  }

  public static canCancelPurchaseOrder(po: any): boolean {
    // SK orders (source === 'sk_order') should not be cancellable from POS
    if (po && (po.source === "sk_order" || po._isFromSk)) {
      return false;
    }

    return (
      po.status === "Draft" ||
      po.status === "Approval Pending" ||
      po.status === "Approved"
    );
  }

  public static getBillingAddress() {
    return {
      name: "Localcube Commerce Pvt Ltd",
      address: {
        door_no: "Plot 14 - F1",
        street: "KIADB Layout, Kumbalgodu 2nd Stage",
        landmark: "Behind Deccan Herald",
      },
      state: "Karnataka",
      district: "Bangalore",
      town: "Kumbalgodu",
      pincode: "560074",
      finance_details: {
        gstNo: "29AACCL2418A1ZZ",
      },
    };
  }

  public static formatRackResp(racks: Array<any>): Array<any> {
    return (racks || []).map((x: any) => {
      return {
        name: x.name,
        aliasName: x.aliasName,
        code: x.code,
        bins: x.bins || [],
      };
    });
  }

  static getStatuses() {
    return [
      {
        label: "Not Received",
        value: "yetToReceive",
        status: ["Approved"],
        color: "danger",
        icon: "check",
        langKey: "notReceived",
      },
      {
        label: "Partially Received",
        value: "partiallyReceived",
        status: ["Partially Received"],
        color: "warning",
        icon: "check",
        langKey: "partiallyReceived",
      },
      {
        label: "Received",
        value: "received",
        status: ["Completed"],
        color: "success",
        icon: "check",
        langKey: "received",
      },
      {
        label: "Rejected",
        value: "rejected",
        status: ["Rejected", "Cancelled"],
        icon: "close",
        langKey: "rejected",
      },
    ];
  }

  static getProductStatuses() {
    return [
      {
        label: "Pending",
        value: "Pending",
        status: ["Pending"],
        color: "warning",
        icon: "pencil",
      },
      {
        label: "Yet to Receive",
        value: "Approved",
        status: ["Approved"],
        color: "success",
        icon: "check",
      },
      {
        label: "Partially Received",
        value: "Partially Received",
        status: ["Partially Received"],
        color: "info",
        icon: "check",
      },
      {
        label: "Received",
        value: "Received",
        status: ["Received", "Completed"],
        color: "success",
        icon: "check",
      },
      {
        label: "Rejected",
        value: "Rejected",
        status: ["Rejected"],
        color: "danger",
        icon: "close",
      },
    ];
  }

  public static async getThirdPartyPoCharges(dealIds: string[]) {
    const params = {
      dealIds,
    };
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pospo/purchase/charge/config`,
      "GET",
      params,
    );
  }

  public static async getSummaryCard(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pospo/summary/card`,
      "GET",
      params,
    );
  }

  static async cancelPo(id: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/orders/${id}/cancel`,
      "PUT",
      params,
    );
  }

  static async getPoCommissionLookup(params?: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/charge-configs/commissionlookup`,
      "POST",
      params,
    );
  }

  /**
   * Get charges/commission by deal array
   * Endpoint: purchase/orders/charges/by-deal
   * Payload: { deals: [{ dealId, quantity, mrp, purchasePrice }] }
   */
  public static async getChargesByDeal(payload: {
    deals: Array<{
      dealId: string;
      quantity: number;
      mrp?: number;
      purchasePrice?: number;
    }>;
  }) {
    return FranchiseService.getChargesByDeal(payload);
  }

  /**
   * Calculate commission value for a given deals array
   * @param deals Array of deal objects with {id, qty, price}
   * @returns Promise<{ commissionValue: number; commissionPercentage: number; fromPlan?: boolean }>
   */
  public static async calculateCommissionValue(
    deals: Array<{ id: string; qty: number; price: number }>,
  ): Promise<{
    commissionValue: number;
    commissionPercentage: number;
    fromPlan?: boolean;
  }> {
    if (!deals || deals.length === 0) {
      return { commissionValue: 0, commissionPercentage: 0 };
    }

    // Check if active plan is available
    const activePlan = await FranchiseService.getActivePlan();
    if (activePlan && activePlan.isPlanActive) {
      return { commissionValue: 0, commissionPercentage: 0, fromPlan: true };
    }

    try {
      // Extract deal IDs from the deals array
      const dealIds = deals.map((deal) => deal.id);

      // Fetch commission data for all deals
      const response = await this.getPoCommissionLookup({
        dealIds: dealIds,
      });

      if (response.statusCode === 200 && response.data && response.data.data) {
        const commissionData = response.data.data;

        // Calculate total commission by applying skCommission% on each deal's total
        const totalCommission = commissionData.reduce(
          (sum: number, item: any) => {
            const percentage = Number(item?.skCommission) || 0;

            // Find the corresponding deal to get qty and price
            const deal = deals.find((d) => d.id === item.dealId);
            if (!deal) return sum;

            const dealTotal = deal.qty * deal.price;
            const commissionValue = (percentage / 100) * dealTotal;
            return sum + commissionValue;
          },
          0,
        );

        // Calculate effective commission percentage across all deals
        const totalDealValue = deals.reduce(
          (sum, d) => sum + d.qty * d.price,
          0,
        );
        const commissionPercentage =
          totalDealValue > 0 ? (totalCommission / totalDealValue) * 100 : 0;

        return { commissionValue: totalCommission, commissionPercentage };
      } else {
        console.error("Failed to fetch commission data");
        return { commissionValue: 0, commissionPercentage: 0 };
      }
    } catch (error) {
      console.error("Error calculating commission value:", error);
      return { commissionValue: 0, commissionPercentage: 0 };
    }
  }

  static async getPoDashboardSummary(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/orders/${franchiseId}/summary`,
      "GET",
      params,
    );
  }

  static getPoDashboardSummaryDownloadUrl(fileName: string) {
    return `${this.BASE_URL}purchase/downloadstatement/${fileName}`;
  }

  static async getPoSellerDashboardSummary(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}sales/order/${franchiseId}/summary`,
      "GET",
      params,
    );
  }

  static formatPoDashboardSummary(data: Record<string, any>) {
    const from = data.from || data.vendorInfo || {};

    if (!data?.vendorInfo) {
      data.vendorInfo = {};
    }

    if (data?.vendorInfo?.vendorId) {
      data.vendorInfo.refId = data.vendorInfo.vendorId;
    }

    const fromSubType = from?.subType;
    const fromType = from?.type;

    const isSeller = fromSubType === "SELLER" && fromType === "SELLER";

    let orderIdToProcess = "";
    if (fromSubType === "SK") {
      orderIdToProcess = data.orderData?.refId2 || "";
    } else {
      orderIdToProcess = data.orderData?.refId || "";
    }

    // Process vendor type
    const {
      type: vendorType,
      color: vendorTypeColor,
      description: vendorTypeInfo,
    } = VendorService.getVendorType({
      name: from?.name || "",
      vendorType: from?.isOwnVendor ? "OWN" : "",
    });

    return {
      ...data,
      isSellerOrder: isSeller,
      isNonSkVendor: fromSubType !== "SK" && fromType === "VENDOR",
      receivedDate: data.receiptConfirmedAt,
      orderIdToProcess,
      orderLink: isSeller
        ? `/dashboard/orders/view/${data.orderData?.id}`
        : `/dashboard/purchase-order/view/${data.poId || data.orderData?.id}`,
      vendorLink: isSeller
        ? `/products/buy-from-other-retailer/retailer/${from?.id || data.vendorInfo?.franchiseId || ""}`
        : `/dashboard/vendor/view/${from?.id || data.vendorInfo?.id || ""}`,
      _sourceType: this.getSourceType(data.source),
      _vendorType: vendorType,
      _vendorTypeColor: vendorTypeColor,
      _vendorTypeInfo: vendorTypeInfo,
    };
  }

  static async getPoPackages(id: string, params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/shipmentpackagesummary/receiver/${id}`,
      "GET",
      params,
    );
  }

  static async receiveBulkPackages(payload: Array<{ shipmentId: string }>) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/shipmentpackagesummary/recieved`,
      "POST",
      payload,
    );
  }

  public static getPurchasedFromOptions() {
    return [
      { value: "All", label: "All Types", langKey: "allTypes" },
      { value: "Local Vendor", label: "Local Vendor" },
      { value: "StoreKing", label: "StoreKing" },
      { value: "Added Stock", label: "Added Stock" },
    ];
  }
}

export default PurchaseOrderService;
