import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import { merge } from "lodash";
import AuthService from "./AuthService";
import StorageService from "./StorageService";

class PurchaseBasketService {
  private static LOCAL_BASKET_KEY = "purchaseBasketItems";

  static async list(params: Record<string, any> = {}) {
    const p = merge(
      {},
      {
        sort: { createdAt: -1 },
        filter: {
          franchiseId: AuthService.getLoggedInUserId(),
        },
      },
      params
    );
    return AjaxService.request(
      `${API}oms/${API_VERSION}/seller/purchase/basket`,
      "GET",
      p
    );
  }

  static async create(data: Record<string, any>) {
    const payload = {
      ...data,
      franchiseId: AuthService.getLoggedInUserId(),
    };
    return AjaxService.request(
      `${API}oms/${API_VERSION}/seller/purchase/basket`,
      "POST",
      payload
    );
  }

  static async update(id: string, data: Record<string, any>) {
    const payload = {
      ...data,
      franchiseId: AuthService.getLoggedInUserId(),
    };
    return AjaxService.request(
      `${API}oms/${API_VERSION}/seller/purchase/basket/${id}`,
      "PUT",
      payload
    );
  }

  static setLocalBasket(data: any): void {
    try {
      StorageService.set(this.LOCAL_BASKET_KEY, data);
    } catch (error) {
      console.error("Error setting local purchase basket:", error);
      throw error;
    }
  }

  static getLocalBasket(): any {
    try {
      const basket = StorageService.get(this.LOCAL_BASKET_KEY) || [];
      return Array.isArray(basket) ? basket : [];
    } catch (error) {
      console.error("Error getting local purchase basket:", error);
      return [];
    }
  }

  static clearLocalBasket(): void {
    try {
      StorageService.set(this.LOCAL_BASKET_KEY, []);
    } catch (error) {
      console.error("Error clearing local purchase basket:", error);
      throw error;
    }
  }

  static isDealInLocalBasket(dealId: string): {
    status: boolean;
    qty?: number;
  } {
    const basket = this.getLocalBasket();
    const item = basket.find((item: any) => item.id === dealId);
    if (item) {
      return { status: true, qty: item.qty };
    }
    return { status: false };
  }
}

export default PurchaseBasketService;
