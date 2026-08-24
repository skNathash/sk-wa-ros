import { API } from "~/constants";
import AjaxService from "./AjaxService";

const BASE = `${API}franchise/runner`;

/**
 * Marketplace runners — the third-party riders a store hires per drop.
 *
 * Registration is staged without an id until the end: the mobile is proved
 * with an OTP first, then a single create call opens the runner with every
 * collected field. There is no update endpoint, so the draft lives only in
 * the client's form between steps.
 */
class MarketplaceRunnerService {
  /**
   * Marketplace runners, as a plain list — the usual paging / `sort` /
   * `filter` / `outputType` keys the list APIs take.
   */
  static async getRunners(params: Record<string, any>) {
    return AjaxService.request(BASE, "GET", params);
  }

  /**
   * Runners working around the store.
   *
   * @param params - lat/lng of the store plus the usual paging / filter /
   *   `outputType` keys the list APIs take.
   */
  static async getNearbyRunners(params: Record<string, any>) {
    return AjaxService.request(`${BASE}/nearby`, "GET", params);
  }

  /**
   * Update the runner's delivery area. The area is the point their radius
   * hangs from, so it is sent as a bare lat/lng pair to the runner's record.
   *
   * @param id - the runner id the area belongs to.
   * @param payload - `lat`/`lng` of the chosen delivery area.
   */
  static async updateArea(id: string, payload: { lat: number; lng: number }) {
    return AjaxService.request(`${BASE}/${id}`, "PUT", payload);
  }

  /**
   * Update a field on the runner's record (e.g. the `isAvailable` flag that
   * toggles them online/offline for new job offers).
   *
   * @param id - the runner id the update belongs to.
   * @param payload - the fields to change, sent as a bare key/value set.
   */
  static async updateRunner(id: string, payload: Record<string, any>) {
    return AjaxService.request(`${BASE}/${id}`, "PUT", payload);
  }

  /** Confirm the mobile is not already registered to another runner. */
  static async checkMobile(mobile: string) {
    return AjaxService.request(
      `${API}user/users/checkmobile/${mobile}/Runner`,
      "GET",
    );
  }

  /** Request the registration OTP; the response carries the request id. */
  static async requestOtp(payload: { name: string; mobile: string }) {
    return AjaxService.request(`${BASE}/otp/request`, "POST", payload);
  }

  /** Prove the code against the request id from `requestOtp`. */
  static async verifyOtp(payload: { otpRequestId: string; otp: string }) {
    return AjaxService.request(`${BASE}/otp/verify`, "POST", payload);
  }

  /** Open the runner once — every field collected so far, keyed by the OTP. */
  static async createRunner(payload: Record<string, any>) {
    return AjaxService.request(BASE, "POST", payload);
  }

  static async getShipmentsByRunner(params: Record<string, any>) {
    const defaultParams = {
      groupbycond: "deliveryAgent",
    };
    return AjaxService.request(`${API}/sales/shipment/fetch`, "GET", {
      ...defaultParams,
      ...params,
    });
  }

  /** Open jobs a runner can still claim, filtered by their location. */
  static async getAvailableShipments(params: Record<string, any>) {
    return AjaxService.request(`${API}sales/shipment/available`, "GET", params);
  }
}

export default MarketplaceRunnerService;
