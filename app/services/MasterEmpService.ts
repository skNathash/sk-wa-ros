import { API } from "~/constants";
import AjaxService from "./AjaxService";
import { get } from "lodash";
import StorageService from "./StorageService";
import FranchiseService from "./FranchiseService";

class MasterEmpService {
  /**
   * Normalize a single franchise object by adding lat/lng from geoLocation.coordinates [lng, lat]
   */
  private static formatFranchise(franchise: any) {
    if (!franchise || typeof franchise !== "object") return franchise;
    const coords = get(franchise, "geoLocation.coordinates", [] as any[]);
    const lng =
      Array.isArray(coords) && coords.length >= 2 ? coords[0] : undefined;
    const lat =
      Array.isArray(coords) && coords.length >= 2 ? coords[1] : undefined;

    const shopImg =
      franchise?.shopPhotosDetails?.find(
        (e: Record<string, any>) => e.status === "Approved",
      )?.fileUrl || "";

    const city = franchise?.city || "";
    const town = franchise?.town || "";
    const district = franchise?.district || "";
    const state = franchise?.state || "";
    const pincode = franchise?.pincode || "";

    let formattedAddress = [city || town, district, state]
      .filter(Boolean)
      .join(", ");

    if (pincode) {
      formattedAddress += ` - ${pincode}`;
    }

    return {
      ...franchise,
      shopImg,
      lat,
      lng,
      formattedAddress,
      displayType: FranchiseService.getDisplaySubType(
        franchise.subType,
        franchise.networkType,
      ).name,
    };
  }

  static async getFranchises(params?: Record<string, any>) {
    const p = Object.assign({}, params || {}, { outputType: "list" });
    const response = await AjaxService.request(
      `${API}employee/master/franchise/list`,
      "GET",
      p,
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
      },
    );
    try {
      const payload: any = response?.data?.data;
      if (payload && Array.isArray(payload)) {
        response.data.data = payload.map((item: any) =>
          this.formatFranchise(item),
        );
      }
    } catch {}
    return response;
  }

  static async getFranchisesCount(params?: Record<string, any>) {
    const p = Object.assign({}, params || {}, { outputType: "count" });
    return AjaxService.request(
      `${API}employee/master/franchise/list`,
      "GET",
      p,
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
      },
    );
  }

  /**
   * Fetch the paginated master-employee list. Mirrors `getFranchises`: runs
   * under the master employee token (`_et`) and returns the array at
   * `data.data`.
   */
  static async getEmployees(
    params?: Record<string, any>,
    config?: Record<string, any>,
  ) {
    const p = Object.assign({}, params || {}, { outputType: "list" });
    return AjaxService.request(`${API}/employee/list`, "GET", p, {
      ...(config || {}),
      // headers: {
      //   Authorization: `JWT ${StorageService.get("_et")}`,
      // },
    });
  }

  static async getEmployeesCount(params?: Record<string, any>) {
    const p = Object.assign({}, params || {}, { outputType: "count" });
    return AjaxService.request(
      `${API}employee/master/employee/list`,
      "GET",
      p,
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
      },
    );
  }

  /**
   * Allow the current master employee to access/connect to a franchise
   * @param franchiseId id of the franchise to connect to
   */
  static async accessFranchise(franchiseId: string) {
    return AjaxService.request(
      `${API}employee/connect-to-franchise`,
      "POST",
      { franchiseId },
      {
        headers: {
          Authorization: `JWT ${StorageService.get("_et")}`,
        },
      },
    );
  }
}

export default MasterEmpService;
