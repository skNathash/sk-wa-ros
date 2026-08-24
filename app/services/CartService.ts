import { API, API_VERSION, EVENTS, OLD_API } from "~/constants";
import AjaxService from "./AjaxService";
import StorageService from "./StorageService";
import CommonService from "./CommonService";
import AuthService from "./AuthService";
import MiscService from "./MiscService";

export default class CartService {
  private static CART_KEY = "cartItems";

  static tmpCartData: { cartId: string; items: Array<any> } = {
    cartId: "",
    items: [],
  };

  static setTmpCartData(cartId: string, data: any[]) {
    this.tmpCartData.cartId = cartId;
    this.tmpCartData.items = data;
  }

  static triggerCartAddedEvent(
    dealId: string,
    qty: number,
    sellerId?: string,
  ): void {
    MiscService.createEvent(EVENTS.CART_ITEM_ADDED, { dealId, qty, sellerId });
  }

  static triggerCartRemovedEvent(dealId: string, sellerId?: string): void {
    MiscService.createEvent(EVENTS.CART_ITEM_REMOVED, { dealId, sellerId });
  }

  /**
   * Local cart entries are scoped per seller: the same catalog deal can sit in
   * several sellers' carts at once, so the deal id alone is not a unique key.
   * The own (non buy-from-other-retailer) cart uses the empty scope.
   */
  private static cartScope(sellerId?: string | null): string {
    return sellerId ? String(sellerId) : "";
  }

  /**
   * Adds or updates an item in the cart
   * @param dealId - The ID of the deal to add
   * @param qty - Quantity to add/update
   * @param sellerId - Seller the deal is bought from, for buy-from-other-retailer
   */
  public static addToCartLocal(
    dealId: string,
    qty: number,
    sellerId?: string,
  ): void {
    try {
      const scope = this.cartScope(sellerId);
      const cart = this.getCart();
      const existingItemIndex = cart.findIndex(
        (item) => item.id === dealId && this.cartScope(item.sellerId) === scope,
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        cart[existingItemIndex].qty = qty;
      } else {
        // Add new item
        cart.push({ id: dealId, qty, ...(scope ? { sellerId: scope } : {}) });
      }

      StorageService.set(this.CART_KEY, cart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  /**
   * Removes an item from the cart
   * @param dealId - The ID of the deal to remove
   * @param sellerId - Seller the deal was bought from, for buy-from-other-retailer
   */
  public static removeFromCart(dealId: string, sellerId?: string): void {
    try {
      const scope = this.cartScope(sellerId);
      const cart = this.getCart();
      const updatedCart = cart.filter(
        (item) =>
          !(item.id === dealId && this.cartScope(item.sellerId) === scope),
      );
      StorageService.set(this.CART_KEY, updatedCart);
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  /**
   * Gets the current cart items
   * @returns Array of cart items [{id, qty}]
   */
  public static getCart(): { id: string; qty: number; sellerId?: string }[] {
    try {
      const cart = StorageService.get(this.CART_KEY) || [];
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      console.error("Error getting cart:", error);
      return [];
    }
  }

  public static getDealFromTmpCart(dealId: string) {
    try {
      const items = this.tmpCartData?.items || [];
      const item = items.find((it: any) => {
        return it?.deal?.id === dealId;
      });

      if (item) {
        const quantity = Number(item.quantity) || 0;
        return { found: true, quantity, item };
      }

      return { found: false, quantity: 0, item: null };
    } catch (e) {
      return { found: false, quantity: 0, item: null };
    }
  }

  public static getLocalCartCount(): { value: number } {
    const cart = this.getCart();
    return { value: cart.length };
  }

  /**
   * Checks if a deal is in the cart
   * @param dealId - The ID of the deal to check
   * @param sellerId - Seller to check against, for buy-from-other-retailer
   * @returns Object with status and qty if found, otherwise null
   */
  public static isDealInCart(
    dealId: string,
    sellerId?: string,
  ): { status: boolean; qty?: number } | null {
    const scope = this.cartScope(sellerId);
    const cart = this.getCart();
    const item = cart.find(
      (item) => item.id === dealId && this.cartScope(item.sellerId) === scope,
    );
    if (item && item.qty > 0) {
      return { status: true, qty: item.qty };
    }
    return { status: false };
  }

  /**
   * Clears the entire cart locally
   */
  public static clearCartLocal(): void {
    try {
      StorageService.set(this.CART_KEY, []);
    } catch (error) {
      console.error("Error clearing cart locally:", error);
      throw error;
    }
  }

  /**
   * Fetches detailed cart information from the server including seller and deal details
   * @param params - Parameters for the cart request
   * @returns Promise containing cart details including summary information
   */
  public static async fetchCartDetails(params: Record<string, any>) {
    const res = await AjaxService.request(
      `${OLD_API}oms/${API_VERSION}/order/cart`,
      "GET",
      params,
    );

    if (res.statusCode == 200 && res.data?.sellers?.length > 0) {
      let totalMrp = 0;
      let totalSavings = 0;
      let savingsPercentage = 0;

      res.data.sellers.forEach((seller: any) => {
        seller.deals.forEach((deal: any) => {
          totalMrp += deal.mrp * deal.quantity;
        });
      });

      totalSavings = totalMrp - res.data.value;
      savingsPercentage = CommonService.calculateDiscount(
        totalMrp,
        res.data.value,
      );

      res.data.summary = {
        totalMRP: totalMrp,
        subTotal: res.data.value || 0,
        totalDiscount: savingsPercentage, // Use percentage value
        totalAmountBeforeTax: res.data.totalAmountBeforeTax || 0,
        savings: totalSavings,
        savingsPercentage,
      };
    }

    return res;
  }

  /**
   * Removes an item from the cart using API
   * @param apiParams - Parameters for the API request
   */
  public static async remove(apiParams?: {
    type?: string;
    id?: string;
    did?: string;
    fulfilledBy?: string;
    whId?: string;
    onFlyGroupId?: string;
  }) {
    let url = `${OLD_API}oms/${API_VERSION}/order/cart`;
    if (apiParams?.type) url += `?type=${apiParams.type}`;
    if (apiParams?.id) url += `&id=${apiParams.id}`;
    if (apiParams?.fulfilledBy) url += `&fulfilledBy=${apiParams.fulfilledBy}`;
    if (apiParams?.did) url += `&did=${apiParams.did}`;
    if (apiParams?.whId) url += `&whId=${apiParams.whId}`;
    if (apiParams?.onFlyGroupId)
      url += `&onFlyGroupId=${apiParams.onFlyGroupId}`;

    return AjaxService.request(url, "DELETE");
  }

  /**
   * Clears the cart using API
   * @param id - The ID of the cart to clear
   * @param type - The type of the cart
   * @param processType - Optional process type
   * @param options - Optional options for clearing the cart
   */
  public static async clearCart(
    id: string,
    type: string,
    processType?: string,
    options?: { removeAllOutofStock: boolean },
  ) {
    let params = `?type=${type}&id=${id}`;
    if (processType) {
      params += `&processType=${processType}`;
    }
    if (options?.removeAllOutofStock) {
      params += `&clearType=outOfStock`;
    }
    return AjaxService.request(
      `${OLD_API}oms/${API_VERSION}/order/deleteCart${params}`,
      "DELETE",
    );
  }

  public static async addToCart(
    type: string,
    id: string,
    params: Record<string, any>,
  ) {
    const response = await AjaxService.request(
      `${OLD_API}oms/${API_VERSION}/order/cart?type=${type}&id=${id}`,
      "POST",
      params,
    );
    return response;
  }

  /**
   * Updates the COD preference for the cart
   * @param params - Parameters for the COD preference update
   * @returns Promise containing the response from the server
   */
  public static async updateCodPreference(params: Record<string, any>) {
    return AjaxService.request(
      `${API}oms/${API_VERSION}/order/cart/UpdateCodPreference`,
      "POST",
      params || {},
    );
  }

  public static async initiatePayment(
    id: string,
    useWallet: boolean,
    apiParams: Record<string, any>,
    transType: string = "transId",
    retryPayment: boolean = false,
    queryParams?: Record<string, any>,
  ) {
    let url = `${OLD_API}oms/${API_VERSION}/order/${id}/initiatePayment`;
    url += `?useWallet=${useWallet}`;
    url += `&transType=${transType}`;
    url += `&retryPayment=${retryPayment}`;
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url += `&${key}=${value}`;
      });
    }
    return AjaxService.request(url, "POST", apiParams || {});
  }

  public static async checkout(
    type: string,
    id: string,
    apiParams?: Record<string, any>,
    queryParams: Record<string, any> = {},
  ) {
    let queryString = `type=${type}&id=${id}`;
    Object.entries(queryParams).forEach(([key, value]) => {
      queryString += `&${key}=${value}`;
    });

    const url = `${OLD_API}oms/${API_VERSION}/order/cart/checkout?${queryString}`;
    return AjaxService.request(url, "POST", apiParams || {});
  }

  static checkoutErrorHandler(err: any) {
    try {
      const e = err.error;
      const msg = [];
      if (e.message) {
        msg.push(e.message);
      } else {
        //handling error message deal out of stock
        Object.values(e).forEach((v: any) => {
          msg.push(v.message);
        });
      }
      return msg;
    } catch (e) {
      return [];
    }
  }

  static prepareInitiateParams(payingBy: string, moduleType: string) {
    const fran = AuthService.getLoggedInUser();
    const pincode = fran.pincode.toString();
    const params: any = {
      paymentMode: payingBy === "advanceBalance" ? "Cash" : "Online",
      billingAddress: {
        line1: fran.address?.line1 || fran.addressLine1 || "",
        line2: fran.address?.line2 || fran.addressLine2 || "",
        landmark: fran.address?.landmark || fran.landmark || "",
        city: fran.city || "",
        district: fran.district || "",
        state: fran.state || "",
        pincode: pincode,
      },
      transType: moduleType === "unConfirmedOrder" ? "retryPayment" : "transId",
    };

    if (payingBy === "cod") {
      const u = AuthService.getLoggedInUser();
      params.walletType = "creditWallet";
      params.partnerId = u.secondaryAccounts[0]?.partnerId;
    }

    return params;
  }

  static async getMyCart(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}sales/cart`, "GET", params);
  }

  public static async deleteMyCart(id: string) {
    const url = `${API}sales/cart/${id}/clear`;
    return AjaxService.request(url, "DELETE");
  }

  public static async checkoutMyCart(params: Record<string, any> = {}) {
    const url = `${API}sales/cart/checkout`;
    return AjaxService.request(url, "POST", params);
  }
  /**
   * Generate OTP for a cart
   * POST /sales/cart/{cartId}/otp/generate
   */
  public static async generateOtp(
    cartId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${API}sales/cart/${cartId}/otp/generate`;
    return AjaxService.request(url, "POST", params || {});
  }

  /**
   * Verify OTP for a cart
   * POST /sales/cart/{cartId}/otp/verify
   */
  public static async verifyOtp(
    cartId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${API}sales/cart/${cartId}/otp/verify`;
    return AjaxService.request(url, "POST", params || {});
  }

  /**
   * Resend OTP for a cart
   * POST /sales/cart/{cartId}/otp/resend
   */
  public static async resendOtp(
    cartId: string,
    params: Record<string, any> = {},
  ) {
    const url = `${API}sales/cart/${cartId}/otp/resend`;
    return AjaxService.request(url, "POST", params || {});
  }

  static getNetworkMultiCarts() {
    return AjaxService.request(`${API}sales/cart/multi-carts`, "GET");
  }

  static bulkNetworkCheckout(cartPayloads: { cartId: string }[], user: any) {
    const address = {
      landmark: user.landmark || "",
      city: user.city || "",
      district: user.district || "",
      state: user.state || "",
      pincode: user.pincode || "",
      line1: user.addressLine1 || "",
      line2: user.addressLine2 || "",
    };

    const payload = {
      orderData: {
        shippingAddress: address,
        billingAddress: address,
        paymentType: "COD",
      },
      cartPayloads,
    };

    return AjaxService.request(
      `${API}sales/cart/bulk-checkout`,
      "POST",
      payload,
    );
  }

  /**
   * Clears multiple carts using bulk API
   * POST /sales/clear/bulk
   * @param cartIds - Array of cart IDs to clear
   */
  static async clearBulkCart(cartIds: string[]) {
    const payload = {
      cartIds,
    };

    return AjaxService.request(`${API}sales/cart/clear/bulk`, "POST", payload);
  }
}
