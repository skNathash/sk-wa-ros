import { API, API_VERSION } from "~/constants";
import Ajax from "./AjaxService";

class CoinDashService {
  static readonly BASE_URL = API;
  static readonly API_VERSION = API_VERSION;

  static getCoinsRewardedCount(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/coins/rewarded",
      "GET",
      params
    );
  }

  static getCoinsRedeemedCount(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/coins/redeemed",
      "GET",
      params
    );
  }

  static getRegCustomersCount(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/registered/customer",
      "GET",
      params
    );
  }

  static getClubCreatedCount(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/club/created",
      "GET",
      params
    );
  }

  static getTotalOrdersCount(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/club/customers/total",
      "GET",
      params
    );
  }

  static getRewardList(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/customer/reward/list",
      "GET",
      params
    );
  }

  static getCustomerList(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL +
        "/customer/" +
        this.API_VERSION +
        "/customer/club/reward/list",
      "GET",
      params
    );
  }

  static getRewardCategoryList(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/reward/category/list",
      "GET",
      params
    );
  }

  static getMonthlySummary(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL +
        "/customer/" +
        this.API_VERSION +
        "/monthly/coins/summary",
      "GET",
      params
    );
  }

  static getMonthlyCustomerGrowth(params: Record<string, any>) {
    return Ajax.request(
      this.BASE_URL +
        "/customer/" +
        this.API_VERSION +
        "/monthly/customer/growth",
      "GET",
      params
    );
  }

  static getCustMonthlySales(id: string, params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL +
        "/oms/" +
        this.API_VERSION +
        "/fetch/POSSalesOrder/customerWise",
      "GET",
      params
    );
  }

  static getClubMembers(id: string, params: Record<string, any> = {}) {
    const p = {
      ...{
        queryType: "childSummary",
        filter: {
          senderRefId: id,
        },
      },
      ...params,
    };

    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/referalCoinsData",
      "GET",
      p
    );
  }

  static getCoinsCategorySummary(params: Record<string, any> = {}) {
    const p = {
      ...{
        queryType: "overall",
        outputType: "list",
      },
      ...params,
    };

    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/referalCoinsData",
      "GET",
      p
    );
  }

  static getOrderCategoryData(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL +
        "/customer/" +
        this.API_VERSION +
        "/category/order/reward",
      "GET",
      params
    );
  }

  static getStoreWise(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/store/list",
      "GET",
      params
    );
  }

  static getClubWise(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/club/list",
      "GET",
      params
    );
  }

  static getClubMembersSummary(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL +
        "/customer/" +
        this.API_VERSION +
        "/club/cards/data/count",
      "GET",
      params
    );
  }

  static getClubMembersList(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/club/member/list",
      "GET",
      params
    );
  }

  static async getClubOrders(params: Record<string, any> = {}) {
    const r = await Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/club/order/list",
      "GET",
      params
    );

    return r;
  }

  static getRegCustomerList(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL + "/customer/" + this.API_VERSION + "/order/list",
      "GET",
      params
    );
  }

  static getTopPurchaseCustomerList(params: Record<string, any> = {}) {
    return Ajax.request(
      this.BASE_URL +
        "/customer/" +
        this.API_VERSION +
        "/top/purchase/customer/list",
      "GET",
      params
    );
  }
}

export default CoinDashService;
