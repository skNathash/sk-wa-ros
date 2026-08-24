import { format, differenceInDays, differenceInHours, isToday } from "date-fns";
import { get, merge } from "lodash";
import { tileDecor } from "~/components/core/tint/tints";
import { API, API_VERSION, OLD_API } from "~/constants";
import type { VariantColor } from "~/types/CommonTypes";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import StorageService from "./StorageService";
import CommonService from "./CommonService";

/** Count + starting price of one plan shape, derived from the plan list API. */
export interface PlanShapeSummary {
  /** How many approved, active plans (tiers) the shape has. */
  count: number;
  /** Display value beside the eyebrow, e.g. "5 tiers". */
  countDisplay: string;
  /** Lowest monthly subscription amount across the shape's plans. */
  startingAmount: number;
  /** Display value for the card, e.g. "₹499". */
  startingDisplay: string;
}

export interface PlanShapeSummaries {
  stock: PlanShapeSummary;
  shop: PlanShapeSummary;
  /** Tiers across both shapes — "Compare all 8 tiers". */
  totalCount: number;
}

class FranchiseService {
  // Temporary storage for signup flow data
  private static _signupTemp: Record<string, any> = {};

  // Field used to rank "top sellers" — most orders placed in the last 30 days.
  static readonly TOP_SELLERS_SORT_KEY = "salesAnalytics.last30Days.orders";

  /**
   * Replace the entire signup temp object
   */
  static setSignupTemp(data: Record<string, any>) {
    this._signupTemp = data || {};
  }

  /**
   * Shallow merge update into the signup temp object
   */
  static updateSignupTemp(data: Record<string, any>) {
    this._signupTemp = { ...(this._signupTemp || {}), ...(data || {}) };
  }

  /**
   * Get a copy of the signup temp object
   */
  static getSignupTemp(): Record<string, any> {
    return { ...(this._signupTemp || {}) };
  }

  /**
   * Returns true if there is any temporary signup data present
   */
  static hasTempSignupData(): boolean {
    try {
      return Object.keys(this._signupTemp || {}).length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Clear all temporary signup data
   */
  static clearSignupTemp() {
    this._signupTemp = {};
  }
  /**
   * Normalize a single franchise object by adding lat/lng from geoLocation.coordinates [lng, lat]
   */
  static formatFranchise(franchise: any) {
    if (!franchise || typeof franchise !== "object") return franchise;
    const coords = get(franchise, "geoLocation.coordinates", [] as any[]);
    const lng =
      Array.isArray(coords) && coords.length >= 2 ? coords[0] : undefined;
    const lat =
      Array.isArray(coords) && coords.length >= 2 ? coords[1] : undefined;

    const subType = franchise?.subType || "";
    const networkType = franchise?.networkType || "";
    const displayType = this.getDisplaySubType(subType, networkType);

    // Photos removed by the store are kept by the backend with `isDeleted`
    // set — drop them so nothing downstream renders or counts them.
    const shopImages = (get(franchise, "shopPhotosDetails", []) || []).filter(
      (e: Record<string, any>) => e?.isDeleted !== true,
    );

    const approvedShopPhotos = shopImages.filter(
      (e: Record<string, any>) => e.status === "Approved",
    );
    const shopImg = approvedShopPhotos?.[0]?.fileUrl || "";

    const approvedImg = shopImages.find(
      (img: any) => img.status === "Approved",
    );

    // Format profile update request logs if present
    if (franchise?.profileUpdateRequest) {
      franchise.profileUpdateRequest = this.formatProfileUpdateRequestLog(
        franchise.profileUpdateRequest,
      );
    }

    // Filter address logs by type "ADDRESS_UPDATE"
    const addressLogs = Array.isArray(franchise?.profileUpdateRequest)
      ? franchise.profileUpdateRequest
          .filter((log: any) => log.type === "ADDRESS_UPDATE")
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
      : [];

    return {
      ...franchise,
      shopPhotosDetails: shopImages,
      displayType: displayType,
      lat,
      lng,
      approvedShopPhotos,
      shopImg,
      approvedShopImage: approvedImg ? approvedImg.fileUrl : "",
      addressLogs,
    };
  }

  // Membership badge — label plus the AppBadge variant it wears, resolved once
  // here rather than in every view.
  private static NETWORK_BADGES: Record<
    string,
    { label: string; color: VariantColor }
  > = {
    SKSELLER: { label: "SK Seller", color: "primary" },
    SKRETAILER: { label: "SK Retailer", color: "success" },
    SKBUYER: { label: "SK Buyer", color: "warning" },
    SFSELLER: { label: "SF Seller", color: "light" },
    SKMASTER: { label: "SK Master", color: "secondary" },
    SKVENDOR: { label: "SK Vendor", color: "light" },
  };

  // Enrich a retailer's paylaterInfo with display-ready values so views can
  // render it without recomputing.
  static formatPaylater(item: any) {
    const paylater = item.paylaterInfo;
    if (!paylater) return item;

    const creditLimit = paylater.creditLimit || 0;
    const usedPct = creditLimit
      ? Math.min(
          100,
          Math.round(((paylater.totalAmountUsed || 0) / creditLimit) * 100),
        )
      : 0;

    return { ...item, paylaterInfo: { ...paylater, usedPct } };
  }

  // Decorate a seller with everything the cards print: paylater usage, the tint
  // slot behind the avatar and the network badge's label / colour.
  static formatSeller(item: any) {
    const network = this.NETWORK_BADGES[(item.networkType || "").toUpperCase()];

    // Fulfilment / volume figures the response carries at the top level on the
    // nearby-sellers API and under `analytics` elsewhere. Normalised to numbers
    // here so the cards can just check `> 0`.
    const minOrder =
      Number(item.minOrder ?? item.analytics?.minOrder ?? 0) || 0;
    const orderCount =
      Number(
        item.orderCount ??
          item.analytics?.orderCount ??
          item.analytics?.totalOrders ??
          0,
      ) || 0;

    return {
      ...this.formatPaylater(item),
      ...tileDecor(item.name),
      _networkLbl: network?.label ?? "",
      _networkColor: (network?.color ?? "light") as VariantColor,
      _minOrder: minOrder,
      _orderCount: orderCount,
    };
  }

  static async getFranchises(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}franchise/list`,
      "GET",
      params,
    );
    try {
      const payload: any = response?.data?.data;
      if (payload && Array.isArray(payload?.data?.data)) {
        payload.data.data = payload.data.data.map((item: any) =>
          this.formatFranchise(item),
        );
      }
    } catch {}
    return response;
  }

  static async getFranchisesCount(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/list`, "GET", {
      ...params,
      outputType: "count",
    });
  }

  static async getFranchise(id: string, params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}franchise/${id}`,
      "GET",
      params,
    );
    try {
      if (response?.data?.data?._id) {
        response.data.data = this.formatFranchise(response.data.data);
      }
    } catch {}
    return response;
  }

  static getConnectedSellers() {
    const u = AuthService.getLoggedInUser();
    return u?.connectedSellerIds || [];
  }

  static isRfSfOrdEnabledForSf(checkInParent = false): boolean {
    let user = checkInParent
      ? this.getParentFranInfoFromLocal()
      : AuthService.getLoggedInUser();
    return Boolean(user?.rfRequestOrderConfig?.status);
  }

  static getParentFranInfoFromLocal(): Record<string, any> {
    try {
      return StorageService.get("_pf") || {};
    } catch {
      return {};
    }
  }

  static hasSecondaryWallet() {
    const u = AuthService.getLoggedInUser();
    return (u.secondaryAccounts || []).filter((e: any) => !e.isSkLoan).length >
      0
      ? true
      : false;
  }

  static hasCodLimitEnabled() {
    const u = AuthService.getLoggedInUser();
    return (u.secondaryAccounts || []).filter((e: any) => e.isSkLoan).length > 0
      ? true
      : false;
  }

  static getSecondaryWalletId() {
    if (this.hasSecondaryWallet()) {
      const u = AuthService.getLoggedInUser();
      return get(u, "secondaryAccounts[0].accountId", "");
    } else {
      return "";
    }
  }

  static getAccountId() {
    const u = AuthService.getUserAccountId();
    return u || "";
  }

  static async getBalance(fid: string, apiParams?: any) {
    const accountId = this.getAccountId();
    const u = AuthService.getLoggedInUser();

    const cwid = get(u, "secondaryAccounts[0].accountId", "");
    const defaultParam = {
      select: "balance,credit_limit,accountSubType",
      filter: {
        owner: fid,
      },
    };
    const p = Object.assign({}, defaultParam, apiParams || {});

    const response = await AjaxService.request(
      `${OLD_API}account/${API_VERSION}`,
      "GET",
      p || {},
    );

    const { data, statusCode } = response;

    if (statusCode == 200) {
      return {
        balance:
          ((data || []).find((e: any) => e._id == accountId) || {
            balance: 0,
          })["balance"] || 0,
        creditWallet:
          ((data || []).find((e: any) => e._id == cwid) || { balance: 0 })[
            "balance"
          ] || 0,
        creditWalletData: (data || []).find((e: any) => e._id == cwid) || {},
        reserveBalance: (data || []).find((e: any) =>
          e["accountSubType"] == "Reserve" ? e["balance"] : 0,
        ),
        _raw: data,
        statusCode,
      };
    } else {
      console.error("Error fetching balance, statusCode:", statusCode);
      return {
        balance: 0,
        creditWallet: 0,
        creditWalletData: {},
        reserveBalance: 0,
        _raw: null,
        statusCode,
      };
    }
  }

  static getSecondaryBalance(fid: string, apiParams?: any) {
    return this.getBalance(fid, apiParams);
  }

  static async getMyRetailers(params?: Record<string, any>) {
    return this.getFranchises(
      merge(
        {},
        {
          filter: {
            "sk_franchise_details.linked_rmf": AuthService.getLoggedInUserId(),
          },
        },
        params,
      ),
    );
  }

  static async getMyRetailersCount(params?: Record<string, any>) {
    return this.getFranchisesCount(
      merge(
        {},
        {
          filter: {
            "sk_franchise_details.linked_rmf": AuthService.getLoggedInUserId(),
          },
        },
        params,
      ),
    );
  }

  static async getFranSubUser(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/manpower/list`, "GET", {
      ...params,
      includeAll: true,
    });
  }

  static async getFranSubUserById(id: string) {
    return AjaxService.request(`${API}franchise/manpower/${id}`, "GET", {
      includeAll: true,
    });
  }

  static async getFranSubUserCount(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/manpower/count`, "GET", {
      ...params,
      includeAll: true,
    });
  }

  /**
   * Fetch active order configuration (including payment options) for multiple franchises
   * Endpoint: api/franchise/order/config/active/list?franchiseIds=
   * @param franchiseIds array of franchise ids or comma separated string
   */
  static async getActiveOrderConfigs(franchiseIds: string[] | string = []) {
    const ids = Array.isArray(franchiseIds)
      ? franchiseIds.join(",")
      : franchiseIds || "";
    return AjaxService.request(
      `${API}franchise/order/config/active/list`,
      "GET",
      {
        franchiseIds: ids,
      },
    );
  }

  static updateFranSubUser(id: string, params: any) {
    return AjaxService.request(`${API}franchise/manpower/${id}`, "PUT", params);
  }

  static createFranSubUser(params: any) {
    return AjaxService.request(`${API}franchise/manpower`, "POST", params);
  }

  static resendSubUserOtp(params: any) {
    return AjaxService.request(`${API}user/auth/resend-otp`, "POST", params);
  }

  static validateSubUserOtp(params: any) {
    return AjaxService.request(`${API}user/auth/verify/otp`, "POST", params);
  }

  static async getAddressOnPincode(pincode: string | number) {
    const params = {
      page: 1,
      count: 100,
      filter: {
        pincode: pincode,
      },
    };
    return AjaxService.request(
      `${OLD_API}utilities/${API_VERSION}/pincodeImport`,
      "GET",
      params,
    );
  }

  static sendOtpForRegistration(mobile: string | number) {
    return AjaxService.request(
      `${OLD_API}utilities/generateOtp/${mobile}`,
      "POST",
      {},
    );
  }

  static verifyOtpForRegistration(
    otpId: string,
    otp: number,
    mobile: string | number,
  ) {
    return AjaxService.request(
      `${OLD_API}utilities/validateOtp/${otpId}/${otp}/${mobile}`,
      "POST",
      {},
    );
  }

  static resendOtpForRegistration(otpId: string) {
    return AjaxService.request(
      `${OLD_API}utilities/retryOtp/${otpId}`,
      "POST",
      {},
    );
  }

  static sendEmailOtp(params: { refType: string; email: string }) {
    return AjaxService.request(
      `${API}notification/api/otp/generate/email`,
      "POST",
      params,
    );
  }

  static verifyEmailOtp(params: { otpRequestId: string; otp: string }) {
    return AjaxService.request(
      `${API}notification/api/otp/verify`,
      "POST",
      params,
    );
  }

  static doSignup(params: any) {
    return AjaxService.request(
      `${OLD_API}utilities/franchiseSignUp`,
      "POST",
      params || {},
    );
  }

  static getEmployeeAccessList() {
    return [
      {
        label: "GRN Processing",
        description: "Allow employee to process Goods Receipt Notes",
        valuePath: "enableGRNProcessing",
        value: false,
      },
      {
        label: "Manage Picking",
        description: "Allow employee to login to picker app for picking items",
        valuePath: "enablePickingManagement",
        value: false,
      },
      {
        label: "Manage Picker Device",
        description: "Allow employee to manage picker devices",
        valuePath: "managePickerDevice",
        value: false,
      },
      {
        label: "Manage Employees",
        description: "Allow employee to manage other employees",
        valuePath: "manageEmployees",
        value: false,
      },
      {
        label: "Manage Employee Access",
        description:
          "Allow employee to manage access rights of other employees",
        valuePath: "manageEmployeeAccess",
        value: false,
      },
      // {
      //   label: "Manage Pick/Pack Operation Setting",
      //   description: "Allow employee to manage pick/pack operation settings",
      //   valuePath: "managePickPackOperationSetting",
      //   value: false,
      // },
      {
        label: "Manage Return Inward",
        description: "Allow employee to manage return inward operations",
        valuePath: "manageReturnInward",
        value: false,
      },
      {
        label: "Can Place B2B Order",
        description: "Allow employee to place orders to the StoreKing",
        valuePath: "canPlaceB2BOrder",
        value: false,
      },
    ];
  }

  static getDocs(type: string, params?: any) {
    return AjaxService.request(
      `${OLD_API}utilities/getSignUpConfigurationList/${type}`,
      "GET",
      params || {},
    );
  }

  static updateFranchise(params?: any) {
    return AjaxService.request(`${API}franchise/profile`, "PUT", params || {});
  }

  static checkFssaiDuplicate(fssaiId: string) {
    return AjaxService.request(
      `${API}franchise//fssai/check/${fssaiId}`,
      "GET",
    );
  }

  static async getNotifications(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/notification/list`,
      "GET",
      params,
    );
  }

  static updateProfileDoc(id: string, params: any) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/createProfileDoc/${id}`,
      "PUT",
      params,
    );
  }

  static updateFranSubUserPermission(
    id: string,
    params: { featureId: string; active: boolean },
  ) {
    return AjaxService.request(
      `${API}franchise/manpower/${id}/permission`,
      "PATCH",
      params,
    );
  }

  // Support updating multiple feature permissions in a single request
  static updateFranSubUserPermissions(
    id: string,
    params: { features: { featureId: string; active: boolean }[] },
  ) {
    return AjaxService.request(
      `${API}franchise/manpower/${id}/permission`,
      "PATCH",
      params,
    );
  }

  static async getFranchiseNetwork(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/network`, "GET", params);
  }

  /**
   * Sort spec for the "top sellers" ordering (busiest sellers first).
   * Shared by the Top Sellers rail and the retailers list page so both stay
   * in sync.
   */
  static getTopSellersSort(): Record<string, number> {
    return { [this.TOP_SELLERS_SORT_KEY]: -1 };
  }

  static async getRetailersNearby(params: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}franchise/boundary/retailers/nearby`,
      "GET",
      params,
    );

    try {
      if (response && Array.isArray(response?.data?.data)) {
        response.data.data = response.data.data.map((item: any) =>
          this.formatSeller(this.formatFranchise(item)),
        );
      }
    } catch {}

    return response;
  }

  static async getFranchiseNetworkCount(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/network/count`, "GET", params);
  }

  /**
   * Linked-franchise dashboard list (B2B network).
   * Endpoint: GET {{BASE_URL}}franchise/dashboard/franchises
   * Supports outputType=list | count | loyaltySummary.
   */
  static async getFranchiseDashboardList(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/dashboard/franchises`,
      "GET",
      params,
    );
  }

  static createConfigs(params: any) {
    return AjaxService.request(`${API}franchise/order/config`, "POST", params);
  }

  static updateConfigs(id: string, params: any) {
    return AjaxService.request(
      `${API}franchise/order/config/${id}`,
      "PUT",
      params,
    );
  }

  static getConfigs(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/order/config`, "GET", params);
  }

  /**
   * Create or update franchise access configuration (e.g. scheme exclude list)
   * POST payload example:
   * {
   *   "franchiseId":"68b5a6dd2702ac18cba631ca",
   *   "schemeExcludeFranchiseList": [ { "id": "6908..", "refId": "F324881", "name": "..." } ]
   * }
   */
  static createAccessConfig(params: any) {
    return AjaxService.request(
      `${API}franchise/access-config`,
      "POST",
      params || {},
    );
  }

  // Fetch franchise access configuration
  static getAccessConfig(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/access-config`,
      "GET",
      params || {},
    );
  }

  // Update specific access-config by id
  static updateAccessConfig(id: string, params: any) {
    return AjaxService.request(
      `${API}franchise/access-config/${id}`,
      "PUT",
      params || {},
    );
  }

  static async getFranchiseSettings(params: Record<string, any> = {}) {
    const id = params.franchiseId || AuthService.getLoggedInUserId();
    const { franchiseId, ...restParams } = params;
    return AjaxService.request(
      `${API}franchise/settings/${id}`,
      "GET",
      restParams,
    );
  }

  /**
   * Update franchise settings by calling franchise/settings POST endpoint
   * Expects payload shape: { franchiseId, configType, configValue: {...} }
   */
  static async updateFranchiseSettings(params: any) {
    return AjaxService.request(
      `${API}franchise/settings`,
      "POST",
      params || {},
    );
  }

  static searchFranchise(params: any) {
    return AjaxService.request(
      `${OLD_API}franchise/${API_VERSION}/search`,
      "GET",
      params,
    );
  }

  /**
   * Generate time options in 12-hour format with 30-minute intervals
   * @returns Array of time options with value and label
   */
  static generateTimeOptions() {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        times.push({
          value: format(date, "HH:mm"),
          label: format(date, "hh:mm a"),
        });
      }
    }
    return times;
  }

  /**
   * Upgrade store to premium model
   * @param upgradeData - The upgrade request data
   * @returns Promise with API response
   */
  static async upgradeStore(id: string, params: any) {
    return AjaxService.request(
      `${OLD_API}franchise/v1/enableNewPlatformMigration/${id}`,
      "PUT",
      params,
    );
  }

  static async fetchSkSellers(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/network/config/fetch/sksellers`,
      "GET",
      params || {},
    );
  }

  static async fetchSkSellersCount(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/network/config/fetch/sksellers`,
      "GET",
      { ...params, outputType: "count" },
    );
  }

  static async joinSeller(params: any) {
    return AjaxService.request(
      `${API}franchise/network/config/create/networkrequest`,
      "POST",
      params,
    );
  }

  static async getJoiningRequesFromBuyer(params?: Record<string, any>) {
    const response = await AjaxService.request(
      `${API}franchise/network/config/received/requests`,
      "GET",
      params || {},
    );

    // Format status for each request
    if (
      response?.data?.data?.requests &&
      Array.isArray(response.data.data.requests)
    ) {
      response.data.data.requests = response.data.data.requests.map(
        (request: any) => {
          const status = request.status?.toLowerCase();

          if (status === "approved") {
            request._statusLbl = "Approved";
            request._statusColor = "success";
          } else if (status === "rejected") {
            request._statusLbl = "Rejected";
            request._statusColor = "danger";
          } else {
            request._statusLbl = "Pending";
            request._statusColor = "warning";
          }

          return request;
        },
      );
    }

    return response;
  }

  static async getJoiningRequesFromBuyerCount(
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${API}franchise/network/config/received/requests`,
      "GET",
      { ...params, outputType: "count" },
    );
  }

  static async createSkSellerJoinRequest(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/network/config/sf-seller-sk-requests`,
      "POST",
      params,
    );
  }

  static async getSkSellerJoinRequests(id: string) {
    return AjaxService.request(
      `${API}franchise/network/config/sf-seller-sk-requests/${id}`,
      "GET",
      {},
    );
  }

  static async getSfSellerSkRequests(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/network/config/sf-seller-sk-requests`,
      "GET",
      params,
    );
  }

  static async updateNetworkRequest(fid: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/network/config/skseller/update/${fid}`,
      "PUT",
      params,
    );
  }

  static async getNetworkStatus(sfSellerId: string) {
    return AjaxService.request(
      `${API}franchise/network/config/fetch/status/${sfSellerId}`,
      "GET",
    );
  }

  static async createDisconnectionRequest(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/network/config/create/disconnection-request`,
      "POST",
      params,
    );
  }

  static async fetchServiceFeePlan(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan`,
      "GET",
      params || {},
    );
  }

  /**
   * Plans of one shape for a given billing duration, with that duration's
   * operational fee already applied.
   * Endpoint: GET franchise/service-fee-plan/operational-fees
   */
  static async fetchServiceFeePlanOperationalFees(
    params?: Record<string, any>,
  ) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan/operational-fees`,
      "GET",
      params || {},
    );
  }

  /** Plan shapes on the benefits screens map onto these plan types. */
  static readonly PLAN_SHAPE_TYPE = {
    stock: "Hybrid",
    shop: "FeatureLimit",
  } as const;

  /**
   * Tier count and "starting at" price of one plan shape, off a single read of
   * the plan list so both numbers always come from the same set of plans.
   * Endpoint: GET franchise/service-fee-plan
   */
  static async getPlanShapeSummary(
    typeOfPlan: string,
  ): Promise<PlanShapeSummary> {
    const fallback: PlanShapeSummary = {
      count: 0,
      countDisplay: "—",
      startingAmount: 0,
      startingDisplay: "—",
    };

    try {
      const response = await FranchiseService.fetchServiceFeePlan({
        filter: {
          isActive: true,
          status: "Approved",
          typeOfPlan,
        },
      });

      const plans = response?.data?.data || [];
      const count = plans.length;

      if (!count) return fallback;

      const amounts = plans
        .map((plan: any) => Number(plan.subscriptionAmount) || 0)
        .filter((amount: number) => amount > 0);
      const startingAmount = amounts.length ? Math.min(...amounts) : 0;

      return {
        count,
        countDisplay: `${count} ${count === 1 ? "tier" : "tiers"}`,
        startingAmount,
        startingDisplay: startingAmount
          ? `₹${CommonService.formattedAmount(startingAmount, 0)}`
          : "—",
      };
    } catch (e) {
      return fallback;
    }
  }

  /** Summary of both plan shapes, fetched in parallel. */
  static async getPlanShapeSummaries(): Promise<PlanShapeSummaries> {
    const [stock, shop] = await Promise.all([
      FranchiseService.getPlanShapeSummary(
        FranchiseService.PLAN_SHAPE_TYPE.stock,
      ),
      FranchiseService.getPlanShapeSummary(
        FranchiseService.PLAN_SHAPE_TYPE.shop,
      ),
    ]);

    return { stock, shop, totalCount: stock.count + shop.count };
  }

  static async fetchServiceFeePlanPerks(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan/perks`,
      "GET",
      params || {},
    );
  }

  /**
   * Plan features bundled with the service fee plans.
   * Endpoint: GET franchise/service-fee-plan/plan-features
   */
  static async fetchServiceFeePlanFeatures(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan/plan-features`,
      "GET",
      params || {},
    );
  }

  /**
   * Get prepaid payment configuration for the franchise
   */
  static async getPaymentConfig(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/payment/config`,
      "GET",
      params || {},
    );
  }

  static async createPaymentConfig(params: any) {
    return AjaxService.request(
      `${API}franchise/payment/config`,
      "POST",
      params || {},
    );
  }

  static async updateUserPaymentConfig(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/payment/config/user/add`,
      "PUT",
      params || {},
    );
  }

  /**
   * Remove a specific user from payment config
   * Endpoint: franchise/payment/config/user/remove
   * Payload: { buyerId, remarks, businessType }
   */
  static async removePaymentConfigUser(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/payment/config/user/remove`,
      "PUT",
      params || {},
    );
  }

  static async getSpecificUserConfig(
    userId: string,
    loggedInUserId: string,
    businessType: "B2C" | "B2B",
  ) {
    return AjaxService.request(
      `${API}franchise/payment/config/resolve-policy`,
      "GET",
      {
        franchiseId: loggedInUserId,
        buyerId: userId,
        businessType,
      },
    );
  }

  /**
   * Fetch payment configuration logs
   * Endpoint: franchise/payment/config/logs
   */
  static async getPaymentConfigLogs(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/payment/config/logs`,
      "GET",
      params || {},
    );
  }

  static async subscribeServiceFeePlan(params: any) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan-subscription`,
      "POST",
      params || {},
    );
  }

  static async getServiceFeePlanSubscriptions(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan-subscription`,
      "GET",
      params || {},
    );
  }

  static async cancelServiceFeeSubscription(id: string) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan-subscription/${id}/cancel`,
      "PUT",
    );
  }

  static getDisplaySubType(subType: string, networkType: string) {
    let lbl = "";
    if (networkType === "SKSELLER") {
      lbl = "SK Seller";
    } else if (networkType === "SKBUYER") {
      lbl = "SK Buyer";
    } else if (networkType === "SKMASTER") {
      lbl = "SK Master";
    } else {
      lbl = "SK Retailer";
    }

    return { name: lbl, type: subType };
  }

  /**
   * Extract the statutory document numbers (GST, PAN, FSSAI) from a franchise.
   *
   * - GST  : taken directly from `franchise.gstNumber`
   * - PAN  : matched as "Pan"/"Pancard" across the business/address/photo
   *          document buckets, returning the approved record's number
   * - FSSAI: taken from `documents.fssai` (or `franchise.fssai`) when its
   *          `docStatus` is "Approved"
   *
   * @returns `{ gst, pan, fssai }` with empty strings when not available
   */
  static getFranchiseDocumentInfo(franchise: any): {
    gst: string;
    pan: string;
    fssai: string;
  } {
    const equalsIgnoreCase = (a?: string, b?: string) =>
      (a || "").toLowerCase() === (b || "").toLowerCase();

    const isPanType = (type?: string) =>
      equalsIgnoreCase(type, "Pan") || equalsIgnoreCase(type, "Pancard");

    const isApproved = (status?: string) =>
      equalsIgnoreCase(status, "Approved");

    const docs = franchise?.documents || {};

    const gst = franchise?.gstNumber || "";

    // PAN can live in any of the document buckets; pick the approved record
    let pan = "";
    const businessMatch = (docs.business || []).find(
      (d: any) => isPanType(d?.businessID) && isApproved(d?.businessIDStatus),
    );
    const addressMatch = (docs.address || []).find(
      (d: any) =>
        isPanType(d?.addressProof) && isApproved(d?.addressProofIdStatus),
    );
    const photoMatch = (docs.photo || []).find(
      (d: any) => isPanType(d?.photoID) && isApproved(d?.photoIdStatus),
    );
    pan =
      businessMatch?.businessIDNo ||
      addressMatch?.addressProofNo ||
      photoMatch?.photoIDNo ||
      "";

    const fssaiDoc = docs.fssai || franchise?.fssai;
    const fssai = isApproved(fssaiDoc?.docStatus)
      ? fssaiDoc?.licenseNo || ""
      : "";

    return { gst, pan, fssai };
  }

  static async createSkRetailer(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/skretailer/create`,
      "POST",
      params,
    );
  }

  static async generateSkRetailerOtp(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/skretailer/otp/generate`,
      "POST",
      params,
    );
  }

  static async getFranchiseTransactions(params?: Record<string, any>) {
    const id = AuthService.getLoggedInUserId();
    return AjaxService.request(
      `${API}franchise/${id}/transactions`,
      "GET",
      params || {},
    );
  }

  static async getPlatformPlanDetails(id: string) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan-subscription/${id}`,
      "GET",
    );
  }

  static async getActivePlan() {
    const r = await AjaxService.request(`${API}franchise/profile`, "GET");
    const activePlan = r?.data?.data?.serviceFeeSubscriptionInfo || null;

    if (!activePlan || !activePlan?.planId) {
      return null;
    }

    const planResp = await FranchiseService.fetchServiceFeePlan({
      filter: { _id: activePlan.planId, isActive: true, status: "Approved" },
    });
    const planDetails = planResp?.data?.data?.[0] || {};

    const isExpiredByStatus = activePlan.status === "Expired";

    const daysUntilExpiry = activePlan.planEndAt
      ? differenceInDays(new Date(activePlan.planEndAt), new Date())
      : 0;
    const remainingDays = isExpiredByStatus ? 0 : Math.max(0, daysUntilExpiry);
    let displayRemainingDays;
    if (isExpiredByStatus) {
      displayRemainingDays = "Expired";
    } else if (daysUntilExpiry > 0) {
      displayRemainingDays = `${remainingDays} days remaining`;
    } else if (daysUntilExpiry === 0) {
      const hours = differenceInHours(
        new Date(activePlan.planEndAt),
        new Date(),
      );
      if (hours > 0) {
        displayRemainingDays = `${Math.floor(hours)}hrs`;
      } else {
        displayRemainingDays = "Expiring today";
      }
    } else {
      displayRemainingDays = "Expired";
    }

    const availableAmount = activePlan.availableAmount || 0;
    const totalLimit = activePlan.limitAmount;
    const usedAmount = activePlan.usedAmount;
    const usagePercentage =
      totalLimit > 0 ? (usedAmount / totalLimit) * 100 : 0;

    // availableAmount > 0 &&
    const isActive = !isExpiredByStatus && daysUntilExpiry >= 0;

    const isExpiringSoon = remainingDays > 0 && remainingDays <= 7;

    const usagePercentageSafe = Math.min(100, Math.max(0, usagePercentage));
    const isUsageNearLimit = usagePercentageSafe >= 85 && !isExpiringSoon;

    return {
      availableAmount,
      paidAt: activePlan.paidAt,
      planAmount: activePlan.planAmount,
      totalLimit,
      planEndAt: activePlan.planEndAt,
      planId: activePlan.planId || null,
      planName: activePlan.title || activePlan.planName || "",
      planStartAt: activePlan.planStartAt,
      isPlanActive: isActive,
      remainingDays,
      displayRemainingDays,
      usedAmount,
      usagePercentage: usagePercentageSafe,
      isExpiringSoon,
      isUsageNearLimit,
      // Only allow upgrade when backend returned valid plan details  && Boolean(planDetails?._id)
      canUpgradePlan: isExpiredByStatus || usagePercentage > 75,
      canCancel: usagePercentage > 75,
      subscriptionId: activePlan.subscriptionId,
      isPercentage: activePlan.planType === "Percentage",
      typeOfPlan: activePlan?.typeOfPlan,
      type: activePlan?.type,
      operationalFeeInfo: activePlan?.operationalFeeInfo || null,
      planDetails,
    };
  }

  static getBuyPlanLink() {
    const activePlan = this.getActivePlanFromLocal();

    if (activePlan?.planType == "Percentage") {
      return "/dashboard/deposit-money/options?topup-plan=1";
    }
    return "/dashboard/accounts/platform-fee?tab=commission-invoices";
  }

  /**
   * Format a single statement item by adding redirect info for transaction IDs starting with PO0
   */
  static formatPlanStatementItem(item: any) {
    if (!item || typeof item !== "object") return item;

    const transactionId = item.transactionId || "";
    const orderid = item.orderInfo?.id || "";
    let redirect = { path: "", params: {}, useDskNav: false };

    let showDownloadLink = false;

    if (typeof transactionId === "string" && transactionId.startsWith("PO0")) {
      redirect.path = `/dashboard/purchase-order/view/${orderid}`;
    }

    if (typeof transactionId === "string" && transactionId.startsWith("SKSP")) {
      const createdAt = item.createdAt;
      const date = format(new Date(createdAt), "yyyy-MM-dd");
      redirect.path = `/dashboard/accounts/sk-statement?search=${transactionId}&tab=sk-statement&dateFrom=${date}&dateTo=${date}`;
      showDownloadLink = true;
    }

    return {
      ...item,
      _tranRedirect: redirect,
      _showDownloadLink: showDownloadLink,
    };
  }

  static async getPlatformFeeStatement(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}franchise/service-fee-plan-subscription/fetch/statement`,
      "GET",
      params,
    );
  }

  static downloadPlanStatement(fileName: string) {
    return `${API}franchise/downloadstatement/${fileName}`;
  }

  static getActivePlanFromLocal() {
    const user = AuthService.getLoggedInUser();
    const activePlan = user?.serviceFeeSubscriptionInfo;
    return activePlan || null;
  }

  /**
   * The monthly (1-month commitment) hybrid operational fee is being retired.
   * Only franchises who purchased a plan before this cutoff continue to see it.
   */
  static MONTHLY_HYBRID_PLAN_CUTOFF = new Date("2026-07-01T00:00:00");

  /**
   * Whether the logged-in franchise is allowed to see the legacy monthly
   * (value === 1) hybrid plan. True only if they purchased a hybrid plan
   * before the cutoff, determined from the purchased-plan detail in local
   * storage.
   */
  static canSeeMonthlyHybridPlan(): boolean {
    const activePlan = this.getActivePlanFromLocal();
    if (!activePlan) return false;
    // Only franchises who purchased a hybrid plan earlier keep the monthly fee.
    if (activePlan.typeOfPlan !== "Hybrid") return false;
    const paidAt = activePlan.paidAt;
    if (!paidAt) return false;
    const paidDate = new Date(paidAt);
    if (isNaN(paidDate.getTime())) return false;
    return paidDate < FranchiseService.MONTHLY_HYBRID_PLAN_CUTOFF;
  }

  static isActivePlanAvailable(): boolean {
    const activePlan = this.getActivePlanFromLocal();
    // Require positive proof of a real subscription — an empty/stub
    // serviceFeeSubscriptionInfo object must not count as an active plan.
    if (!activePlan?.planId) {
      return false;
    }
    if (activePlan?.isActive === false) {
      return false;
    }
    if (activePlan?.status === "Expired") {
      return false;
    }
    // Expired by date even if the backend hasn't flipped status yet.
    if (activePlan?.planEndAt) {
      const endAt = new Date(activePlan.planEndAt);
      if (!isNaN(endAt.getTime()) && endAt.getTime() < Date.now()) {
        return false;
      }
    }
    if (activePlan?.usedAmount >= activePlan?.limitAmount) {
      return false;
    }
    return true;
  }

  static getPlanId(): string | null {
    const user = AuthService.getLoggedInUser();
    const activePlan = user?.serviceFeeSubscriptionInfo;
    return activePlan?.planId || null;
  }

  /**
   * Fetch platform fee statements grouped by planId
   * Adds `groupbycond: 'planId'` to params so backend returns aggregated data per plan
   */
  static async getPlanStatement(params: Record<string, any> = {}) {
    const p = { ...(params || {}), groupbyCond: "planId" };
    return AjaxService.request(
      `${API}franchise/service-fee-plan-subscription/fetch/statement`,
      "GET",
      p,
    );
  }

  static async getChargeByDeal(payload: {
    deals: Array<{
      dealId: string;
      quantity: number;
      mrp?: number;
      purchasePrice?: number;
    }>;
  }) {
    const r = await AjaxService.request(
      `${API}purchase/orders/charges/by-deal`,
      "POST",
      payload,
    );

    const availableAmount = r.data?.availableAmount || 0;
    const commissionAmount =
      (r.data?.planType === "Value"
        ? r.data?.totalItemsAmount
        : r.data?.totalCommission) || 0;

    const hasSufficientBalance = availableAmount >= commissionAmount;

    let commissionPercentage = r.data?.avgCommissionPercentage || 0;
    try {
      if (r.data?.planType === "Percentage" && Array.isArray(r.data?.data)) {
        const items: any[] = r.data.data;
        let totalValue = 0;
        let totalCommissionValue = 0;

        items.forEach((it) => {
          const qty = Number(it.quantity) || 0;
          const price = Number(it.purchasePrice ?? it.mrp) || 0;
          const perc = Number(it.commissionPercentage) || 0;
          const value = qty * price;
          totalValue += value;
          totalCommissionValue += (perc / 100) * value;
        });

        commissionPercentage =
          totalValue > 0 ? (totalCommissionValue / totalValue) * 100 : 0;
      }
    } catch (e) {
      console.error("Error computing commissionPercentage:", e);
      commissionPercentage = r.data?.avgCommissionPercentage || 0;
    }

    return {
      availableAmount,
      commissionPercentage: CommonService.roundedByDecimalPlace(
        commissionPercentage || 0,
        2,
      ),
      planName: r.data?.planName || "",
      planType: r.data?.planType || "",
      typeOfPlan: r.data?.typeOfPlan || "",
      commissionAmount,
      usedAmount: r.data?.usedAmount || 0,
      hasSufficientBalance,
    };
  }

  static formatProfileUpdateRequestLog(data: Array<Record<string, any>>) {
    if (!Array.isArray(data)) return [];

    const statusColorMap: Record<string, string> = {
      Approved: "success",
      Rejected: "danger",
      Pending: "warning",
    };

    return data.map((log) => {
      let displayType = log.type;
      let displayValue = "";

      if (displayType === "ADDRESS_UPDATE") {
        displayType = "Address Update";
      } else if (displayType === "GST_UPDATE") {
        displayType = "GST Update";
        displayValue = log.value || "";
      } else if (displayType === "PRIMARY_BUSINESS_UPDATE") {
        displayType = "Primary Business Update";
        displayValue =
          log.value?.primary_business || log.value?.primaryBusiness || "";
      } else if (displayType === "SECONDARY_BUSINESS_UPDATE") {
        displayType = "Secondary Business Update";
        displayValue =
          log.value?.secondary_business || log.value?.secondaryBusiness || "";
      } else if (displayType === "FSSAI_UPDATE") {
        displayType = "FSSAI Update";
        displayValue = log.value?.licenseNo || "";
      }

      return {
        ...log,
        displayType,
        displayValue,
        statusColor: statusColorMap[log.status] || "secondary",
      };
    });
  }

  static async getNotes(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/notes`, "GET", params);
  }

  static async createNote(params: { noteContent: string }) {
    return AjaxService.request(`${API}franchise/notes`, "POST", params);
  }

  /**
   * Submit a franchise review from the order success screen.
   * Endpoint: POST franchise/franchise-reviews
   * Payload fields are all optional except the identifiers/rating sent by the caller.
   */
  static async submitFranchiseReview(params: {
    franchiseId?: string;
    orderId?: string;
    orderNumber?: string;
    rating?: number;
    title?: string;
    comment?: string;
    images?: Array<{ url: string; caption?: string }>;
  }) {
    return AjaxService.request(
      `${API}franchise/franchise-reviews`,
      "POST",
      params,
    );
  }

  /**
   * Calculate the total payable amount for a platform fee plan.
   */
  static calculatePlanPayable(params: {
    subscriptionAmount: number;
    duration?: number;
    setupFee?: number;
    taxPercentage?: number;
    isInclusiveTax?: boolean;
  }) {
    const {
      subscriptionAmount = 0,
      duration = 1,
      setupFee = 0,
      taxPercentage = 0,
      isInclusiveTax = false,
    } = params;

    const totalSubscription = subscriptionAmount * duration;
    const gst = isInclusiveTax ? 0 : (totalSubscription * taxPercentage) / 100;
    const baseAmount = totalSubscription + setupFee;
    const total = baseAmount + gst;

    return { totalSubscription, gst, baseAmount, total };
  }

  /**
   * Link the logged-in franchise (buyer) with another franchise (seller).
   */
  static async linkFranchises(franchiseId2: string, franchiseId1?: string) {
    const currentUser = AuthService.getLoggedInUser();
    const buyerId = franchiseId1 || currentUser?._id;

    if (!buyerId) {
      throw new Error("Logged-in franchise not found");
    }

    const res = await AjaxService.request(
      "https://upg.storeking.in/apigw/api/franchise/transactions/link",
      "POST",
      { franchiseId1: buyerId, franchiseId2 },
    );

    if (res.statusCode >= 400) {
      // The gateway is inconsistent about where the reason lives — take the
      // first readable one so the caller can toast it as-is.
      const apiMessage =
        res.data?.message ||
        res.data?.msg ||
        res.data?.error?.message ||
        (typeof res.data?.error === "string" ? res.data.error : "");

      throw new Error(apiMessage || "Failed to connect");
    }

    return res.data;
  }

}

export default FranchiseService;
