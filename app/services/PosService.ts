import { merge, orderBy } from "lodash";
import {
  API,
  API_VERSION,
  POS_CART_ITEM_ADDED,
  POS_CART_ITEM_REMOVED,
  POS_ORDER_PLACED,
} from "~/constants";
import AjaxService from "./AjaxService";
import CommonService from "./CommonService";
import AuthService from "./AuthService";
import {
  set,
  parseISO,
  formatISO,
  differenceInCalendarDays,
  isValid,
  formatDistanceToNow,
} from "date-fns";
import MiscService from "./MiscService";

/**
 * Service for POS related API calls
 */
export class PosService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  /**
   * Get POS orders
   *
   * @param params - Query parameters for fetching POS orders
   * @returns Promise with POS orders data
   */
  public static async getPosOrders(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pos/order`,
      "GET",
      params
    );
  }

  public static async getPosOrdersCount(params: Record<string, any> = {}) {
    const p = merge({}, params, { outputType: "count" });
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pos/order`,
      "GET",
      p
    );
  }

  /**
   * Format POS order response data with calculated fields and date formatting using date-fns
   * @param data - POS order data object
   * @returns formatted data object
   */
  static formatPosOrderResp(data: any) {
    // Use date-fns for date manipulation

    if (data.deliveryTimeSlot?.date) {
      const dt =
        typeof data.deliveryTimeSlot.date === "string"
          ? parseISO(data.deliveryTimeSlot.date)
          : data.deliveryTimeSlot.date;

      if (isValid(dt)) {
        data.deliveryTimeSlot._from = formatISO(
          set(dt, {
            hours: data.deliveryTimeSlot.from || 0,
            minutes: 0,
            seconds: 0,
          })
        );
        data.deliveryTimeSlot._to = formatISO(
          set(dt, {
            hours: data.deliveryTimeSlot.to || 0,
            minutes: 0,
            seconds: 0,
          })
        );

        const now = new Date();
        const endTime = new Date(data.deliveryTimeSlot._to);
        data.deliveryTimeSlot.remainingTime = formatDistanceToNow(endTime, {
          addSuffix: true,
          includeSeconds: true,
        });

        if (endTime < now) {
          data.deliveryTimeSlot.remainingTime = "Time Expired";
        }
      }
    }

    if (data.returnBefore) {
      const now = new Date();
      const returnBeforeDate =
        typeof data.returnBefore === "string"
          ? parseISO(data.returnBefore)
          : data.returnBefore;
      data._returnDiff = isValid(returnBeforeDate)
        ? differenceInCalendarDays(returnBeforeDate, now)
        : 0;
      data._canReturn = data._returnDiff >= 0;
    } else {
      data._returnDiff = 0;
      data._canReturn = false;
    }

    const amt =
      (data.paymentModes || []).find(
        (v: any) => v.modeType == "FranchiseeBalance"
      ) || {};
    data._payableAmt = data.invoiceAmount || amt?.collectAmount || amt?.amount;
    data._payableAmtActual = amt.amount || 0;
    data._ordPlacedBy = data.manpowerFranchiseInfo
      ? data.manpowerFranchiseInfo
      : data.franchiseInfo;

    const dealLevelKcApplied = (data.deals || []).filter(
      (e: any) => e?.loyaltyPoints?.customerPoints > 0
    );
    data._hadDealLevelKc = dealLevelKcApplied.length > 0;
    data._totalKcRewardedDeals = dealLevelKcApplied.length;

    let totMrp = 0;
    let totPrice = 0;
    let totFreePrdPrice = 0;

    (data.deals || []).forEach((e: any) => {
      e._totalMrp = e.quantity * e.mrp;
      e._totalPrice = e.quantity * e.b2bPrice;

      totMrp += e._totalMrp;

      (e.offerDetails?.deals || []).forEach((x: any) => {
        x._totalMrp = x.quantity * e.mrp;
        x._totalPrice = x.quantity * e.b2bPrice;
        totMrp += x._totalMrp;
        if (e.isFree) {
          totFreePrdPrice += x._totalMrp;
        } else {
          totPrice += x._totalPrice;
        }
      });

      if (e.isFree) {
        totFreePrdPrice += e._totalMrp;
      } else {
        totPrice += e._totalPrice;
      }

      if (e["taxInfo"] && e["taxInfo"]["gst"]) {
        // Use CommonService for before tax calculation
        e["_beforeTaxPrice"] = CommonService.calculateBeforeTax(
          e["roundPrice"],
          e["taxInfo"]["gst"]
        );
      }

      e.priceSlabApplicable =
        e.priceSlabApplicable === "true" || e.priceSlabApplicable === true;

      if (e.additionalDiscountConfig?.additionalDiscount) {
        e._normalDiscPrice =
          e.mrp - e.mrp * (e.additionalDiscountConfig.discount / 100);
      }
    });

    data._totalMrp = totMrp;
    data._totalPrice = totPrice;
    data._itemSavings = totMrp - totPrice + totFreePrdPrice;
    data._redeemedCoins = {
      value: data.loyaltyPoints?.customerRedeemedValues || 0,
    };
    data._rewardedCoins = {
      points: data.loyaltyPoints?.customerPoints || 0,
    };

    if (data.status == "Closed" && data.requestedId) {
      data._statusLbl = "Ready to Ship";
      data._statusColor = "warning";
    } else if (data.status == "Closed" && !data.requestedId) {
      data._statusLbl = "Delivered";
      data._statusColor = "success";
    } else if (data.status == "Cancelled" || data.status == "Returned") {
      data._statusLbl = data.status;
      data._statusColor = "danger";
    } else {
      data._statusLbl = data.status;
      data._statusColor = "primary";
    }

    // Add status label and color to each deal
    if (Array.isArray(data.deals)) {
      data.deals = data.deals.map((deal: any) => {
        let _statusLbl, _statusColor;
        if (deal.status == "Closed" && deal.requestedId) {
          _statusLbl = "Ready to Ship";
          _statusColor = "warning";
        } else if (deal.status == "Closed" && !deal.requestedId) {
          _statusLbl = "Delivered";
          _statusColor = "success";
        } else if (deal.status == "Cancelled" || deal.status == "Returned") {
          _statusLbl = deal.status;
          _statusColor = "danger";
        } else {
          _statusLbl = deal.status;
          _statusColor = "primary";
        }
        return {
          ...deal,
          _statusLbl,
          _statusColor,
        };
      });
    }

    // prepare partner related data
    if (data.isPartnerOrder) {
      data._partner = {
        name: data.thirdPartyPartnerName || data.thirdPartyPartnerId,
        orderId: data.thirdPartyPartnerOrderId || "",
        id: data.thirdPartyPartnerId || "",
      };
    }

    if (data.sellInLooseQty) {
      data._lastCustomerOrderQty = CommonService.roundedByDecimalPlace(
        data.lastCustomerOrderQty / 1000,
        3
      );
    } else {
      data._lastCustomerOrderQty = data.lastCustomerOrderQty;
    }

    return { ...data };
  }

  /**
   * Get inventory data
   *
   * @param params - Query parameters for filtering inventory
   * @returns Promise with inventory data
   */
  public static getInventory(params?: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}franchise/${this.API_VERSION}/fetch/stockInventorySummary`,
      "GET",
      params
    );
  }

  /**
   * Get deal inventory data
   *
   * @param params - Query parameters for filtering deal inventory
   * @returns Promise with deal inventory data
   */
  public static async getDealInventory(params?: Record<string, any>) {
    const dealParams = {
      ...params,
      groupbycond: "deal",
      groupbycondName: "name",
    };
    const response = await this.getInventory(dealParams);

    if (response.statusCode !== 200 || !Array.isArray(response.data)) {
      return response;
    }

    const processedData = response.data.map((item) => {
      const finalSellingPrice = CommonService.roundedByDecimalPlace(
        item.retailerSellingPrice || item.b2cPrice || item.mrp || 0,
        2
      );

      const stockMovement = this.calculateStockMovement(
        item.salesData,
        item.lastPurchasedDate
      );

      return {
        ...item,
        hasLastPurDt: !item.isOwnedByThirdparty && item.purchaseData?.on,
        hasSubscribeDt:
          !item.isOwnedByThirdparty &&
          !item.hasLastPurDt &&
          item.subscribedDate,
        _finalSellingPrice: finalSellingPrice,
        skLanding: item.slc || 0,
        storeLanding: item.b2bprice || 0,
        _pnl: this.calculatePnL(finalSellingPrice || 0, item.pp || 0),
        _networkPnl: { value: item.networkProfit },
        _skPnl: this.calculatePnL(item.storeLanding, item.skLanding),
        _qty: item.sellInLooseQty
          ? CommonService.roundedByDecimalPlace(item.qty / 1000, 3)
          : item.qty,
        hasPriceSlab: item.posPriceSlab?.length > 0,
        posPriceSlab: this.preparePosPriceSlabData(
          item.posPriceSlab,
          item.mrp,
          item.sellInLooseQty
        ),
        lastPurchasedDate: item.hasLastPurDt ? item.purchaseData?.on : null,
        subscriptionDate: item.hasSubscribeDt ? item.subscribedDate : null,
        salesTrend: this.calculateSalesTrend(item.salesData, item.qty),
        _lastCustomerOrderQty: item.sellInLooseQty
          ? CommonService.roundedByDecimalPlace(
              item.lastCustomerOrderQty / 1000,
              3
            )
          : item.lastCustomerOrderQty,
        salesData: this.processSalesData(item.salesData, item.sellInLooseQty),
        discount: CommonService.calculateDiscount(item.mrp, finalSellingPrice),
        stockMovement: stockMovement,
        stockMovementColor: this.getStockMovementColor(stockMovement),
      };
    });

    return {
      ...response,
      data: processedData,
    };
  }

  /**
   * Prepare POS price slab data with calculations and formatting
   *
   * @param slabs - Array of price slabs
   * @param mrp - Maximum retail price
   * @param isLooseProduct - Whether the product is sold in loose quantity
   * @returns Processed and sorted price slab data
   */
  private static preparePosPriceSlabData(
    slabs: Array<any> | undefined,
    mrp: number,
    isLooseProduct = false
  ) {
    if (!slabs || !Array.isArray(slabs)) {
      return [];
    }

    const processedSlabs = slabs.map((slab) => {
      const offerPrice = slab.isFixedPrice
        ? slab.price
        : mrp - (slab.disc / 100) * mrp;

      const discount = slab.isFixedPrice
        ? 100 - (offerPrice / mrp) * 100
        : slab.disc;

      const minQty = isLooseProduct
        ? `${CommonService.roundedByDecimalPlace(slab.min / 1000, 4)} kg`
        : slab.min;

      const maxQty = isLooseProduct
        ? `${CommonService.roundedByDecimalPlace(slab.max / 1000, 4)} kg`
        : slab.max;

      return {
        ...slab,
        _mrp: mrp,
        _offerPrice: offerPrice,
        disc: discount,
        _displayDisc: CommonService.roundedByDecimalPlace(discount, 0),
        _normalDisc: CommonService.roundedByDecimalPlace(
          slab._normalDisc || 0,
          0
        ),
        _min: minQty,
        _max: maxQty,
      };
    });

    return processedSlabs.sort((a, b) => a.min - b.min);
  }

  /**
   * Calculate PnL (Profit and Loss) status and color
   */
  public static calculatePnL(finalPrice: number, basePrice: number) {
    const value = finalPrice - basePrice;

    if (value > 0) {
      return { status: "positive", color: "success", value };
    } else if (value < 0) {
      return { status: "negative", color: "danger", value };
    }
    return { status: "neutral", color: "secondary", value };
  }

  /**
   * Get color for stock movement category
   * @param stockMovement - Stock movement category
   * @returns Color string
   */
  private static getStockMovementColor(stockMovement: string): string {
    switch (stockMovement) {
      case "Fast Moving":
        return "success";
      case "Slow Moving":
        return "primary";
      case "Non Moving":
        return "danger";
      case "Recently purchased":
        return "secondary";
      default:
        return "secondary";
    }
  }

  /**
   * Calculate stock movement based on sales data and purchase date
   * @param salesData - Sales data object with different time periods
   * @param lastPurchasedDate - Last purchased date
   * @returns Stock movement category
   */
  private static calculateStockMovement(
    salesData: any,
    lastPurchasedDate?: string | Date
  ): string {
    const now = new Date();

    // Check sales data for movement patterns first
    if (salesData) {
      const sevenDaySales = salesData.sevenday?._qty || 0;
      const fifteenDaySales = salesData.fifteenday?._qty || 0;
      const thirtyDaySales = salesData.thirtyday?._qty || 0;

      // Fast Moving: sales done in 7 days
      if (sevenDaySales > 0) {
        return "Fast Moving";
      }

      // Slow Moving: no sales in 15 days but has sales in 30 days
      if (fifteenDaySales === 0 && thirtyDaySales > 0) {
        return "Slow Moving";
      }

      // Non Moving: no sales in 30 days
      if (thirtyDaySales === 0) {
        return "Non Moving";
      }
    }

    // Check if recently purchased (within 30 days) - this takes precedence over Non Moving
    if (lastPurchasedDate) {
      const purchaseDate =
        typeof lastPurchasedDate === "string"
          ? parseISO(lastPurchasedDate)
          : lastPurchasedDate;

      if (isValid(purchaseDate)) {
        const daysSincePurchase = differenceInCalendarDays(now, purchaseDate);
        if (daysSincePurchase <= 30) {
          return "Recently purchased";
        }
      }
    }

    // Default to Non Moving if no sales data or purchase date
    return "Non Moving";
  }

  /**
   * Calculate sales trend based on 90-day data
   */
  private static calculateSalesTrend(salesData: any, currentQty: number) {
    const avgMonthlyQty = (salesData?.ninetyday?._qty || 0) / 4;
    return avgMonthlyQty > 0 && avgMonthlyQty > (currentQty || 0) ? "high" : "";
  }

  /**
   * Process sales data for different time periods
   */
  private static processSalesData(salesData: any, sellInLooseQty: boolean) {
    const periods = ["ninetyday", "thirtyday", "fifteenday", "sevenday"];

    if (!salesData) return salesData;

    periods.forEach((period) => {
      if (salesData[period]) {
        salesData[period]._qty = sellInLooseQty
          ? CommonService.roundedByDecimalPlace(salesData[period].qty / 1000, 3)
          : salesData[period].qty;
      }
    });

    return salesData;
  }

  /**
   * Get menus data
   *
   * @param params - Query parameters for filtering menus
   * @returns Promise with menus data
   */
  public static getMenus(params?: Record<string, any>) {
    const p = { ...params, groupbycond: "menu", groupbycondName: "name" };
    return this.getInventory(p);
  }

  /**
   * Get categories data
   *
   * @param params - Query parameters for filtering categories
   * @returns Promise with categories data
   */
  public static getCategories(params?: Record<string, any>) {
    const p = { ...params, groupbycond: "category", groupbycondName: "name" };
    return this.getInventory(p);
  }

  /**
   * Get brands data
   *
   * @param params - Query parameters for filtering brands
   * @returns Promise with brands data
   */
  public static getBrands(params?: Record<string, any>) {
    const p = { ...params, groupbycond: "brand", groupbycondName: "name" };
    return this.getInventory(p);
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

  public static async getRackBin(fid: string, locationId: string, params: any) {
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

  public static async getInventorySummary(params: any) {
    return await AjaxService.request(
      `${this.BASE_URL}franchise/${this.API_VERSION}/inventory/cards/summary/list`,
      "GET",
      params
    );
  }

  public static async generateShipmentPosOtp(params: any) {
    return await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posShipment/assignAgent`,
      "POST",
      params
    );
  }

  public static async resendShipmentPosOtp(params: any) {
    return await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posShipment/assignAgent/resendotp`,
      "POST",
      params
    );
  }

  public static async validateShipmentPosOtp(params: any) {
    return await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posShipment/assignAgent/verifyotp`,
      "POST",
      params
    );
  }

  public static async getPosShipments(params: any) {
    const r = await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posShipment/shipmentDetail`,
      "GET",
      params
    );

    if (r.statusCode === 200 && r.data?.length > 0) {
      r.data.forEach((e: any) => {
        e._cancelledRemarks = e.statusUpdateLog?.find(
          (x: any) => x.status === "Cancelled"
        )?.remark;
      });
    }

    return r;
  }

  public static async rejectShipment(id: string, params = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posShipment/shipmentDetail/cancelled/${id}`,
      "PUT",
      params
    );
  }

  public static async verifyDeliveryCode(id: string, params: any) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posShipment/shipmentDetail/accepted/${id}`,
      "PUT",
      params
    );
  }

  public static calculatePriceOnUom(
    price: number,
    qty: number,
    uomConfig: any,
    selected: string
  ) {
    const configs = [
      {
        config: "gm",
        types: [
          {
            type: "gm",
            value: () => {
              const oneGm = price / (uomConfig?.packsize || 1);
              return qty * oneGm;
            },
          },
          {
            type: "kg",
            value: () => {
              const oneGm = price / (uomConfig?.packsize || 1);
              return qty * 1000 * oneGm;
            },
          },
        ],
      },
      {
        config: "kg",
        types: [
          {
            type: "gm",
            value: () => (qty / 1000) * (price / (uomConfig?.packsize || 1)),
          },
          {
            type: "kg",
            value: () => (price / (uomConfig?.packsize || 1)) * qty,
          },
        ],
      },
    ];

    const c: any = configs.find((x) => x.config == uomConfig?.uom) || {};

    if (c && c.types) {
      const t = c.types.find((x: any) => x.type == selected);
      if (t && t.value) {
        return { total: t.value() };
      } else {
        return { total: 0 };
      }
    } else {
      return { total: 0 };
    }
  }

  /**
   * Get RSP (Retail Selling Price) configuration list
   *
   * @param params - Query parameters for filtering RSP configs
   * @returns Promise with RSP configuration data including calculated selling prices
   */
  public static async getRspConfigList(params: Record<string, any> = {}) {
    const response = await AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/customerCatalogPriceConfig/list`,
      "GET",
      params
    );

    if (response.statusCode !== 200 || !Array.isArray(response.data)) {
      return response;
    }

    let processedConfigs = response.data.map((config: any) => {
      // Use the new calculateFinalSellingPrice for consistency
      const sellingPrice = this.calculateFinalSellingPrice({
        isFixedPrice: config.isFixedPrice,
        price: config.fixedPrice,
        discount: config.discount,
        type: config.applicableFor === "Network" ? "network" : undefined,
        deal: {
          mrp: config.mrp,
          pp: config.b2bPrice || config.pp,
        },
      });
      const pnl = this.calculatePnL(
        sellingPrice,
        config.applicableFor === "Network"
          ? config.b2bPrice || config.pp
          : config.pp
      );
      return {
        ...config,
        sellingPrice: sellingPrice,
        _pnl: pnl,
      };
    });

    return {
      ...response,
      data: processedConfigs,
    };
  }

  /**
   * Update RSP (Retail Selling Price) configuration
   *
   * @param params - Parameters for updating RSP configuration
   * @returns Promise with update response
   */
  public static async updateRspConfig(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/customerCatalogPriceConfig/update`,
      "PUT",
      params
    );
  }

  static async createRspConfig(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}catalog/seller-price-config/create-or-update/process`,
      "POST",
      params
    );
  }

  public static async getSellerPriceConfigLogs(
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}catalog/seller-price-config/fetch/logs`,
      "GET",
      params
    );
  }

  static formatPriceConfigLogData(data: any[]) {
    const getApplicableForText = (applicableFor: string) => {
      switch (applicableFor?.toLowerCase()) {
        case "customer":
          return "B2C";
        case "network":
          return "B2B";
        default:
          return applicableFor;
      }
    };

    // Helper function to get badge variant for applicable for
    const getApplicableForVariant = (applicableFor: string) => {
      switch (applicableFor?.toLowerCase()) {
        case "customer":
          return "success";
        case "network":
          return "warning";
        default:
          return "default";
      }
    };

    return data.map((item) => {
      const prevPrice = Number(item.oldData?.price || 0);
      const newPrice = Number(item.newData?.price || 0);
      const change = newPrice - prevPrice;
      const percent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
      const isPositive = change > 0;

      return {
        ...item,
        prevPrice,
        newPrice,
        change,
        percent,
        isPositive,
        applicableForText: getApplicableForText(item.applicableFor),
        applicableForVariant: getApplicableForVariant(item.applicableFor),
        newMrp: Number(item.newData?.mrp || 0),
      };
    });
  }

  /**
   * Get RSP configuration details by ID
   *
   * @param configId - RSP configuration ID
   * @returns Promise with RSP configuration details
   */
  public static async getRspConfigById(configId: string) {
    const response = await this.getRspConfigList({
      filter: {
        _id: configId,
      },
    });

    if (response.statusCode === 200 && response.data?.length > 0) {
      return {
        ...response,
        data: response.data[0],
      };
    }

    return response;
  }

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

    // Format the response to include alias names for racks
    if (Array.isArray(response.data)) {
      const rackAliasMap: Record<string, string> = {
        D: "Damage",
        E: "Expired",
        N: "Near Expiry",
      };
      response.data = response.data.map((item: any) => {
        // Update alias name only if LocationId is 'L2'
        if (item.LocationId === "L2") {
          return {
            ...item,
            aliasName: rackAliasMap[item.RackName] || item.RackName, // Use alias or original name
          };
        }
        return item; // Return unchanged item if LocationId is not 'L2'
      });
    }
    return response;
  }

  static getRackBinAllotmentPercent(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackAndBin/fetchPercentageWise`,
      "GET",
      params
    );
  }

  static downloadRackBin(sellerId: string, params: Record<string, any> = {}) {
    let p = merge({}, { filter: { "sellerInfo._id": sellerId } }, params);
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/report/download`,
      "GET",
      p
    );
  }

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

  public static async getPosReturns(params: Record<string, any> = {}) {
    const r = await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pos/return`,
      "GET",
      params
    );

    if (r.statusCode === 200 && Array.isArray(r.data)) {
      r.data = r.data.map((item: any) => {
        item._statusLabel = item.status === "Pending" ? "Pending" : "Returned";
        item._statusColor = item.status === "Pending" ? "warning" : "success";
        return item;
      });
    }

    return r;
  }

  public static async getPosReturnsCount(params: Record<string, any> = {}) {
    const p = merge({}, params, {
      outputType: "count",
    });
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pos/return`,
      "GET",
      p
    );
  }

  public static async moveStockToOtherLocation(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${
        this.API_VERSION
      }/seller/${AuthService.getLoggedInSellerId()}/stock/movement`,
      "POST",
      params
    );
  }

  public static async getCashCollectFromDelivery(
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posSettlement/fetchData`,
      "GET",
      params
    );
  }

  public static async collectCashFromDelivery(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posSettlement/update`,
      "PUT",
      params
    );
  }

  public static async getPosCashDeposit(params: Record<string, any> = {}) {
    const r = await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posCashDeposit/fetchData`,
      "GET",
      params
    );

    if (r.statusCode === 200 && Array.isArray(r.data)) {
      r.data = r.data.map((item: any) => {
        if (item.status === "Created") {
          item._statusDisplay = "Deposit pending";
          item._statusColor = "danger";
        } else if (item.status === "PendingApproval") {
          item._statusDisplay = "Approval Pending";
          item._statusColor = "warning";
        } else if (item.status === "ProofPending") {
          item._statusDisplay = "Rejected";
          item._statusColor = "danger";
        } else if (item.status === "Approved") {
          item._statusDisplay = "Approved";
          item._statusColor = "success";
        }
        return { ...item };
      });
    }

    return r;
  }

  /**
   * Calculate the final selling price based on config and deal data
   * Logic matches PriceConfigModal.tsx
   * @param params - { isFixedPrice, price, discount, type, deal }
   * @returns number
   */
  public static calculateFinalSellingPrice({
    isFixedPrice,
    price,
    discount,
    type,
    deal,
  }: {
    isFixedPrice: boolean;
    price: number | string;
    discount: number | string;
    type?: string;
    deal: {
      mrp?: number;
      pp?: number;
    };
  }): number {
    const mrp = deal?.mrp || 0;
    const pp = deal?.pp || 0;
    const discountValue = Number(discount) || 0;
    if (isFixedPrice) {
      return Number(price) || 0;
    } else {
      return mrp * (1 - discountValue / 100);
    }
  }

  /**
   * Import store products for a seller
   * @param params - Parameters for importing products
   * @returns Promise with import response
   */
  public static async importStoreProducts(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/seller/import/store/products`,
      "POST",
      params
    );
  }

  /**
   * Get imported store products for a seller
   * @param params - Query parameters for fetching imported products
   * @returns Promise with imported products data
   */
  public static async getImportedStoreProducts(
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/seller/import/store/products`,
      "GET",
      params
    );
  }

  public static async createPosPoForSellerImportStoreProducts(
    params: Record<string, any>
  ) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/create/pospo/seller/import/store/products`,
      "POST",
      params
    );
  }

  /**
   * Update imported store product by ID
   * @param id - The import product ID (e.g., SKIMP21)
   * @param params - Parameters for updating the imported product
   * @returns Promise with update response
   */
  public static async updateImportedStoreProductById(
    id: string,
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/seller/import/store/products/${id}`,
      "PUT",
      params
    );
  }

  public static async sendNonSyncedItemsToEmail(
    id: string,
    importIds: string[]
  ) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/send/non/synced/items/to/email/${id}`,
      "PUT",
      { importIds }
    );
  }

  public static async syncImportedStoreProducts(
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/sync/seller/import/store/products`,
      "PUT",
      params
    );
  }

  public static async getDeliveryTimeSlot(params: any = {}) {
    const url = `${this.BASE_URL}franchise/deliverytimeslot/config`;
    const r = await AjaxService.request(url, "GET", params);
    if (Array.isArray(r.data)) {
      r.data.forEach((e) => {
        if (Array.isArray(e.slab)) {
          e.slab.forEach((v: any) => {
            const { fromHour, fromMins, toHour, toMins } =
              CommonService.getDelvTimeHourMin(v);
            v._fromHour = fromHour;
            v._fromMins = fromMins;
            v._toHour = toHour;
            v._toMins = toMins;
          });
        }
      });
    }
    return r;
  }

  public static async createDeliveryTimeSlot(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}franchise/deliverytimeslot/config`,
      "POST",
      params
    );
  }

  public static async updateDeliveryTimeSlot(id: string, params: any) {
    return AjaxService.request(
      `${this.BASE_URL}franchise/deliverytimeslot/config/${id}`,
      "PUT",
      params
    );
  }

  public static async getClubReqDeliverySummary(params: Record<string, any>) {
    const r = await AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/fetch/orderlistBySlot`,
      "GET",
      params
    );
    return r;
  }

  static getPosOrderStatusGroups() {
    const statusGroups = [
      {
        key: "Delivered",
        name: "Delivered",
        statuses: ["Delivered", "Partially Returned"],
        statusType: "success",
        displayStatus: "Delivered",
      },
      {
        key: "Yet to Deliver",
        name: "Yet to Deliver",
        statuses: ["Closed", "Shipped"],
        statusType: "warning",
        displayStatus: "Yet to Deliver",
      },
      {
        key: "Returned",
        name: "Returned",
        statuses: ["Returned"],
        statusType: "danger",
        displayStatus: "Returned",
      },
    ];

    return statusGroups;
  }

  public static async createShippingCharge(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/shippingCharge/config`,
      "POST",
      params
    );
  }

  public static async updateShippingCharge(id: string, params: any) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/shippingCharge/config/${id}`,
      "PUT",
      params
    );
  }

  public static async getShippingCharge(params: any = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/shippingCharge/config`,
      "GET",
      params
    );
  }

  public static async getSalesAnalytics(params: any = {}) {
    const p = merge({}, params, {
      filter: {
        $or: [
          { "franchiseInfo.id": AuthService.getLoggedInUserId() },
          { franchise: AuthService.getLoggedInUserId() },
        ],
      },
    });
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/fetch/TopSellingBrandCatDeal`,
      "GET",
      p
    );
  }

  public static async getPOSForGraph(params: any = {}) {
    const p = merge({}, params, {
      filter: {
        $or: [
          { "franchiseInfo.id": AuthService.getLoggedInUserId() },
          { franchise: AuthService.getLoggedInUserId() },
        ],
      },
    });
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/fetch/POSForGraph`,
      "GET",
      params
    );
  }

  static async getSalesBirdsEyeView(params: any = {}) {
    return AjaxService.request(
      `${this.BASE_URL}analytics/${this.API_VERSION}/franchise/orders/sales-summary`,
      "GET",
      params
    );
  }

  public static async updateBinDetails(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/update/config`,
      "PUT",
      params
    );
  }

  public static async getBinLogs(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/config/log`,
      "GET",
      params
    );
  }

  public static async getBinLogsCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}deal/${this.API_VERSION}/rackandbin/config/log/count`,
      "GET",
      params
    );
  }

  public static async updateCashDeposit(id: string, params = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/posCashDeposit/uploadDoc/${id}`,
      "PUT",
      params
    );
  }

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

  public static async changeReturnStatus(id: string, params: any) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/pos/return/update/${id}`,
      "PUT",
      params
    );
  }

  static async addItemToCart(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/item`,
      "POST",
      params
    );
  }

  /**
   * Add multiple items to a cart in one call (used by the reorder flow).
   * `items` carries one entry per deal: { dealId, quantity, sellerId, cartId }
   * plus snapshots for B2C (and quick-checkout B2B) carts; plain B2B sends [].
   */
  static async addItemsToCartBulk(params: {
    items: Array<{
      dealId: string;
      quantity: number;
      sellerId: string;
      cartId?: string;
      snapshots?: any[];
    }>;
  }) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/item/bulk`,
      "POST",
      params
    );
  }

  static async removeItemFromCart(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/item/remove`,
      "POST",
      params
    );
  }

  static async getCart(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/list`,
      "GET",
      params
    );
  }

  static async addCartDiscount(params: { discount: number; cartId: string }) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/discount/add`,
      "POST",
      params
    );
  }

  static async removeCartDiscount(params: { cartId: string }) {
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/discount/remove`,
      "POST",
      params
    );
  }

  static createGuestCart(params: Record<string, any> = {}) {
    const p = merge({}, params, {
      franchiseId: AuthService.getLoggedInUserId(),
      franchiseName: AuthService.getLoggedInUser()?.name || "",
    });
    return AjaxService.request(
      `${this.BASE_URL}sales/cart/create`,
      "POST",
      params
    );
  }

  /**
   * Create POS order
   * @param params - Order creation parameters
   * @returns Promise with order creation response
   */
  static async createPosOrder(params: {
    cartId: string;
    paymentType: string;
    customerInfo: {
      customerType: string;
      name: string;
      customerId: string;
    };
    billingAddress: {
      mobileNo: number;
      address: string;
    };
  }) {
    return AjaxService.request(
      `${this.BASE_URL}sales/pos/order/create`,
      "POST",
      params
    );
  }

  static triggerAddToCartEvent(params: Record<string, any>) {
    MiscService.createEvent(POS_CART_ITEM_ADDED, params);
  }

  static triggerRemoveFromCartEvent(params: Record<string, any>) {
    MiscService.createEvent(POS_CART_ITEM_REMOVED, params);
  }

  static triggerOrderPlacedEvent(params: Record<string, any>) {
    MiscService.createEvent(POS_ORDER_PLACED, params);
  }

  static async cloneDeliveryTimeSlot(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}franchise/deliverytimeslot/config/clone-recent`,
      "POST",
      params
    );
  }

  public static async removeDefaultDeliveryTimeSlot(
    params: { hardDelete: boolean; franchiseId?: string } = {
      hardDelete: false,
    }
  ) {
    const requestParams = {
      ...params,
      franchiseId: params.franchiseId || AuthService.getLoggedInUserId(),
      id: params.franchiseId,
    };
    return AjaxService.request(
      `${this.BASE_URL}franchise/deliverytimeslot/config/remove-default`,
      "DELETE",
      requestParams
    );
  }

  /**
   * Create default delivery timeslot configuration
   * @param params - Parameters for creating default config
   * @returns Promise with creation response
   */
  public static async createDefaultDeliveryTimeSlotConfig(params: {
    franchiseId: string;
    franchiseInfo: {
      name: string;
      id: string;
      refId: string;
    };
  }) {
    return AjaxService.request(
      `${this.BASE_URL}franchise/deliverytimeslot/config/internal/create-default`,
      "POST",
      params
    );
  }

  public static async updateDeliverShipment(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}sales/shipment/updateShipment`,
      "PUT",
      params
    );
  }

  static getThermalInvoiceUrl(invoiceNo: string) {
    return `${this.BASE_URL}sales/pos/invoice/${invoiceNo}/thermal-print`;
  }

  static printThermalInvoice(invoiceNo: string) {
    const url = this.getThermalInvoiceUrl(invoiceNo);
    CommonService.windowOpenHandler(url, () => {});
  }
}

export default PosService;
