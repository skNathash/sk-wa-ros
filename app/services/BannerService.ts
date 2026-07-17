import { API } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";

class BannerService {
  static async getValidBanners(fid?: string, params?: Record<string, any>) {
    const id = fid || AuthService.getLoggedInUserId(false);
    return AjaxService.request(
      `${API}franchise/banner-config/valid-banners/${id}`,
      "GET",
      params || {},
    );
  }

  static async create(params: Record<string, any>) {
    return AjaxService.request(`${API}franchise/banner-config`, "POST", params);
  }

  static async list(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/banner-config`,
      "GET",
      params || {},
    );
  }

  static async detail(id: string) {
    return AjaxService.request(`${API}franchise/banner-config/${id}`, "GET");
  }

  static async update(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/banner-config/${id}`,
      "PUT",
      params,
    );
  }
  static getPageLocations() {
    return [
      { label: "Home Page", value: "HOME_PAGE" },
      { label: "Category Page", value: "CATEGORY_PAGE" },
      { label: "Product Page", value: "PRODUCT_PAGE" },
      { label: "Cart Page", value: "CART_PAGE" },
      { label: "Profile Page", value: "PROFILE_PAGE" },
    ];
  }

  static async getPlaceholderConfigs(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/banner-config/placeholder-configs/fetch`,
      "GET",
      params || {},
    );
  }

  static async slideList(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/banner-config/placeholder-configs/fetch`,
      "GET",
      params || {},
    );
  }

  static getStatusBadgeColor(
    status: string,
  ): "success" | "warning" | "primary" | "danger" | "info" {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Draft":
        return "info";
      case "Rejected":
        return "danger";
      default:
        return "info";
    }
  }

  static async submit(id: string) {
    return AjaxService.request(
      `${API}franchise/banner-config/${id}/submit`,
      "PUT",
    );
  }

  static async approve(id: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/banner-config/${id}/approve`,
      "PUT",
      params || { remarks: "" },
    );
  }

  static async reject(id: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/banner-config/${id}/reject`,
      "PUT",
      params || { remarks: "" },
    );
  }
}

export default BannerService;
