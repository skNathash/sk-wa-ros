import { API } from "~/constants";
import AjaxService from "./AjaxService";

class PriceSlabService {
  /**
   * Create a new price slab configuration
   * @param params - Price slab configuration parameters
   * @returns Promise with creation response
   */
  static async createPriceSlab(params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/priceslab-config`,
      "POST",
      params,
    );
  }

  /**
   * Update an existing price slab configuration
   * @param editId - The id of the price slab config to edit (appears in the URL path)
   * @param params - Price slab configuration parameters (payload `id` should be the target id)
   * @returns Promise with update response
   */
  static async updatePriceSlab(editId: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/priceslab-config/${editId}`,
      "PUT",
      params,
    );
  }

  /**
   * Get price slab configuration
   * @param params - Optional query parameters
   * @returns Promise with price slab data
   */
  static async getPriceSlab(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/priceslab-config`,
      "GET",
      params || {},
    );
  }
}

export default PriceSlabService;
