import { API, API_VERSION, OLD_API } from "~/constants";
import AjaxService from "./AjaxService";

interface TermsResponse {
  content: string;
  title?: string;
  lastUpdated?: string;
  version?: string;
  name?: string;
  code?: string;
  description?: string;
}

/**
 * Service for Terms and Content related API calls
 */
class TermsService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  public static async getTermsContent(termsKey: string | string[]) {
    const codeFilter = Array.isArray(termsKey) ? { $in: termsKey } : termsKey;

    return AjaxService.request<TermsResponse>(
      `${OLD_API}/config/termsandconditions`,
      "GET",
      {
        filter: {
          code: codeFilter,
          isActive: true,
        },
      }
    );
  }

  public static async getMultipleTermsContent(termsKeys: string[]) {
    return this.getTermsContent(termsKeys);
  }

  public static async getTermsList(params?: Record<string, any>) {
    return AjaxService.request(
      `${OLD_API}/config/termsandconditions`,
      "GET",
      params
    );
  }
}

export default TermsService;
