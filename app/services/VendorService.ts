import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import { API, API_VERSION } from "~/constants";
import CommonService from "./CommonService";
import type { AxiosRequestConfig } from "axios";

/**
 * Service for Vendor related API calls
 */
class VendorService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  /**
   * Get vendors list
   * @param params - Query parameters for filtering
   * @returns Promise with vendors data
   */
  public static async getList(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}`,
      "GET",
      params,
    );
  }

  static getVendorTypes() {
    return [
      {
        name: "MAIN",
        color: "info",
        description: "StoreKing Main Vendor",
      },
      {
        name: "BASE",
        color: "primary",
        description: "Retailer as a Vendor",
      },
      {
        name: "NON-SK",
        color: "warning",
        description:
          "Vendor who is not nominated by StoreKing, but was onboarded by SK retailers for their own purchase.",
      },
    ];
  }

  static getVendorType(vendor: { name: string; vendorType: string }) {
    let type = "";
    let color = "";
    let description = "";

    if (vendor.name?.toLowerCase() === "storeking") {
      type = "MAIN";
      color = "info";
      description = "StoreKing Main Vendor";
    } else if (vendor.vendorType === "OWN") {
      type = "BASE";
      color = "primary";
      description = "Retailer as a Vendor";
    } else {
      type = "NON-SK";
      color = "warning";
      description =
        "Vendor who is not nominated by StoreKing, but was onboarded by SK retailers for their own purchase.";
    }
    return { type, color, description };
  }

  static async getVendors(params: Record<string, any> = {}) {
    const resp = await AjaxService.request(
      `${this.BASE_URL}/vendor/list`,
      "GET",
      params,
    );

    if (
      resp.statusCode === 200 &&
      resp.data?.data &&
      params.outputType !== "count"
    ) {
      resp.data.data = resp.data.data.map((vendor: any) => {
        const { type, color, description } = this.getVendorType(vendor);

        return {
          ...vendor,
          _fullAddress: this.formatAddress(vendor.address),
          _vendorType: type,
          _vendorTypeColor: color,
          _vendorTypeInfo: description,
        };
      });
    }
    return resp;
  }

  /**
   * Round a distance value (km) to 2 decimals; returns undefined for
   * null/empty/non-numeric input so views can fall back to "--".
   */
  private static parseDistance(value: any) {
    return value != null && value !== "" && Number.isFinite(Number(value))
      ? CommonService.roundedByDecimalPlace(Number(value), 2)
      : undefined;
  }

  public static async getDashboardVendorList(params: Record<string, any> = {}) {
    const resp = await this.getVendors(params);

    // Skip address formatting if outputType is count
    if (resp.data?.data && params.outputType !== "count") {
      resp.data.data.forEach((vendor: any, idx: number) => {
        vendor._fullAddress = this.formatAddress(vendor.address);
        // Only compute when distance is a valid number — rounding
        // undefined/null yields NaN which the views can't fall back from.
        vendor._distance = this.parseDistance(vendor.distance);
      });
    }

    return resp;
  }

  /**
   * Get vendors list with aggregated stats in a single call.
   * API: vendor/analytics/vendors-with-stats
   * @param params - Query parameters for filtering
   * @returns Promise with vendors data (formatted address/type/distance)
   */
  public static async getVendorsWithStats(params: Record<string, any> = {}) {
    const resp = await AjaxService.request(
      `${this.BASE_URL}/vendor/analytics/vendors-with-stats`,
      "GET",
      params,
    );

    // Skip formatting for count-only responses (no vendor rows returned).
    if (resp.data?.data && params.outputType !== "count") {
      resp.data.data = resp.data.data.map((vendor: any) => {
        const { type, color, description } = this.getVendorType(vendor);

        return {
          ...vendor,
          _fullAddress: this.formatAddress(vendor.address),
          _vendorType: type,
          _vendorTypeColor: color,
          _vendorTypeInfo: description,
          _distance: this.parseDistance(vendor.distanceKm ?? vendor.distance),
        };
      });
    }

    return resp;
  }

  public static async getDashboardVendorOverall(id: string) {
    const queryParams = { queryType: "Overall" };
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/vendor/${id}`,
      "GET",
      queryParams,
    );
  }

  /**
   * Money summary (alerts, payment pending, invoices) for a vendor
   * API: purchase/report/money/vendor/{id}
   * @param id - Vendor ID
   * @returns Promise with money summary data
   */
  public static async getMoneySummary(
    id: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/report/money/vendor/${id}`,
      "GET",
      params,
    );
  }

  /**
   * Download URL for a money summary PDF generated via
   * getMoneySummary(id, { outputType: "download" })
   */
  public static moneyReportDownloadUrl(fileName: string) {
    return `${this.BASE_URL}purchase/report/money/download/${fileName}`;
  }

  /**
   * Get vendor details by ID
   * @param id - Vendor ID
   * @param params - Additional query parameters
   * @returns Promise with vendor details
   */
  public static async getDetail(id: string, params: Record<string, any> = {}) {
    const resp = await AjaxService.request(
      `${this.BASE_URL}/vendor/${id}`,
      "GET",
      params,
    );

    if (resp.data?.data) {
      resp.data.data = this.formatVendorData(resp.data?.data);
    }

    return resp;
  }

  /**
   * Get vendors count
   * @param params - Query parameters for filtering
   * @returns Promise with count data
   */
  public static async getCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/count`,
      "GET",
      params,
    );
  }

  /**
   * Get POS purchase order vendors by location
   * @param params - Query parameters for filtering
   * @returns Promise with vendors data
   */
  public static async getPosPoVendors(params: Record<string, any> = {}) {
    const resp = await AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/getPosVendorsByLocation`,
      "GET",
      params,
    );

    if (resp.data) {
      resp.data = resp.data.map((vendor: any) => ({
        ...vendor,
        _fullAddress: this.formatAddress(vendor.address),
      }));
    }

    return resp;
  }

  /**
   * Get POS purchase order vendors count by location
   * @param params - Query parameters for filtering
   * @returns Promise with count data
   */
  public static async getPosPoVendorsCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/getPosVendorsByLocation/count`,
      "GET",
      params,
    );
  }

  /**
   * Get top vendors for POS
   * @param params - Query parameters for filtering
   * @returns Promise with top vendors data
   */
  public static async getPosTopVendors(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/getTopVendor`,
      "GET",
      params,
    );
  }

  /**
   * Get recent vendors for POS
   * @param params - Query parameters for filtering
   * @returns Promise with recent vendors data
   */
  public static async getPosRecentVendors(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/getRecentVendor`,
      "GET",
      params,
    );
  }

  /**
   * Get vendors by category and brand
   * @param params - Query parameters for filtering
   * @returns Promise with vendors data
   */
  public static async getPosVendorsByCatBrand(
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/getVendorsByBrandAndCat`,
      "GET",
      params,
    );
  }

  /**
   * Create a new vendor
   * @param data - Vendor data
   * @returns Promise with created vendor
   */
  public static async create(data: Record<string, any>) {
    return AjaxService.request(`${this.BASE_URL}vendor/create`, "POST", data);
  }

  /**
   * Update an existing vendor
   * @param id - Vendor ID
   * @param data - Updated vendor data
   * @returns Promise with updated vendor
   */
  public static async update(id: string, data: Record<string, any>) {
    return AjaxService.request(`${this.BASE_URL}/vendor/${id}`, "PUT", data);
  }

  /**
   * Link (favorite) an existing vendor to the logged-in user's vendor list
   * @param vendorId - Vendor ID to link
   * @returns Promise with link response
   */
  public static async addToFavorites(vendorId: string) {
    return AjaxService.request(`${this.BASE_URL}vendor/favorites`, "POST", {
      vendorId,
      franchiseId: AuthService.getLoggedInUserId(),
    });
  }

  /**
   * Get vendor-based deals
   * @param params - Query parameters
   * @returns Promise with vendor deals data
   */
  public static async getVendorBasedDeals(params: Record<string, any> = {}) {
    const resp = await AjaxService.request(
      `${this.BASE_URL}/deal/${this.API_VERSION}/fetchVendorLinkedDeals`,
      "GET",
      params,
    );

    if (Array.isArray(resp.data)) {
      resp.data = resp.data.map((deal: any) => ({
        ...deal,
        category: {
          _id: deal.dealCategory || null,
          name: deal.dealCatName || null,
        },
        brand: {
          _id: deal.dealBrand || null,
          name: deal.dealBrandName || null,
        },
      }));
    }

    return resp;
  }

  /**
   * Deals this retailer has purchased from a vendor.
   * API: purchase/vendors/{vendorId}/purchased-deals
   * The rows mirror the seller-deals list shape, so they can be run through
   * `SellerCatalogService.formatProductResponse`.
   * @param vendorId - Vendor ID
   * @param params - Query params (e.g. `{ sortBy: "quantity", limit: 10 }`)
   */
  public static async getPurchasedDeals(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/vendors/${vendorId}/purchased-deals`,
      "GET",
      params,
      config,
    );
  }

  /**
   * Deals previously purchased from a vendor by the logged-in franchise.
   * Used as the source list when assembling a purchase cart.
   * API: purchase/vendors/{vendorId}/purchased-deals-by-franchise
   */
  public static async getPurchasedDealsByFranchise(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}purchase/vendors/${vendorId}/purchased-deals-by-franchise`,
      "GET",
      params,
      config,
    );
  }

  /**
   * Format vendor data with additional computed properties
   * @param data - Raw vendor data
   * @returns Formatted vendor data
   */
  public static formatVendorData(data: any) {
    if (!data) return data;

    // Vendor payload contains franchise: { id }
    const loggedInFid = AuthService.getLoggedInUserId();
    const vendorFranchiseId = data.franchise?.id || null;
    const _isCreatedByMe = Boolean(
      loggedInFid &&
      vendorFranchiseId &&
      String(loggedInFid) === String(vendorFranchiseId),
    );

    const { type, color, description } = this.getVendorType(data);

    return {
      ...data,
      _contact: data.contact.find((c: any) => c.isOwner),
      _formattedCreatedAt: data.createdAt ? new Date(data.createdAt) : null,
      _formattedUpdatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
      _primaryContact:
        data.contact?.find((c: any) => c.isOwner) || data.contact?.[0],
      _fullAddress: this.formatAddress(data.address),
      _shortAddress: this.formatShortAddress(data.address),
      _isCreatedByMe,
      _vendorType: type,
      _vendorTypeColor: color,
      _vendorTypeInfo: description,
      _distance: this.parseDistance(data.distanceKm ?? data.distance),
      _lat: data.geoPoint?.coordinates?.[1],
      _lng: data.geoPoint?.coordinates?.[0],
    };
  }

  /**
   * Format address string
   * @param address - Address object
   * @param city - City
   * @param state - State
   * @param pincode - Pincode
   * @returns Formatted address string
   */
  private static formatAddress(address: any) {
    const parts = [];
    if (address?.doorNo) parts.push(address.doorNo);
    if (address?.street) parts.push(address.street);
    if (address?.landmark) parts.push(address.landmark);
    if (address?.district) parts.push(address.district);
    if (address?.city) parts.push(address.city);
    if (address?.state) parts.push(address.state);
    if (address?.postcode) parts.push(address.postcode);
    return parts.join(", ");
  }

  /**
   * Short, locality-level address used on headers/cards where the full
   * door-no/street line is noise: state, district, town and pincode only.
   */
  private static formatShortAddress(address: any) {
    const parts = [];
    if (address?.state) parts.push(address.state);
    if (address?.district) parts.push(address.district);
    if (address?.city) parts.push(address.city);
    if (address?.postcode) parts.push(address.postcode);
    return parts.join(", ");
  }

  public static async verifyOtp(
    vendorId: string,
    otp: string,
    otpRequestId: string,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}vendor/${vendorId}/otp/verify`,
      "POST",
      {
        otp,
        otpRequestId,
      },
    );
  }

  public static async resendOtp(id: string) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${id}/otp/resend`,
      "POST",
    );
  }

  static async register(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/request-otp`,
      "POST",
      params,
    );
  }

  static async registerWithOtp(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/create-with-otp`,
      "POST",
      params,
    );
  }

  public static async generateOtp(id: string, otpRequestId?: string) {
    const body = otpRequestId ? { otpRequestId } : (undefined as any);
    return AjaxService.request(
      `${this.BASE_URL}vendor/${id}/resend-otp`,
      "POST",
      body,
    );
  }

  static getVendorFinancialSummary(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/financial-overview`,
      "GET",
      params,
    );
  }

  public static async getTopPerformers(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/top-performers`,
      "GET",
      params,
    );
  }

  /**
   * Analytics for a single vendor, sliced by `type`
   * (e.g. `purchaseorder` → PO counts, paid/pending/overdue amounts).
   * API: vendor/{vendorId}/analytics?type=purchaseorder
   * @param vendorId - Vendor mongo id
   * @param params - Query params, must include `type`
   */
  public static async getVendorAnalyticsByType(
    vendorId: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}vendor/${vendorId}/analytics`,
      "GET",
      params,
    );
  }

  public static async getVendorAnalytics(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/analytics`,
      "GET",
      params,
    );
  }

  static async getProducts(vendorId: string, params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}vendor/catalog/${vendorId}/search`,
      "GET",
      params,
    );
  }

  static async getProductsCount(
    vendorId: string,
    params: Record<string, any> = {},
  ) {
    let p = {
      outputType: "count",
      ...params,
    };
    return this.getProducts(vendorId, p);
  }

  public static async getVendorPayments(
    vendorId: string,
    params: Record<string, any> = {},
  ) {
    let p = {
      queryType: "Payments",
      ...params,
    };
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/vendor/${vendorId}`,
      "GET",
      p,
    );
  }

  static getVendorStatement(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/accounts/statements`,
      "GET",
      params,
    );
  }

  static recordPayment(poId: string, data: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/orders/${poId}/payment`,
      "POST",
      data,
    );
  }

  static getCategories(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/catalog/${vendorId}/categories`,
      "GET",
      params,
      config,
    );
  }

  static getBrands(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/catalog/${vendorId}/brands`,
      "GET",
      params,
      config,
    );
  }

  /**
   * Brands mapped to vendors — source for the "Vendors by brand" view.
   * API: vendor/brands
   * @param params - Query parameters (search / pagination / filters)
   */
  public static async getVendorBrands(params: Record<string, any> = {}) {
    return AjaxService.request(`${this.BASE_URL}/vendor/brands`, "GET", params);
  }

  public static async getReceivablesList(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/receivables/list`,
      "GET",
      params,
    );
  }

  public static async getVendorStatistics(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/orders/statistics`,
      "GET",
      params,
    );
  }

  public static async updateVendorBrands(
    vendorId: string,
    brands: Array<{ name: string; brandId: string; action: boolean }>,
    sourceAllBrands?: boolean,
  ) {
    const payload: any = {
      brands,
    };

    if (sourceAllBrands !== undefined) {
      payload.sourceAllBrands = sourceAllBrands;
    }

    return AjaxService.request(
      `${API}/vendor/${vendorId}/brands`,
      "PUT",
      payload,
    );
  }

  public static async getTopSkus(vendorId: string) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/vendors/${vendorId}/purchased-deals?sortBy=quantity`,
      "GET",
    );
  }

  /**
   * SK catalog deals scoped to a vendor — same response shape as
   * `InventorySubscribeService.getDeals` (catalog/deals/popular).
   * API: vendor/{vendorId}/deal/popular
   */
  public static async getVendorDeals(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${vendorId}/deal/popular`,
      "GET",
      { ...params, ignoreAsset: true },
      config,
    );
  }

  public static async getVendorDealsCount(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    return this.getVendorDeals(
      vendorId,
      { ...params, outputType: "count" },
      config,
    );
  }

  public static async getVendorCatalog(
    vendorId: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/vendors/${vendorId}/purchased-deals`,
      "GET",
      params,
    );
  }

  public static async getVendorCatalogCount(
    vendorId: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/vendors/${vendorId}/purchased-deals`,
      "GET",
      { ...params, outputType: "count" },
    );
  }

  /**
   * Normalize purchased-deal / vendor-catalog rows.
   * Adds price, discount, and display-friendly fields used across vendor views.
   */
  static formatVendorCatalog(data: any[]) {
    return (data || []).map((item: any) => {
      const price = Number(item.purchasePrice ?? item.lastPurchasePrice) || 0;
      const mrp = Number(item.mrp) || 0;
      const brandName = item.applicableBrand?.brandName || "";
      const rawUom = (item.uom || "piece").toLowerCase();
      const displayUom =
        rawUom === "piece" || rawUom === "pc" ? "pcs" : item.uom || "pcs";

      return {
        ...item,
        id: item._id,
        dealId: item.dealId || item.dealRefId,
        name: item.name || item.productName || "",
        brandName,
        brandCode:
          brandName.slice(0, 4) ||
          (item.name || "").slice(0, 4).toUpperCase() ||
          "SKU",
        price,
        mrp,
        discount: CommonService.calculateDiscount(mrp, price),
        totalQuantityPurchased: Number(item.totalQuantityPurchased) || 0,
        totalPurchaseValue: Number(item.totalPurchaseValue) || 0,
        orderCount: Number(item.orderCount) || 0,
        displayUom,
      };
    });
  }
}

export default VendorService;
