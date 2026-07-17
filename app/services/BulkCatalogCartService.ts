import { API } from "~/constants";
import AjaxService from "./AjaxService";

class BulkCatalogCartService {
  static createCart(params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/bulk-catalog-cart`,
      "POST",
      params,
    );
  }

  static getCart(params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/bulk-catalog-cart`,
      "GET",
      params,
    );
  }

  static removeFromCart(cartId: string, itemId: string) {
    return AjaxService.request(
      `${API}catalog/bulk-catalog-cart/${cartId}/item/${itemId}`,
      "DELETE",
      {},
    );
  }

  static clearCart(cartId: string) {
    return AjaxService.request(
      `${API}catalog/bulk-catalog-cart/${cartId}`,
      "DELETE",
      {},
    );
  }

  static processScheme(cartId: string, payload: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/bulk-catalog-cart/${cartId}/process`,
      "POST",
      payload,
    );
  }

  static processCaseConfig(cartId: string, payload: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/bulk-catalog-cart/${cartId}/process`,
      "POST",
      payload,
    );
  }
}

export default BulkCatalogCartService;
