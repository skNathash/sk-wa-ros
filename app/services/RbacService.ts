import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";

class RbacService {
  static async getRoles(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/role/list`, "GET", params);
  }

  static async getFeatures(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/rbac/feature/list`,
      "GET",
      params
    );
  }

  static async createFeature(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/rbac/features`,
      "POST",
      params
    );
  }

  static async getConfigs(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/rbac/config`,
      "GET",
      params
    );
  }

  static async createConfig(params: Record<string, any>) {
    return AjaxService.request(
      `${API}franchise/${API_VERSION}/rbac/config`,
      "POST",
      params
    );
  }

  static async getManpowerCount(params?: Record<string, any>) {
    return AjaxService.request(`${API}franchise/manpower/count`, "GET", params);
  }
}

export default RbacService;
