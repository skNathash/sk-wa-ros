import { API } from "~/constants";
import AjaxService from "./AjaxService";

class SellerGroupPriceConfigService {
  /**
   * Create a new seller group price config
   * @param params - Group price config payload
   * @returns Promise with creation response
   */
  static async createGroup(params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-group-price-config`,
      "POST",
      params,
    );
  }

  /**
   * Update an existing seller group price config
   * @param editId - The id of the group config to edit (appears in the URL path)
   * @param params - Group price config payload
   * @returns Promise with update response
   */
  static async updateGroup(editId: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-group-price-config/${editId}`,
      "PUT",
      params,
    );
  }

  /**
   * Get seller group price configs
   * @param params - Optional query parameters (filter, page, count, sort)
   * @returns Promise with group price config list
   */
  static async getGroups(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}catalog/seller-group-price-config`,
      "GET",
      params || {},
    );
  }
}

export default SellerGroupPriceConfigService;
