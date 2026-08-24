import { API } from "~/constants";
import AjaxService from "./AjaxService";

/**
 * The party/party activity feed — `sales/timeline/list` records every
 * transaction that moved between two users (a store and its customer, a store
 * and its vendor, …), newest first.
 */
class TimelineService {
  private static readonly BASE_URL = API;

  /** One page of timeline entries. */
  static async getList(params: Record<string, any> = {}) {
    return AjaxService.request(`${this.BASE_URL}sales/timeline/list`, "GET", params);
  }

  /** Total entries matching the same filter — drives the load-more summary. */
  static async getCount(params: Record<string, any> = {}) {
    const { page, count, sort, ...rest } = params || {};
    const response = await this.getList({ ...rest, outputType: "count" });
    // The count endpoint answers with `data.count` like every other list here;
    // the `data.data` shapes are the older envelope some services still return.
    const payload: any = response?.data;
    const inner: any = payload?.data;

    return (
      Number(
        payload?.count ??
          (typeof inner === "object" ? (inner?.count ?? inner?.total) : inner),
      ) || 0
    );
  }
}

export default TimelineService;
