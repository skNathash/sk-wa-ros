import { API } from "~/constants";
import CommonService from "./CommonService";
import AjaxService from "./AjaxService";

/**
 * Service for fetching various reports
 */
export class ReportService {
  private static readonly BASE_URL = API;

  /**
   * Helper method to construct query string from params
   */
  private static buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (params[key] !== null && params[key] !== undefined) {
        const value = params[key];
        searchParams.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : String(value),
        );
      }
    });
    return searchParams.toString();
  }

  /**
   * Inventory report based on catalog seller deals
   * Opens the report URL in a new tab using CommonService
   */
  public static getInventoryReport(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }inventory/report/franchise/${franchiseId}/report${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("Inventory report opened successfully");
    });
  }

  public static getStockLedgerReport(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }inventory/report/franchise/${franchiseId}/ledgerreport${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("Inventory report opened successfully");
    });
  }

  /**
   * Sales order report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getSalesReport(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${this.BASE_URL}sales/order/franchise/${franchiseId}/report${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("Sales report opened successfully");
    });
  }

  /**
   * Purchase order report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getPurchaseOrderReport(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${this.BASE_URL}purchase/report/franchise/${franchiseId}${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("Purchase order report opened successfully");
    });
  }

  /**
   * Commission deduction report for a franchise
   * API: purchase/report/franchise/{id}/commission-deduction
   */
  public static getCommissionDeductionReport(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }purchase/report/franchise/${franchiseId}/commission-deduction${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("Commission deduction report opened successfully");
    });
  }

  /**
   * KingCoins (loyalty points) report for a franchise
   * API: loyaltypoints/reports/franchise/{id}
   */
  public static getKingCoinsReport(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }loyaltypoints/reports/franchise/${franchiseId}${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("KingCoins report opened successfully");
    });
  }

  public static getGstReportPurchase(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }purchase/report/franchise/${franchiseId}/gstreport-sk${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST report purchase opened successfully");
    });
  }

  public static getGstReportSales(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }purchase/report/franchise/${franchiseId}/gstreport-other${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST report purchase opened successfully");
    });
  }

  /**
   * GST B2B Sales report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGstReportB2B(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }sales/report/franchise/${franchiseId}/gstReport/b2b${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST B2B Sales report opened successfully");
    });
  }

  /**
   * GST B2C Sales report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGstReportB2C(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }sales/report/franchise/${franchiseId}/gstReport/b2c${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST B2C Sales report opened successfully");
    });
  }

  /**
   * GSTR-1 B2B Sales report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGst1rB2B(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }sales/report/franchise/${franchiseId}/gst1r/b2b${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GSTR-1 B2B Sales report opened successfully");
    });
  }

  /**
   * GSTR-1 B2C Sales report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGst1rB2C(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${
      this.BASE_URL
    }sales/report/franchise/${franchiseId}/gst1r/b2c${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GSTR-1 B2C Sales report opened successfully");
    });
  }

  /**
   * HSN B2B Sales report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getHsnB2B(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${this.BASE_URL}sales/report/franchise/${franchiseId}/hsn/b2b${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("HSN B2B Sales report opened successfully");
    });
  }

  /**
   * HSN B2C Sales report for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getHsnB2C(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString(params);
    const url = `${this.BASE_URL}sales/report/franchise/${franchiseId}/hsn/b2c${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("HSN B2C Sales report opened successfully");
    });
  }

  /**
   * GST Dashboard - Product Level for a franchise
   * API: accounts/reports/gst-dashboard/franchise/{franchiseId}/product-level
   */
  public static async getGstDashboardProductLevel(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/product-level`;

    const response = await AjaxService.request(url, "GET", params);
    return response;
  }

  /**
   * Download GST Dashboard - Product Level for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGstDashboardProductLevelDownload(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString({
      ...params,
      outputType: "download",
      fileType: "xlsx",
    });
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/product-level${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST Dashboard Product Level report downloaded successfully");
    });
  }

  /**
   * GST Dashboard - HSN Summary for a franchise
   * API: accounts/reports/gst-dashboard/franchise/{franchiseId}/hsn-summary
   */
  public static async getGstDashboardHsnSummary(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/hsn-summary`;

    try {
      const response = await AjaxService.request(url, "GET", params);
      return response;
    } catch (error) {
      console.error("Error fetching GST dashboard HSN summary:", error);
      return { statusCode: 500, data: null } as any;
    }
  }

  /**
   * Download GST Dashboard - HSN Summary for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGstDashboardHsnSummaryDownload(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString({
      ...params,
      outputType: "download",
      fileType: "xlsx",
    });
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/hsn-summary${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST Dashboard HSN Summary report downloaded successfully");
    });
  }

  /**
   * GST Dashboard - Rate Summary for a franchise
   * API: accounts/report/gst-dashboard/franchise/{franchiseId}/rate-summary
   */
  public static async getGstDashboardRateSummary(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/rate-summary`;

    try {
      const response = await AjaxService.request(url, "GET", params);
      return response;
    } catch (error) {
      console.error("Error fetching GST dashboard rate summary:", error);
      return { statusCode: 500, data: null } as any;
    }
  }

  /**
   * Download GST Dashboard - Rate Summary for a franchise
   * Opens the report URL in a new tab using CommonService
   */
  public static getGstDashboardRateSummaryDownload(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString({
      ...params,
      outputType: "download",
      fileType: "xlsx",
    });
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/rate-summary${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("GST Dashboard Rate Summary report downloaded successfully");
    });
  }

  /**
   * GST Dashboard - Card Summary for a franchise
   * API: accounts/reports/gst-dashboard/franchise/{franchiseId}/card-summary
   */
  /**
   * Stock Masters report download for a franchise
   * API: inventory/report/franchise/{franchiseId}/stockmasters/{feature}?outputType=download&fileType=xlsx
   */
  public static getStockMastersReport(
    franchiseId: string,
    feature: string,
    params: Record<string, any> = {},
  ) {
    const queryString = this.buildQueryString({
      ...params,
      outputType: "download",
      fileType: "xlsx",
    });
    const url = `${this.BASE_URL}inventory/report/franchise/${franchiseId}/stockmasters/${feature}${
      queryString ? `?${queryString}` : ""
    }`;

    CommonService.windowOpenHandler(url, () => {
      console.log("Stock Masters report downloaded successfully");
    });
  }

  public static async getStockMastersCount(
    franchiseId: string,
    feature: string,
    params: Record<string, any> = {},
  ) {
    const url = `${this.BASE_URL}inventory/report/franchise/${franchiseId}/stockmasters/${feature}`;
    try {
      const response = await AjaxService.request(url, "GET", {
        ...params,
        outputType: "count",
      });
      if (response.statusCode === 200) {
        return response.data?.count || 0;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching stock masters count:", error);
      return 0;
    }
  }

  /**
   * GST Dashboard - Party wise (customer tax) lane data.
   * API: sales/dashboard/customertax?type=b2b|b2c&outputType=count|list
   */
  public static async getCustomerTax(params: Record<string, any> = {}) {
    const url = `${this.BASE_URL}sales/dashboard/customertax`;

    try {
      const response = await AjaxService.request(url, "GET", params);
      return response;
    } catch (error) {
      console.error("Error fetching customer tax data:", error);
      return { statusCode: 500, data: null } as any;
    }
  }

  public static async getGstDashboardCardSummary(
    franchiseId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${this.BASE_URL}accounts/reports/gst-dashboard/franchise/${franchiseId}/card-summary`;

    try {
      const response = await AjaxService.request(url, "GET", params);
      return response;
    } catch (error) {
      console.error("Error fetching GST dashboard card summary:", error);
      return { statusCode: 500, data: null } as any;
    }
  }
}

export default ReportService;
