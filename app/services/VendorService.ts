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
      params
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
      params
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

  public static async getDashboardVendorList(params: Record<string, any> = {}) {
    const resp = await this.getVendors(params);

    // Skip address formatting if outputType is count
    if (resp.data?.data && params.outputType !== "count") {
      resp.data.data.forEach((vendor: any, idx: number) => {
        vendor._fullAddress = this.formatAddress(vendor.address);
        vendor._distance = CommonService.roundedByDecimalPlace(
          vendor.distance,
          2
        );
      });
    }

    return resp;
  }

  public static async getDashboardVendorOverall(id: string) {
    const queryParams = { queryType: "Overall" };
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/vendor/${id}`,
      "GET",
      queryParams
    );
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
      params
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
      params
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
      params
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
      params
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
      params
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
      params
    );
  }

  /**
   * Get vendors by category and brand
   * @param params - Query parameters for filtering
   * @returns Promise with vendors data
   */
  public static async getPosVendorsByCatBrand(
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/getVendorsByBrandAndCat`,
      "GET",
      params
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
   * Get vendor-based deals
   * @param params - Query parameters
   * @returns Promise with vendor deals data
   */
  public static async getVendorBasedDeals(params: Record<string, any> = {}) {
    const resp = await AjaxService.request(
      `${this.BASE_URL}/deal/${this.API_VERSION}/fetchVendorLinkedDeals`,
      "GET",
      params
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
      String(loggedInFid) === String(vendorFranchiseId)
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
      _isCreatedByMe,
      _vendorType: type,
      _vendorTypeColor: color,
      _vendorTypeInfo: description,
      _distance: CommonService.roundedByDecimalPlace(data.distanceKm, 2),
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

  public static async verifyOtp(
    vendorId: string,
    otp: string,
    otpRequestId: string
  ) {
    return AjaxService.request(
      `${this.BASE_URL}vendor/${vendorId}/otp/verify`,
      "POST",
      {
        otp,
        otpRequestId,
      }
    );
  }

  public static async resendOtp(id: string) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${id}/otp/resend`,
      "POST"
    );
  }

  static async register(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/request-otp`,
      "POST",
      params
    );
  }

  static async registerWithOtp(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/create-with-otp`,
      "POST",
      params
    );
  }

  public static async generateOtp(id: string, otpRequestId?: string) {
    const body = otpRequestId ? { otpRequestId } : (undefined as any);
    return AjaxService.request(
      `${this.BASE_URL}vendor/${id}/resend-otp`,
      "POST",
      body
    );
  }

  static getVendorFinancialSummary(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/financial-overview`,
      "GET",
      params
    );
  }

  public static async getTopPerformers(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/top-performers`,
      "GET",
      params
    );
  }

  public static async getVendorAnalytics(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/analytics`,
      "GET",
      params
    );
  }

  static async getProducts(vendorId: string, params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}vendor/catalog/${vendorId}/search`,
      "GET",
      params
    );
  }

  static async getProductsCount(
    vendorId: string,
    params: Record<string, any> = {}
  ) {
    let p = {
      outputType: "count",
      ...params,
    };
    return this.getProducts(vendorId, p);
  }

  public static async getVendorPayments(
    vendorId: string,
    params: Record<string, any> = {}
  ) {
    let p = {
      queryType: "Payments",
      ...params,
    };
    return AjaxService.request(
      `${this.BASE_URL}/vendor/${this.API_VERSION}/dashboard/vendor/${vendorId}`,
      "GET",
      p
    );
  }

  static getVendorStatement(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/accounts/statements`,
      "GET",
      params
    );
  }

  static recordPayment(poId: string, data: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/orders/${poId}/payment`,
      "POST",
      data
    );
  }

  static getCategories(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/catalog/${vendorId}/categories`,
      "GET",
      params,
      config
    );
  }

  static getBrands(
    vendorId: string,
    params: Record<string, any> = {},
    config?: AxiosRequestConfig
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/catalog/${vendorId}/brands`,
      "GET",
      params,
      config
    );
  }

  public static async getReceivablesList(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/vendor/receivables/list`,
      "GET",
      params
    );
  }

  public static async getVendorStatistics(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}/purchase/orders/statistics`,
      "GET",
      params
    );
  }

  public static async updateVendorBrands(
    vendorId: string,
    brands: Array<{ name: string; brandId: string; action: boolean }>,
    sourceAllBrands?: boolean
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
      payload
    );
  }
}

export default VendorService;
