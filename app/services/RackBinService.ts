import { differenceInCalendarDays } from "date-fns";

import { merge, orderBy } from "lodash";
import { API, API_VERSION } from "~/constants";
import type { SnapshotMasterItem, UsedSnapshot } from "~/types/CommonTypes";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";

/**
 * Service for Rack and Bin related API calls
 */
export class RackBinService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  static getRackBinConfig(
    fid: string,
    locationId: string,
    params: Record<string, any>
  ) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/${fid}/${locationId}/config`,
      "GET",
      params
    );
  }

  static getRackBinDetais(fid: string, binId: string) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/${fid}/${binId}/details`,
      "GET",
      {}
    );
  }

  public static async getBinProducts(
    fid: string,
    locationId: string,
    params: Record<string, any>
  ) {
    const r = await AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/${fid}/${locationId}/productlist`,
      "GET",
      params
    );
    if (Array.isArray(r.data)) {
      r.data.forEach((e) => {
        if (e.code === "L2") {
          (e.racks || []).forEach((r: any) => {
            r.aliasName = this.getNonSellableRackAliasName(r.name);
          });
        }
      });
    }
    return r;
  }

  public static async getBin(fid: string, binId: string) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/bindetails/${fid}/${binId}`,
      "GET",
      {}
    );
  }

  public static async getLocations(): Promise<any[]> {
    const r = new Promise<any[]>((resolve) => {
      resolve([
        {
          _id: "L1",
          name: "Sellable",
        },
        {
          _id: "L2",
          name: "Non-Sellable",
        },
      ]);
    });
    return r || [];
  }

  static getLedgerList(fid: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/${fid}/ledger`,
      "GET",
      params
    );
  }

  static formatLedgerResponse(response: any) {
    if (Array.isArray(response)) {
      response.forEach((e: any) => {
        const referenceType = e.referenceType;
        let redirect = { path: "", params: {}, useDskNav: false };

        // Keep readable reference type label
        if (referenceType === "PURCHASE") {
          e.referenceType = "Purchase";
          e.referenceTypeColor = "primary";
        } else if (referenceType === "SALES") {
          e.referenceType = "Sales";
          e.referenceTypeColor = "success";
        } else if (referenceType === "ADJUSTMENT") {
          e.referenceType = "Adjustment";
          e.referenceTypeColor = "warning";
        } else if (referenceType === "SALES_RETURN") {
          e.referenceType = "Sales Return";
          e.referenceTypeColor = "danger";
        } else if (referenceType === "SUBSCRIPTION") {
          e.referenceType = "Subscription";
          e.referenceTypeColor = "secondary";
        } else if (referenceType === "MOVEMENT") {
          e.referenceType = "Movement";
          e.referenceTypeColor = "outline";
        } else {
          e.referenceTypeColor = "light";
        }

        // New routing logic: use refNo prefix only
        const refNo: string = (e.refNo || "").toString();
        if (refNo.startsWith("PO")) {
          redirect.path = `/dashboard/purchase-order/view/${e.refId}`;
        } else if (refNo.startsWith("OR")) {
          redirect.path = `/dashboard/orders/view/${e.refId}`;
        } else if (referenceType === "ADJUSTMENT") {
          // Keep adjustment as non-navigable
          redirect.path = "#";
        }

        e._tranRedirect = redirect;
      });
    }
    return response;
  }

  public static async getRackLocationList(params?: Record<string, any>) {
    const p = merge(
      {},
      { groupbycond: "location", ...(params || {}) },
      { filter: { franchiseId: AuthService.getLoggedInUserId() } }
    );
    const r = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/config`,
      "GET",
      p
    );

    if (Array.isArray(r.data)) {
      r.data = orderBy(r.data, ["name"], ["desc"]);
    }

    return r;
  }

  /**
   * Get location details of deals
   *
   * @param dealIds - Array of deal IDs
   * @param params - Additional query parameters
   * @returns Promise with location details data
   */
  public static async getLocationDetailsOfDeals(
    dealIds: Array<string>,
    params: any = {}
  ) {
    const p = merge(
      {},
      {
        queryType: "fetchDataByDeal",
        page: 1,
        count: 1000,
        filter: {
          dealId: { $in: dealIds },
          "sellerInfo._id": AuthService.getLoggedInSellerId(),
        },
      },
      params
    );
    return await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/seller/stock/getStockMasterData`,
      "GET",
      p
    );
  }

  /**
   * Get non-sellable rack alias name
   *
   * @param rack - Rack name
   * @returns Alias name for the rack
   */
  private static getNonSellableRackAliasName(rack: string): string {
    switch (rack) {
      case "D":
        return "Damage";
      case "E":
        return "Expired";
      case "Q":
        return "Quarantine";
      case "N":
        return "Near Expiry";
      default:
        return rack;
    }
  }

  /**
   * Search deals in rack bin
   *
   * @param sellerId - Seller ID
   * @param params - Query parameters for searching deals
   * @returns Promise with search results including alias names for racks
   */
  static async searchDealInRackBin(
    sellerId: string,
    params: Record<string, any>
  ) {
    let p = merge(
      {},
      {
        queryType: "fetchDataByProduct",
        page: 1,
        count: 100,
        filter: {
          "sellerInfo._id": sellerId,
        },
      },
      params
    );
    const response = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/seller/stock/getStockMasterData`,
      "GET",
      p
    );

    if (Array.isArray(response.data)) {
      const rackAliasMap: Record<string, string> = {
        D: "Damage",
        E: "Expired",
        N: "Near Expiry",
      };
      response.data = response.data.map((item: any) => {
        if (item.LocationId === "L2") {
          return {
            ...item,
            aliasName: rackAliasMap[item.RackName] || item.RackName,
          };
        }
        return item;
      });
    }
    return response;
  }

  /**
   * Get rack bin allotment percentage
   *
   * @param params - Query parameters for percentage calculation
   * @returns Promise with allotment percentage data
   */
  static getRackBinAllotmentPercent(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackAndBin/fetchPercentageWise`,
      "GET",
      params
    );
  }

  /**
   * Get rack bin products by bin
   *
   * @param params - Query parameters for rack bin products by bin
   * @returns Promise with rack bin products by bin data
   */
  static getRackBinProductsByBin(params: Record<string, any>) {
    const p = merge(
      {},
      {
        queryType: "fetchProductByBin",
        filter: { "sellerInfo._id": AuthService.getLoggedInSellerId() },
      },
      params
    );
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackAndBin/fetchPercentageWise`,
      "GET",
      p
    );
  }

  /**
   * Download rack bin report
   *
   * @param sellerId - Seller ID
   * @param params - Additional parameters for download
   * @returns Promise with download response
   */
  static downloadRackBin(sellerId: string, params: Record<string, any> = {}) {
    let p = merge({}, { filter: { "sellerInfo._id": sellerId } }, params);
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/report/download`,
      "GET",
      p
    );
  }

  /**
   * Get bin items
   *
   * @param binId - Bin ID
   * @param params - Additional query parameters
   * @returns Promise with bin items data
   */
  static getBinItems(binId: string, params: Record<string, any> = {}) {
    let p = merge(
      {},
      {
        queryType: "fetchDataByLocation",
        filter: { "location.binId": binId },
      },
      params
    );
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/seller/stock/getStockMasterData`,
      "GET",
      p
    );
  }

  /**
   * Move stock to other location
   *
   * @param params - Parameters for stock movement
   * @returns Promise with movement response
   */
  public static async moveStockToOtherLocation(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${
        this.API_VERSION
      }/seller/${AuthService.getLoggedInSellerId()}/stock/movement`,
      "POST",
      params
    );
  }

  /**
   * Update bin details
   *
   * @param params - Parameters for updating bin details
   * @returns Promise with update response
   */
  public static async updateBinDetails(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/update/config`,
      "PUT",
      params
    );
  }

  /**
   * Get bin logs
   *
   * @param params - Query parameters for bin logs
   * @returns Promise with bin logs data
   */
  public static async getBinLogs(
    fid: string,
    binId: string,
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/bindetails/${fid}/${binId}/logs`,
      "GET",
      params
    );
  }

  /**
   * Get bin logs count
   *
   * @param params - Query parameters for bin logs count
   * @returns Promise with bin logs count
   */
  public static async getBinLogsCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/config/log/count`,
      "GET",
      params
    );
  }

  /**
   * Get bin availability
   *
   * @param params - Query parameters for bin availability
   * @returns Promise with bin availability data including total quantities
   */
  public static async getBinAvailability(params: Record<string, any> = {}) {
    const response = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/fetchbinavailability`,
      "GET",
      params
    );

    if (Array.isArray(response.data?.result)) {
      response.data.result = response.data.result.map((item: any) => {
        let totalQty = 0;
        if (Array.isArray(item.deals)) {
          totalQty = item.deals.reduce(
            (sum: number, deal: any) => sum + (deal.quantity || 0),
            0
          );
        }
        return {
          ...item,
          totalQty,
        };
      });
    }

    return response;
  }

  /**
   * Get POS stock allocation data
   *
   * @param params - Query parameters for stock allocation data
   * @returns Promise with stock allocation data
   */
  public static async getPosStockAllocationData(
    params: Record<string, any> = {}
  ) {
    const response = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/fetch/posStockAllocationData`,
      "GET",
      params
    );

    return response;
  }

  static async getBinSummary(
    fid: string,
    locationId: string,
    params: Record<string, any>
  ) {
    const r = await AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/${fid}/${locationId}/binSummary`,
      "GET",
      params
    );
    if (Array.isArray(r.data)) {
      r.data.forEach((e) => {
        if (e.code === "L2") {
          (e.racks || []).forEach((r: any) => {
            r.aliasName = this.getNonSellableRackAliasName(r.name);
          });
        }
      });
    }
    return r;
  }

  static getBinMetrics(
    fid: string,
    binId: string,
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/${fid}/bins/${binId}/metrics`,
      "GET",
      params
    );
  }

  static async getMasterData(fid: string, params: Record<string, any> = {}) {
    const response = await AjaxService.request(
      `${this.BASE_URL}inventory/stock/${fid}/master`,
      "GET",
      params
    );
    // Format daysLeft for each item in response.data.data
    if (response && response.data && Array.isArray(response.data.data)) {
      const today = new Date();
      response.data.data = response.data.data.map((item: any) => {
        let daysLeft = 0;
        if (item.expiry) {
          try {
            daysLeft = differenceInCalendarDays(new Date(item.expiry), today);
          } catch {
            daysLeft = 0;
          }
        }
        return { ...item, daysLeft };
      });
    }
    return response;
  }

  static prepareShelfOverview(
    masterData: Array<{
      expiry: string;
      quantity: number;
      manufactureDate: string;
      _id: string;
    }>,
    ignoreNoStock: boolean = false
  ) {
    if (!Array.isArray(masterData)) return [];
    const grouped: Record<
      string,
      { quantity: number; expiresOn: string; _id: string[]; daysLeft: number }
    > = {};
    const today = new Date();
    masterData.forEach((item) => {
      const key = item.expiry;
      if (!grouped[key]) {
        const expiresOn = item.expiry;
        let daysLeft = 0;
        if (expiresOn) {
          try {
            daysLeft = differenceInCalendarDays(new Date(expiresOn), today);
          } catch {
            daysLeft = 0;
          }
        }
        grouped[key] = {
          quantity: 0,
          expiresOn,
          _id: [],
          daysLeft,
        };
      }
      grouped[key].quantity += Number(item.quantity) || 0;
      grouped[key]._id.push(item._id);
    });

    const result = Object.values(grouped);
    if (ignoreNoStock) {
      return result.filter((g) => Number(g.quantity) !== 0);
    }
    return result;
  }

  static prepareBarcodes(
    masterData: Array<{ barcode: string }>
  ): Array<{ barcode: string }> {
    if (!Array.isArray(masterData)) return [];
    const seen = new Set<string>();
    return masterData
      .filter((item) => {
        const code =
          typeof item.barcode === "string" ? item.barcode.trim() : "";
        if (!code || seen.has(code)) return false;
        seen.add(code);
        return true;
      })
      .map((item) => ({ barcode: item.barcode.trim() }));
  }

  /**
   * Returns items with 20% of shelf life remaining, calculated from manufactureDate to expiry.
   * @param masterData Array of items with manufactureDate and expiry
   */
  static nearExpiryShelfLife(
    masterData: Array<{
      expiry: string;
      quantity: number;
      manufactureDate: string;
      _id: string;
    }>
  ) {
    if (!Array.isArray(masterData)) return [];
    const today = new Date();
    return masterData
      .map((item) => {
        let shelfLifeDays = 0;
        let daysUsed = 0;
        let percentUsed = 0;
        let twentyPercentDays = 0;
        if (item.manufactureDate && item.expiry) {
          try {
            const mfg = new Date(item.manufactureDate);
            const exp = new Date(item.expiry);
            shelfLifeDays = differenceInCalendarDays(exp, mfg);
            daysUsed = differenceInCalendarDays(today, mfg);

            percentUsed =
              shelfLifeDays > 0 ? (daysUsed / shelfLifeDays) * 100 : 0;
            twentyPercentDays = Math.floor(shelfLifeDays * 0.2);
          } catch {
            shelfLifeDays = 0;
            daysUsed = 0;
            percentUsed = 0;
            twentyPercentDays = 0;
          }
        }
        return {
          ...item,
          shelfLifeDays,
          daysUsed,
          percentUsed,
          twentyPercentDays,
          isNearExpiry:
            shelfLifeDays > 0 && shelfLifeDays - daysUsed <= twentyPercentDays,
        };
      })
      .filter((item) => item.isNearExpiry);
  }

  static async adjustStock(fid: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/${fid}/adjustment`,
      "POST",
      params
    );
  }

  static async moveStock(fid: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/${fid}/movement`,
      "POST",
      params
    );
  }

  static async getRecommendedBins(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/recommendbins`,
      "POST",
      params
    );
  }

  static async getRecommendedBinsBulk(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/rackbin/recommendbins/bulk`,
      "POST",
      params
    );
  }

  static async getBinsOfDeal(
    fid: string,
    dealId: string,
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/${fid}/${dealId}/locations`,
      "GET",
      params
    );
  }

  static async getSnapshotsMastersData(
    fid: string,
    params: Record<string, any> = {},
    options?: {
      filterOnMrp?: boolean;
      mrp?: number;
      filterOnBarcode?: boolean;
      barcode?: string;
    }
  ) {
    const response = await this.getMasterData(fid, { ...params });

    if (response && response.data && Array.isArray(response.data.data)) {
      const grouped: Record<string, any> = {};

      const origData = [...(response.data?.data || [])];

      let filteredData = [...origData];

      if (options?.filterOnMrp && options.filterOnBarcode) {
        filteredData = filteredData.filter(
          (item: any) =>
            item.mrp === options.mrp && item.barcode === options.barcode
        );
      }

      if (options?.filterOnMrp && !options.filterOnBarcode) {
        filteredData = filteredData.filter(
          (item: any) => item.mrp === options.mrp
        );
      }

      if (options?.filterOnBarcode && !options.filterOnMrp) {
        filteredData = filteredData.filter(
          (item: any) => item.barcode === options.barcode
        );
      }

      if (!filteredData.length) {
        filteredData = [...origData];
      }

      filteredData.forEach((item: any) => {
        // Create a unique key based on mrp, barcode, and expiry
        const key = `${item.mrp || 0}_${item.barcode || ""}_${
          item.expiry || ""
        }`;

        if (!grouped[key]) {
          grouped[key] = {
            mrp: item.mrp || 0,
            barcode: item.barcode || "",
            expiry: item.expiry || "",
            totalQuantity: 0,
            masters: [],
          };
        }

        // Calculate remaining days from expiry date
        const remainingDays = item.expiry
          ? differenceInCalendarDays(new Date(item.expiry), new Date())
          : null;

        // Add the item to masters array
        grouped[key].masters.push({
          _id: item._id,
          quantity: item.quantity || 0,
          mrp: item.mrp || 0,
          barcode: item.barcode || "",
          expiry: item.expiry || "",
          remainingDays,
          sellInLooseQty: item.sellInLooseQty || false,
          purchasePrice: item.purchasePrice || 0,
          stockMasterId: item.stockMasterId || "",
          location: item.location || "",
          manufactureDate: item.manufactureDate || "",
        });

        // Update total quantity
        grouped[key].totalQuantity += Number(item.quantity) || 0;
      });

      // Convert grouped object to array and add remainingDays to each item
      response.data.data = Object.values(grouped).map((item: any) => ({
        ...item,
        remainingDays: item.expiry
          ? differenceInCalendarDays(new Date(item.expiry), new Date())
          : null,
      }));
    }

    return response;
  }

  /**
   * Update stock master dates (manufacture date and expiry date)
   *
   * @param fid - Franchise ID
   * @param batchId - Batch ID
   * @param payload - Object containing manufactureDate and expiry
   * @returns Promise with update response
   */
  static async updateStockMasterDates(
    fid: string,
    batchId: string,
    payload: { manufactureDate: Date; expiry: Date }
  ) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/stockmaster/${fid}/${batchId}/dates`,
      "PATCH",
      payload
    );
  }

  /**
   * Create a new batch
   *
   * @param fid - Franchise ID
   * @param payload - Object containing batch creation data
   * @returns Promise with batch creation response
   */
  static async createBatch(
    fid: string,
    payload: {
      barcode: string;
      stockMasterId: string;
      quantity: number;
      expiry?: string;
      manufactureDate?: string;
      purchasePrice: number;
    }
  ) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/${fid}/batch/create`,
      "POST",
      payload
    );
  }

  static async addBarcode(fid: string, masterId: string, barcode: string) {
    return AjaxService.request(
      `${this.BASE_URL}inventory/stock/stockmaster/${fid}/${masterId}/barcode`,
      "PATCH",
      { barcode }
    );
  }

  /**
   * Update snapshot master data with used quantities from snapshots
   *
   * @param snapshotMasterData - Array of snapshot master data items with masters array
   * @param usedSnapshots - Array of snapshots with id and quantity
   * @returns Updated snapshot master data with usedQty values and enteredStock totals
   */
  static updateMasterDataWithUsedQuantities(
    snapshotMasterData: SnapshotMasterItem[],
    usedSnapshots: UsedSnapshot[],
    reduceStock: boolean = false
  ) {
    if (!Array.isArray(snapshotMasterData) || !Array.isArray(usedSnapshots)) {
      return snapshotMasterData;
    }

    return snapshotMasterData.map((item) => {
      // Calculate the sum of usedQty from masters array and compute available quantity
      const mastersWithUsedQty = item.masters.map((snapshotMaster) => {
        // Find matching snapshot by id
        const matchingSnapshot = usedSnapshots.find(
          (snapshot) => snapshot.id === snapshotMaster._id
        );
        const usedQty = matchingSnapshot ? matchingSnapshot.quantity : 0;
        if (reduceStock) {
          // Reduce the master quantity itself to reflect consumed stock
          const newQuantity = Math.max(
            0,
            (snapshotMaster.quantity || 0) - usedQty
          );
          return {
            ...snapshotMaster,
            quantity: newQuantity,
            usedQty: usedQty,
            availableQty: newQuantity,
          };
        }

        const availableQty = Math.max(
          0,
          (snapshotMaster.quantity || 0) - usedQty
        );
        return {
          ...snapshotMaster,
          usedQty: usedQty,
          availableQty: availableQty,
        };
      });

      const totalUsedQty = mastersWithUsedQty.reduce(
        (sum, snapshotMaster) => sum + (snapshotMaster.usedQty || 0),
        0
      );

      // Compute available total quantity. If reduceStock is requested, also update totalQuantity
      const availableTotalQuantity = Math.max(
        0,
        (item.totalQuantity || 0) - totalUsedQty
      );
      if (reduceStock) {
        const newTotal = availableTotalQuantity;
        return {
          ...item,
          totalQuantity: newTotal,
          enteredStock: totalUsedQty,
          availableTotalQuantity,
          masters: mastersWithUsedQty,
        };
      }

      return {
        ...item,
        enteredStock: totalUsedQty,
        availableTotalQuantity,
        masters: mastersWithUsedQty,
      };
    });
  }

  static async startPicking(orderId: string) {
    return AjaxService.request(`${this.BASE_URL}sales/picking/create`, "POST", {
      orderId,
    });
  }

  static async removePickingItem(orderId: string, dealId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${orderId}/items/remove`,
      "POST",
      { dealId }
    );
  }

  static async getOrderPicking(orderId: string, params?: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/order/${orderId}/list`,
      "GET",
      params || {}
    );
  }

  static async updatePicking(orderId: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${orderId}/items`,
      "PUT",
      params
    );
  }

  static async closePicking(orderId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${orderId}/close`,
      "POST",
      {}
    );
  }

  static async cancelPicking(pickId: string, reason: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${pickId}/cancel`,
      "POST",
      { remarks: reason }
    );
  }

  static async continuePicking(orderId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${orderId}/continue`,
      "POST",
      {}
    );
  }

  static async getPickingDetail(pickingId: string) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${pickingId}/fetch`,
      "GET",
      {}
    );
  }

  static async removePickedItem(
    pickingId: string,
    params: Record<string, any>
  ) {
    return AjaxService.request(
      `${this.BASE_URL}sales/picking/${pickingId}/items/cancel`,
      "POST",
      params
    );
  }
}

export default RackBinService;
