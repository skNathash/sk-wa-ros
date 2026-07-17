import { API, API_VERSION, OLD_API } from "~/constants";
import AjaxService from "./AjaxService";

class NotificationService {
  static readonly BASE_URL = API;
  static readonly API_VERSION = API_VERSION;

  static readonly API_KEY = "cfa82c4cafc197e41c9f905c87209aee";

  static async getWhatsAppLogs(params: Record<string, any>) {
    return AjaxService.request(
      `${OLD_API}/notification/${this.API_VERSION}/nslog`,
      "GET",
      params,
      {
        headers: {
          "x-api-key": this.API_KEY,
        },
      },
    );
  }

  static async getWhatsAppLogsCount(params: Record<string, any>) {
    return AjaxService.request(
      `${OLD_API}/notification/${this.API_VERSION}/nslog/count`,
      "GET",
      params,
      {
        headers: {
          "x-api-key": this.API_KEY,
        },
      },
    );
  }

  static async getWhatsAppLocalLogs(params: Record<string, any>) {
    return AjaxService.request(
      `${API}/notification/whatsapp-templates/fetchLocalwhatsapplogs`,
      "GET",
      params,
    );
  }
}

export default NotificationService;
