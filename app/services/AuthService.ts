import { get } from "lodash";
import {
  API,
  API_VERSION,
  APP_PRIVACY_POLICY_KEY,
  APP_TERMS_KEY,
  MASTER_LOGIN_WITH_FULL_ACCESS,
} from "~/constants";
import AjaxService from "./AjaxService";
import MiscService from "./MiscService";
import { StorageService } from "./StorageService";
import type { BuyCartType } from "~/types/CommonTypes";

interface FranchiseData {
  franchiseId: string;
  _id: string;
  // Add other franchise properties as needed
}

/**
 * Service for handling authentication related operations
 */
export class AuthService {
  private static readonly FRANCHISE_KEY = "_f";
  private static readonly USER_KEY = "_u";
  private static readonly SELLER_KEY = "_s";
  private static readonly MANPOWER_KEY = "_m";

  // Holds the last used mobile number in-memory during the SPA lifecycle
  private static lastMobileNumber: string | null = null;

  /**
   * Persist a mobile number in-memory for cross-page auto-fill.
   */
  public static setLastMobileNumber(
    mobile: string | number | null | undefined,
  ) {
    if (mobile === null || mobile === undefined) {
      this.lastMobileNumber = null;
      return;
    }
    this.lastMobileNumber = ("" + mobile).trim();
  }

  /**
   * Retrieve the previously stored mobile number, or empty string.
   */
  public static getLastMobileNumber(): string {
    return this.lastMobileNumber || "";
  }

  public static doLogin(params: any) {
    return AjaxService.request(`${API}user/auth/login`, "POST", params);
  }

  public static verifyOtpLogin(params: any) {
    return AjaxService.request(
      `${API}user/auth/verify/otp/login`,
      "POST",
      params,
    );
  }

  public static generateForceLoginOtp(id: string, params: any) {
    return AjaxService.request(
      `${API}/user/${API_VERSION}/forcelogoutotpgenerate/${id}`,
      "POST",
      params,
    );
  }

  public static resendForceLoginOtp(params: any) {
    return AjaxService.request(
      `${API}/user/${API_VERSION}/forcelogoutotpresend`,
      "POST",
      params,
    );
  }

  static isUserLoggedIn() {
    if (this.loggedInUserIsSeller() && !this.getLoggedInUserId()) {
      return true;
    }

    const user = this.getLoggedInUser();
    if (user && user.isGuestUser) {
      return false;
    }

    if (!user || !user._id) {
      return false;
    } else {
      return true;
    }
  }

  static getLoggedInUserId(useFid?: boolean) {
    if (this.isManpowerLoggedIn()) {
      return this.getManpower()?.franchiseInfo?.id;
    }

    if (this.isAliasLogin()) {
      return StorageService.get("fid");
    } else {
      return useFid
        ? this.getLoggedInUser().franchiseId
        : this.getLoggedInUser()?._id;
    }
  }

  static getLoggedInUserTokenId() {
    return MiscService.decodeJwt(this.getLoggedInToken())._id || "";
  }

  loggedInUserIsSeller() {
    try {
      const u = StorageService.get("_u") || {};
      return u.userType == "Seller" ? true : false;
    } catch (e) {
      return false;
    }
  }

  getLoggedInUser() {
    try {
      return StorageService.get("_f") || {};
    } catch (e) {
      return {};
    }
  }

  public static setloggedInUser(user: any) {
    StorageService.set("_f", user);
  }

  static isAliasLogin() {
    const t = this.getLoggedInToken();
    const u = MiscService.decodeJwt(t);
    return u.loginPlatform == "EMP_ADMIN" ? true : false;
  }

  getLoggedInToken(prefix = "") {
    try {
      return prefix + (StorageService.get("_t") || "");
    } catch (e) {
      return "";
    }
  }

  public static isLoggedIn(): boolean {
    return this.getLoggedInUserId() ? true : false;
  }

  static getLoggedInSellerInfo() {
    return StorageService.get(this.SELLER_KEY) || {};
  }

  static loggedInUserIsSeller() {
    try {
      const u = this.getLoggedInUser();
      return u.subType === "SFSELLER";
    } catch (e) {
      return false;
    }
  }

  static getStoredLoginResp() {
    return StorageService.get(this.USER_KEY) || {};
  }

  static getLoggedInUser() {
    return StorageService.get(this.FRANCHISE_KEY) || {};
  }

  static getLoggedInSellerId() {
    const s = this.getLoggedInSellerInfo();
    let sellerId = "";
    if (0 && this.loggedInUserIsSeller()) {
      const loginResp = this.getStoredLoginResp();
      sellerId = loginResp.sellerId || "";
    } else {
      const loggedInUser = this.getLoggedInUser();
      sellerId =
        loggedInUser.sk_franchise_details &&
        loggedInUser.sk_franchise_details.linkedSellerId
          ? loggedInUser.sk_franchise_details.linkedSellerId
          : "";
    }
    return sellerId || s._id || "";
  }

  static getLoggedInToken() {
    return StorageService.get<string>("_t") || "";
  }

  static isSfSeller(): boolean {
    try {
      const loggedInSeller = this.getLoggedInUser();
      return (
        loggedInSeller.subType === "SFSELLER" &&
        loggedInSeller.networkType !== "SKSELLER" &&
        loggedInSeller.networkType !== "SKBUYER"
      );
    } catch (error) {
      console.error("Error determining if seller is SF Seller:", error);
      return false;
    }
  }

  static isSkBuyer(): boolean {
    try {
      const loggedInSeller = this.getLoggedInUser();
      return loggedInSeller.networkType === "SKBUYER" ? true : false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns true if the currently stored user (in `_u`) is a Manpower type.
   */
  static isManpowerLoggedIn(): boolean {
    try {
      const u = StorageService.get<{ type?: string }>(this.USER_KEY) || {};
      return u.type === "Manpower";
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns the manpower details stored under `_m` in storage, or null if not present.
   */
  static getManpower<T = any>(): T | null {
    try {
      return StorageService.get<T>(this.MANPOWER_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Returns true if the logged in manpower user has position "Sales Employee".
   */
  static isSalesEmployeeLoggedIn(): boolean {
    try {
      if (!this.isManpowerLoggedIn()) return false;
      const manpower = this.getManpower<{ position?: string }>();
      return manpower?.position === "Sales Employee";
    } catch (e) {
      return false;
    }
  }

  /**
   * Returns the latitude and longitude of the logged in user, if available.
   *
   * @returns {{ lat: number; lng: number } | null}
   */
  public static getLoggedInUserLatLng(): { lat: number; lng: number } | null {
    const user = this.getLoggedInUser();
    const coords = get(user, "geoLocation.coordinates", []);
    if (Array.isArray(coords) && coords.length >= 2) {
      return {
        lat: coords[1],
        lng: coords[0],
      };
    }
    return null;
  }

  static isLoggedInAsGuest() {
    const u = this.getLoggedInUser();
    return u.isGuestUser === true ? true : false;
  }

  static setLoggedInUserId(id: string) {
    StorageService.set("fid", id);
    return this.getLoggedInUserId();
  }

  static setLoggedInToken(t: string) {
    StorageService.set("_t", t);
  }

  static isBuyerUser(): boolean {
    try {
      const franchiseSubType = get(this.getLoggedInUser(), "subType", "");
      return franchiseSubType === "SFBUYER" || this.isSkBuyer();
    } catch (error) {
      console.error("Error determining if user is Buyer:", error);
      return false;
    }
  }

  /**
   * Returns the cart type based on whether the user is a buyer.
   */
  static getCartType(): BuyCartType {
    return this.isBuyerUser() ? "buyer" : "normal";
  }

  guestLocalStorageHandler(data: any) {
    AuthService.setLoggedInUserId(data.refId);
    AuthService.setLoggedInToken(data.token);
    StorageService.set("_f", {
      district: data.district,
      isGuestUser: data.isGuestUser,
      _id: data.refId,
      services: data.services,
      state: data.state,
      town: data.town,
      pincode: data.pincode,
      sk_franchise_details: data.sk_franchise_details,
    });
  }

  /**
   * Logs in a guest user based on pincode.
   *
   * @param pincode - The pincode to login with
   * @param callback - Callback with status and data or error
   */
  static async doLoginOnPincode(pincode: string | number) {
    return await AjaxService.request(
      `${API}/franchise/${API_VERSION}/fetchSessionToken/pincode/${pincode}`,
      "GET",
    );
  }

  static clearLoggedInUser() {
    StorageService.remove("_f");
    StorageService.remove("_t");
    StorageService.remove("_u");
    StorageService.remove("_s");
    StorageService.remove("fid");
    StorageService.remove("subscart");
  }

  static doLogout(id: string, params?: any) {
    return AjaxService.request(`${API}user/auth/logout`, "POST", params || {});
  }

  static getUserAccountId() {
    const user = this.getLoggedInUser();
    return user.accountId || user.acList?.[0] || "";
  }

  static verifyOtpForgotPassword(params: any) {
    return AjaxService.request(
      `${API}/user/${API_VERSION}/verifyforgotpasswordOtp`,
      "POST",
      params,
    );
  }

  static verifyOtpForgotPasswordv2(params: any) {
    return AjaxService.request(
      `${API}/notification/api/otp/verify`,
      "POST",
      params,
    );
  }

  static resendOtp(params: any) {
    return AjaxService.request(`${API}/user/auth/resend/otp`, "POST", params);
  }

  static forgotPassword(params: any) {
    return AjaxService.request(
      `${API}/user/auth/forgot/password`,
      "POST",
      params,
    );
  }

  static changePassword(mobile: string, params?: any) {
    return AjaxService.request(
      `${API}/user/${API_VERSION}/changePassword/${mobile}`,
      "POST",
      params,
    );
  }

  static franchiseChangePassword(params: {
    newPassword: string;
    confirmNewPassword: string;
    username: string;
  }) {
    return AjaxService.request(
      `${API}user/auth/franchise/changePassword`,
      "POST",
      params,
    );
  }

  static getLoggedInFranchiseDetails() {
    return AjaxService.request(`${API}franchise/profile`, "GET");
  }

  static getLoggedInTokenId() {
    return MiscService.decodeJwt(this.getLoggedInToken())._id || "";
  }

  static verifyManpowerOtp(manpowerId: string, params: any) {
    return AjaxService.request(
      `${API}/franchise/manpower/${manpowerId}/verify/otp`,
      "POST",
      params,
    );
  }

  static resendManpowerOtp(manpowerId: string, params: any) {
    return AjaxService.request(
      `${API}/franchise/manpower/${manpowerId}/resend/otp`,
      "POST",
      params,
    );
  }

  static async validateNumber(mobileNo: string) {
    let isManpower = false;
    let isFranchise = false;
    let notFound = false;

    const resp = await AjaxService.request(
      `${API}user/users/franchise/validate-mobile/${mobileNo}?userTypes=Franchise,Manpower`,
      "GET",
    );
    const type = resp?.data?.data?.type || "";
    if (type === "Manpower") {
      isManpower = true;
    } else if (type === "Franchise") {
      isFranchise = true;
    } else {
      notFound = true;
    }

    const data = resp?.data?.data || {};

    return {
      statusCode: resp.statusCode,
      data: {
        isManpower,
        isFranchise,
        hasAccount:
          typeof data?.hasAccount === "boolean" ? data?.hasAccount : null,
        notFound,
        enableNewPlatformMigration: data?.enableNewPlatformMigration || false,
        readyToMigrateToNewPlatform: data?.readyToMigrateToNewPlatform || false,
        franchise: {
          name: data?.name || "",
          franchiseId: data?.franchiseId || "",
        },
        message: resp?.data?.message || "",
      },
    };
  }

  static isRbacEnabled(roles: string[]) {
    let userRoles = [];
    if (AuthService.isManpowerLoggedIn()) {
      const manpower = this.getManpower();
      userRoles = (manpower.features || []).map(
        (feature: any) => feature.module + "." + feature.code,
      );
    }
    if (userRoles.length === 0) {
      return true;
    }
    return roles.some((role) => userRoles.includes(role));
  }

  static userAgreedTerms() {
    const user = this.getLoggedInUser();
    return (user?.termAndConditions || []).find(
      (t: any) => t.code === APP_TERMS_KEY,
    );
  }

  static userAgreedPrivacyPolicy() {
    const user = this.getLoggedInUser();
    return (user?.termAndConditions || []).find(
      (t: any) => t.code === APP_PRIVACY_POLICY_KEY,
    );
  }

  static isFranchiseProfileComplete(): {
    status: boolean;
    missingFields: Array<Record<string, any>>;
  } {
    const user = this.getLoggedInUser();

    let missingFields: Array<Record<string, any>> = [];

    // Check if store location (lat/lng) is available
    const loc = this.getLoggedInUserLatLng();
    if (!loc) {
      missingFields.push({
        name: "Store location is required",
        key: "store.location",
        msg: "Please update your store location on the map",
      });
    }

    if (!this.userAgreedTerms() || !this.userAgreedPrivacyPolicy()) {
      missingFields.push({
        name: "Terms and Conditions are required",
        key: "termsAndCondition",
        msg: "Please accept the terms and conditions",
      });
      return {
        status: false,
        missingFields,
      };
    }

    try {
      if (user?.declaration?.acceptedAt && missingFields.length === 0) {
        return { status: true, missingFields: [] };
      }
    } catch (e) {
      // ignore and continue with normal checks
    }

    // If declaration is submitted, skip document checks
    if (user?.declaration?.acceptedAt) {
      return {
        status: missingFields.length === 0 ? true : false,
        missingFields,
      };
    }

    const businessDoc = user?.documents?.business || [];
    const photoDoc = user?.documents?.photo || [];
    const addressDoc = user?.documents?.address || [];

    // Document status keys used by the document upload modal
    const PHOTO_STATUS_KEY = "photoIdStatus";
    const BUSINESS_STATUS_KEY = "businessIDStatus";
    const ADDRESS_STATUS_KEY = "addressProofIdStatus";

    // Helper to determine if any entry in docs is approved
    const hasApproved = (docs: any[], statusKey: string) => {
      if (!Array.isArray(docs) || docs.length === 0) return false;
      return docs.some((d: any) => d && d[statusKey] === "Approved");
    };

    // If any one of address, business or photo is approved, consider profile doc-validated
    const anyApproved =
      hasApproved(photoDoc, PHOTO_STATUS_KEY) ||
      hasApproved(businessDoc, BUSINESS_STATUS_KEY) ||
      hasApproved(addressDoc, ADDRESS_STATUS_KEY);

    // If there is at least one approved document, we're good (no missingFields related to documents)
    if (!anyApproved) {
      // If there are no documents uploaded at all (all three empty) and declaration not accepted -> explicit message
      const noDocumentsAtAll =
        (!Array.isArray(photoDoc) || photoDoc.length === 0) &&
        (!Array.isArray(businessDoc) || businessDoc.length === 0) &&
        (!Array.isArray(addressDoc) || addressDoc.length === 0);

      // When no documents exist at all and declaration isn't accepted, show only the combined instruction
      if (noDocumentsAtAll) {
        missingFields.push({
          name: "Either upload documents or submit the declaration form",
          key: "documents.or.declaration",
          msg: "Please upload at least one document (ID/Business/Address) or submit the declaration form to complete your profile",
        });
      } else {
        // For each doc-type, if none uploaded -> request upload, else if uploaded but not approved -> show awaiting message

        if (!Array.isArray(photoDoc) || photoDoc.length === 0) {
          missingFields.push({
            name: "ID Proof is required",
            key: "documents.photo",
          });
        } else if (!hasApproved(photoDoc, PHOTO_STATUS_KEY)) {
          missingFields.push({
            name: "ID Proof (uploaded - awaiting approval)",
            key: "documents.photo",
            msg: "Your ID proof is under review",
          });
        }

        if (!Array.isArray(businessDoc) || businessDoc.length === 0) {
          missingFields.push({
            name: "Business Proof is required",
            key: "documents.business",
          });
        } else if (!hasApproved(businessDoc, BUSINESS_STATUS_KEY)) {
          missingFields.push({
            name: "Business Proof (uploaded - awaiting approval)",
            key: "documents.business",
            msg: "Your business proof is under review",
          });
        }

        if (!Array.isArray(addressDoc) || addressDoc.length === 0) {
          missingFields.push({
            name: "Address Proof is required",
            key: "documents.address",
          });
        } else if (!hasApproved(addressDoc, ADDRESS_STATUS_KEY)) {
          missingFields.push({
            name: "Address Proof (uploaded - awaiting approval)",
            key: "documents.address",
            msg: "Your address proof is under review",
          });
        }
      }
    }

    return {
      status: missingFields.length === 0 ? true : false,
      missingFields,
    };
  }

  static hasSubscribedToAnyDeal(): boolean {
    const user = this.getLoggedInUser();
    // return user?.analytics?.totalSubscribedDeals > 0 ? true : false;
    return true;
  }

  /**
   * Returns true if the logged in user's networkType is SKSELLER
   */
  static isSkSeller(): boolean {
    try {
      const user = this.getLoggedInUser();
      const networkType = get(user, "networkType", "");
      return networkType === "SKSELLER";
    } catch (error) {
      console.error("Error determining if user is SK Seller:", error);
      return false;
    }
  }

  static isSkRetailer(): boolean {
    const user = this.getLoggedInUser();
    return user?.networkType === "SKRETAILER";
  }

  static hasLinkedSeller() {
    const user = this.getLoggedInUser();
    return user?.linkedFranchise?._id ? true : false;
  }

  static masterLogin(): string {
    const url = `${API}user/auth/google/employee`;
    try {
      if (typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch (e) {
      // If navigation fails for some reason, still return the URL so callers can handle it
      console.error("Error navigating to master login url:", e);
    }
    return url;
  }

  /**
   * Returns true when the stored JWT token belongs to a master user.
   * Reuses the same decode/check logic as `AjaxService`.
   */
  static isMasterLogin(): boolean {
    try {
      const hasEmpToken = StorageService.get("_et") ? true : false;
      if (hasEmpToken) {
        return true;
      }

      const t = this.getLoggedInToken();
      if (!t) {
        return false;
      }

      const decoded = MiscService.decodeJwt(t);
      const isMaster =
        decoded.isMasterUser === true || decoded.isMasterUser === "true";

      return isMaster;
    } catch (e) {
      return false;
    }
  }

  static isMasterLoginWithFullAccess(): boolean {
    const masterEmployee = this.getLoggedMasterEmployee();
    return MASTER_LOGIN_WITH_FULL_ACCESS.includes(masterEmployee?.email || "");
  }

  /**
   * Decode the master employee token (`_et`) and return the masterEmployeeDetails
   * object if present. Shape: { name, email, mobile }
   */
  static getLoggedMasterEmployee() {
    try {
      const t = StorageService.get<string>("_et") || "";
      if (!t) return null;
      const decoded = MiscService.decodeJwt(t) || {};
      return decoded || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Clear the master employee token from storage (used for master logout)
   */
  static logoutMasterLogin() {
    try {
      StorageService.remove("_et");
      StorageService.remove("fid");
      StorageService.remove("_f");
      StorageService.remove("_t");
      StorageService.remove("_u");
      StorageService.remove("_s");
      StorageService.remove("_m");
      StorageService.remove("subscart");
    } catch (e) {
      // ignore
    }
  }

  static getLinkedSeller() {
    const user = this.getLoggedInUser();
    return user?.linkedFranchise || {};
  }

  static isFeatureIntroCompleted(feature: string) {
    return StorageService.get("fint-" + feature) ? true : false;
  }

  static isPaylaterEnabled() {
    return true;
  }

  static canHandleB2b() {
    return true;
  }

  static getLoggedInUserType() {
    const user = this.getLoggedInUser();
    const subType = user?.subType || "";
    const networkType = user?.networkType || "";

    if (networkType === "SKRETAILER") {
      return "SKRETAILER";
    } else if (networkType === "SKSELLER") {
      return "SKSELLER";
    } else if (networkType === "SKBUYER") {
      return "SKBUYER";
    } else if (subType === "SFBUYER") {
      return "SKRETAILER";
    } else if (subType === "SFSELLER") {
      return "SKRETAILER";
    } else {
      return "SFSELLER";
    }
  }

  static canHandleB2B(): boolean {
    try {
      const user: any = this.getLoggedInUser() || {};

      const networkType = user.networkType || "";
      if (
        networkType === "SKSELLER" ||
        networkType === "SKBUYER" ||
        networkType === "SKRETAILER"
      ) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  static async verifyToken(hash: string) {
    return await AjaxService.request(
      `${API}/franchise/whatsapp/verify-franchise-login-hash`,
      "POST",
      {
        loginHash: hash,
      },
    );
  }

  static getLoggedInUserPrimaryBusiness() {
    const user = this.getLoggedInUser();
    return {
      name: user?.primaryBusiness || "",
      id: user?.primaryBusinessId || "",
    };
  }

  static getLoggedInUserSecondaryBusiness() {
    const user = this.getLoggedInUser();
    return {
      name: user?.secondaryBusiness || "",
      id: user?.secondaryBusinessId || "",
    };
  }

  static isSkMasterLoggedIn() {
    const user = this.getLoggedInUser();
    return user?.networkType === "SKMASTER" ? true : false;
  }

  // Competitor pricing (Amazon/Flipkart benchmarks) is only relevant for
  // electronics franchises, identified by the "Electronics" keyword in their
  // primary business (e.g. "Electronics & Appliances").
  static isElectronicsFranchise() {
    const { name } = this.getLoggedInUserPrimaryBusiness();
    return name.toLowerCase().includes("electronics");
  }
}

export default AuthService;
