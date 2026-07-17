import { API } from "~/constants";
import AjaxService from "./AjaxService";
import StorageService from "./StorageService";

/**
 * Service for network analytics and dashboard related API calls
 */
class NetworkAnalyticsService {
  static async getSalesPerformance(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}sales/dashboard/sales-performance`,
      "GET",
      params,
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
      },
    );
  }

  static async getRetailerDetailView(
    params: Record<string, any> = {},
    signal?: AbortSignal,
  ) {
    return AjaxService.request(
      `${API}franchise/dashboard/retailer-detail-view`,
      "GET",
      params,
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
        signal,
      },
    );
  }

  static async getFranchiseNetworkOverview(
    params: Record<string, any> = {},
    signal?: AbortSignal,
  ) {
    return AjaxService.request(
      `${API}franchise/dashboard/franchise-network-overview`,
      "GET",
      params,
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
        signal,
      },
    );
  }
}

export default NetworkAnalyticsService;
