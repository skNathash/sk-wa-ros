import { API } from "~/constants";
import AjaxService from "./AjaxService";

class WhatsappTemplateRequestService {
  static async create(params: Record<string, any>) {
    return AjaxService.request(
      `${API}notification/whatsapp-template-requests`,
      "POST",
      params,
    );
  }

  static async list(params?: Record<string, any>) {
    return AjaxService.request(
      `${API}notification/whatsapp-template-requests/seller/list`,
      "GET",
      params || {},
    );
  }

  static async getPendingCount(): Promise<number> {
    try {
      const response = await this.list({
        outputType: "count",
        filter: { status: "Pending" },
      });
      return response.data?.data?.count || 0;
    } catch (err) {
      console.error("Error fetching pending template request count:", err);
      return 0;
    }
  }

  static getStatusBadgeColor(
    status: string,
  ): "success" | "warning" | "primary" | "danger" | "info" {
    switch (status) {
      case "Approved":
      case "Completed":
        return "success";
      case "Pending":
      case "Submitted":
        return "warning";
      case "Rejected":
        return "danger";
      default:
        return "info";
    }
  }
}

export default WhatsappTemplateRequestService;
