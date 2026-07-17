import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";

class CommissionService {
  static async getDigitalCommission(params: any = {}) {
    const r = await AjaxService.request(
      API + "/commission/" + API_VERSION + "/digitalCommission/findCommission",
      "POST",
      params || {}
    );
    return r;
  }
}

export default CommissionService;
