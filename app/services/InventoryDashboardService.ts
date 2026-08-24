import { API } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import type { AxiosRequestConfig } from "axios";

class InventoryDashboardService {
  static getDefaultFilter() {
    return {
      // filter: {
      //   franchiseId: AuthService.getLoggedInUserId(true),
      // },
    };
  }

  static async getTotalDeals(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/total-deals`,
      "GET",
      merged,
      config,
    );
  }

  static async getInventoryValue(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/inventory-value`,
      "GET",
      merged,
      config,
    );
  }

  static async getSellableInventoryValue(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/sellable-nonsellable`,
      "GET",
      merged,
      config,
    );
  }

  static async getInventoryTurnover(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/inventory-turnover`,
      "GET",
      merged,
      config,
    );
  }

  static async getSkuMovement(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/sku-movement`,
      "GET",
      merged,
      config,
    );
  }

  static async getSkuMovementBreakdown(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/sku-movement/breakdown`,
      "GET",
      merged,
      config,
    );
  }

  static async getInventoryValueByCategory(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/inventory-value-by-category`,
      "GET",
      merged,
      config,
    );
  }

  static async getInventoryValueByBrand(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/inventory-value-by-brand`,
      "GET",
      merged,
      config,
    );
  }

  static async getOutOfStockSkus(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/out-of-stock-skus`,
      "GET",
      merged,
      config,
    );
  }

  static async getSalesPerformanceLastSale(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}sales/dashboard/sales-performance-last-sale`,
      "GET",
      merged,
      config,
    );
  }

  static async getTopFastMovingProducts(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}sales/dashboard/top-fast-moving-products`,
      "GET",
      merged,
      config,
    );
  }

  static async getSkuMovementList(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/sku-movement/list`,
      "GET",
      merged,
      config,
    );
  }

  static async getSellableNonSellableList(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/sellable-nonsellable/list`,
      "GET",
      merged,
      config,
    );
  }

  static async getBottomDeadStockProducts(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}sales/dashboard/bottom-dead-stock-products`,
      "GET",
      merged,
      config,
    );
  }

  static async getInventoryHealthScore(
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = { ...this.getDefaultFilter(), ...params };
    return AjaxService.request(
      `${API}catalog/dashboard/inventory-health-score`,
      "GET",
      merged,
      config,
    );
  }

  static async getInventoryRisk(
    type: "overstocked" | "reorderRequired" | "expiryRisk" | "reserve" | "all",
    params: Record<string, any> = {},
    config?: AxiosRequestConfig,
  ) {
    const merged = {
      ...this.getDefaultFilter(),
      ...(type !== "all" ? { type } : {}),
      ...params,
    };
    return AjaxService.request(
      `${API}sales/dashboard/inventory-risk-analytics`,
      "GET",
      merged,
      config,
    );
  }
}

export default InventoryDashboardService;
