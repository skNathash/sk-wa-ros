import { API } from "~/constants";
import AjaxService from "./AjaxService";

export interface PurchaseCartItemPayload {
  dealId: string;
  dealName?: string;
  productId?: string;
  productName?: string;
  quantity: number;
  mrp?: number;
  purchasePrice?: number;
  tax?: number;
  uom?: string;
  hsn?: string;
  remarks?: string;
}

export interface CreatePurchaseCartPayload {
  vendorId: string;
  items?: PurchaseCartItemPayload[];
  remarks?: string;
  source?: string;
}

export interface UpdatePurchaseCartPayload {
  vendorId?: string;
  remarks?: string;
  expectedDeliveryDate?: string;
  source?: string;
  status?: "Active" | "Inactive" | "Converted";
  isActive?: boolean;
  items?: PurchaseCartItemPayload[];
}

export interface ListPurchaseCartsParams {
  vendorId?: string;
  orderId?: string;
  status?: "Active" | "Inactive" | "Converted";
  isReorder?: boolean;
  mine?: boolean;
  page?: number;
  limit?: number;
  sort?: Record<string, number>;
}

export interface GetActivePurchaseCartParams {
  vendorId?: string;
  mine?: boolean;
}

export interface UpdatePurchaseCartItemPayload {
  quantity?: number;
  purchasePrice?: number;
  mrp?: number;
  tax?: number;
  remarks?: string;
}

export interface AddItemOrCreateCartPayload extends PurchaseCartItemPayload {
  vendorId: string;
  remarks?: string;
  source?: string;
}

/**
 * Service for purchase cart API calls (purchase service, mounted at /carts).
 * The cart holds a draft purchase order while it is being assembled.
 */
class PurchaseCartService {
  private static readonly BASE_URL = `${API}purchase/carts`;

  /**
   * Create a cart or merge items into the caller's existing active cart
   * for the same franchise + vendor.
   * Returns 201 for a new cart, or 200 with isNewCart:false on merge.
   */
  static create(data: CreatePurchaseCartPayload) {
    return AjaxService.request(`${this.BASE_URL}`, "POST", data);
  }

  /**
   * List carts scoped to the franchise on the JWT token.
   */
  static list(params: ListPurchaseCartsParams = {}) {
    return AjaxService.request(`${this.BASE_URL}`, "GET", params);
  }

  /**
   * Get the active cart for the caller. Returns data:null (HTTP 200) when none exists.
   */
  static getActive(params: GetActivePurchaseCartParams = {}) {
    return AjaxService.request(`${this.BASE_URL}/active`, "GET", params);
  }

  /**
   * Fetch a single cart by id.
   */
  static getById(cartId: string) {
    return AjaxService.request(`${this.BASE_URL}/${cartId}`, "GET");
  }

  /**
   * Update cart metadata. Passing items replaces the entire line-item list.
   */
  static update(cartId: string, data: UpdatePurchaseCartPayload) {
    return AjaxService.request(`${this.BASE_URL}/${cartId}`, "PUT", data);
  }

  /**
   * Add or replace a line item (same dealId replaces rather than increments).
   */
  static addItem(cartId: string, item: PurchaseCartItemPayload) {
    return AjaxService.request(
      `${this.BASE_URL}/${cartId}/items`,
      "POST",
      item,
    );
  }

  /**
   * Update a line item. quantity 0 removes the line.
   */
  static updateItem(
    cartId: string,
    dealId: string,
    data: UpdatePurchaseCartItemPayload,
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/${cartId}/items/${dealId}`,
      "PUT",
      data,
    );
  }

  /**
   * Remove a single line item from the cart.
   */
  static removeItem(cartId: string, dealId: string) {
    return AjaxService.request(
      `${this.BASE_URL}/${cartId}/items/${dealId}`,
      "DELETE",
    );
  }

  /**
   * Remove all line items but keep the cart itself.
   */
  static clearItems(cartId: string) {
    return AjaxService.request(`${this.BASE_URL}/${cartId}/items`, "DELETE");
  }

  /**
   * Mark cart as converted after a purchase order has been created.
   */
  static markConverted(cartId: string, orderId: string) {
    return AjaxService.request(
      `${this.BASE_URL}/${cartId}/converted`,
      "PATCH",
      { orderId },
    );
  }

  /**
   * Add an item to the active cart for a vendor, or create a new cart when none exists.
   * Looks up the cart via GET /carts/active?vendorId=... before deciding.
   */
  static async addItemOrCreate(payload: AddItemOrCreateCartPayload) {
    const { vendorId, remarks, source, ...item } = payload;

    const activeResp = await this.getActive({ vendorId, mine: true });

    const activeCart =
      activeResp.statusCode === 200 ? activeResp.data?.data : null;

    if (activeCart?._id) {
      return this.addItem(activeCart._id, item);
    }

    return this.create({
      vendorId,
      items: [item],
      remarks,
      source,
    });
  }

  /**
   * Remove a line item from the caller's active cart for a vendor.
   * Looks up the cart via GET /carts/active?vendorId=... first.
   */
  static async removeItemFromActive(vendorId: string, dealId: string) {
    const activeResp = await this.getActive({ vendorId, mine: true });
    const activeCart =
      activeResp.statusCode === 200 ? activeResp.data?.data : null;

    if (!activeCart?._id) {
      return {
        statusCode: 404,
        data: { message: "No active cart found" },
      };
    }

    return this.removeItem(activeCart._id, dealId);
  }

  /**
   * Soft-delete a cart (status becomes Inactive, deleted:true).
   */
  static destroy(cartId: string) {
    return AjaxService.request(`${this.BASE_URL}/${cartId}`, "DELETE");
  }
}

export default PurchaseCartService;
