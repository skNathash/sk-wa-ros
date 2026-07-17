import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { OLD_API } from "~/constants";
import AuthService from "./AuthService";
import { StorageService } from "./StorageService";

interface StandardResponse<T> {
  statusCode: number;
  data: T;
}

/**
 * Service for making HTTP requests using axios
 */
export class AjaxService {
  private static readonly TOKEN_KEY = "_t";

  /**
   * URLs that are allowed to pass through normally even during a master login,
   * instead of being short-circuited to a static response.
   */
  private static readonly MASTER_LOGIN_ALLOWED_URLS = [
    "utilities/getSignUpConfigurationList/",
  ];

  /**
   * Makes an HTTP request using axios
   *
   * @param url - The URL to send the request to
   * @param method - The HTTP method to use (GET, POST, PUT, DELETE, etc.)
   * @param params - Optional parameters to send with the request
   * @param config - Optional axios configuration
   * @returns Promise with standardized response containing statusCode and data
   */
  public static async request<T = any>(
    url: string,
    method: string = "GET",
    params?: any,
    config?: AxiosRequestConfig,
  ): Promise<StandardResponse<T>> {
    try {
      const axiosConfig: AxiosRequestConfig = {
        url,
        method,
        headers: {
          ...config?.headers,
        },
        ...config,
      };

      // Get JWT token from storage and add to headers if exists.
      const token = StorageService.get<string>(this.TOKEN_KEY);

      // If token indicates a master-login and the request targets OLD_API,
      // return a static response instead of making a network call.
      try {
        if (token) {
          if (
            AuthService.isMasterLogin() &&
            typeof url === "string" &&
            url.indexOf(OLD_API) === 0 &&
            !this.MASTER_LOGIN_ALLOWED_URLS.some((allowed) =>
              url.includes(allowed),
            )
          ) {
            return {
              statusCode: 200,
              data: {} as T,
            };
          }
        }
      } catch (e) {
        // If decoding fails, fall through to normal behaviour.
      }

      const hasAuthorizationHeader =
        typeof axiosConfig.headers?.Authorization === "string" &&
        axiosConfig.headers?.Authorization.trim() !== "";

      if (token && !hasAuthorizationHeader) {
        axiosConfig.headers = {
          ...axiosConfig.headers,
          Authorization: `JWT ${token}`,
        };
      }

      // Add params based on method
      if (method.toUpperCase() === "GET") {
        axiosConfig.params = this.prepareParams(params);
      } else {
        axiosConfig.data = params;
      }

      const response: AxiosResponse<T> = await axios(axiosConfig);

      return {
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Handle 401 Unauthorized
        if (error.response.status === 401) {
          // StorageService.clear();
          AuthService.clearLoggedInUser();
          window.location.replace(location.origin + "/auth/login");
        }
        return {
          statusCode: error.response.status,
          data: error.response.data as T,
        };
      }

      // For network errors or other non-HTTP errors
      return {
        statusCode: 500,
        data: { message: "Internal client error" } as T,
      };
    }
  }

  static prepareParams(params: any) {
    const keys = Object.keys(params || {});
    let t: any = {};
    keys.forEach((x) => {
      const p = typeof params[x];
      t[x] = p == "object" && p != null ? JSON.stringify(params[x]) : params[x];
    });
    return t;
  }
}

export default AjaxService;
