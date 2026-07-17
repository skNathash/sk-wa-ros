import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";

class PurchaseReturnService {
  static async getList(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/fetchStoreReturnProcessData`,
      "GET",
      params
    );
  }
}

export default PurchaseReturnService;
