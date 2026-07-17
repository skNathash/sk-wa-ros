import { API } from "~/constants";
import AjaxService from "~/services/AjaxService";

const BASE = `${API}/franchise/routes`;

class DeliveryRoutesService {
  static async createRoute(payload: any) {
    return AjaxService.request(BASE, "POST", payload);
  }

  static async updateRoute(routeId: string, payload: any) {
    return AjaxService.request(`${BASE}/${routeId}`, "PUT", payload);
  }

  static async getRoutesList(params?: any) {
    return AjaxService.request(BASE, "GET", params);
  }

  static async getAuditTrail(routeId: string) {
    return AjaxService.request(`${BASE}/${routeId}/audit-trail`, "GET");
  }

  static async updateStatus(routeId: string, params: any) {
    return AjaxService.request(`${BASE}/${routeId}/status`, "PATCH", params);
  }

  static async linkRoute(payload: any) {
    return AjaxService.request(`${BASE}/link`, "POST", payload);
  }

  static async unlinkRoute(payload: any) {
    return AjaxService.request(`${BASE}/unlink`, "POST", payload);
  }

  // Bulk update orders to assign them to a route
  static async updateOrdersRouteBulk(payload: any) {
    // Endpoint for orders bulk update
    return AjaxService.request(
      `${API}/sales/order/bulk-update-route-info`,
      "PATCH",
      payload,
    );
  }

  static async getRoutesCount(params?: any) {
    return AjaxService.request(BASE, "GET", {
      ...(params || {}),
      outputType: "count",
    });
  }
}

export default DeliveryRoutesService;
