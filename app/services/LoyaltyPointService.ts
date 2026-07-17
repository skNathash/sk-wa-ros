import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import { merge } from "lodash";
import AuthService from "./AuthService";

class LoyaltyPointService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  static async getRewardPoints(params: any) {
    return AjaxService.request(
      `${API}loyaltypoints/accounts/calculate-reward-points`,
      "POST",
      params
    );
  }

  static async calculateRedeemPoints(params: any) {
    return AjaxService.request(
      `${API}loyaltypoints/accounts/calculate-redeem-points`,
      "POST",
      params
    );
  }

  static async redeemAtStorePoints(params: any) {
    return AjaxService.request(
      `${API}loyaltypoints/coin-blocking/initiate`,
      "POST",
      params
    );
  }

  static getTransactionRedirectionUrl(type: string, id: string) {
    if (type === "pos") {
      return `/dashboard/orders/view/${id}`;
    } else if (type === "redeem") {
      return `/dashboard/points/list/${id}`;
    }
  }

  static getTransactionTypeOptions() {
    return [
      { value: "earn", label: "Rewarded", langKey: "rewarded" },
      { value: "redeem", label: "Redeemed", langKey: "redeemed" },
      { value: "expired", label: "Expired", langKey: "expired" },
    ];
  }

  static formatStatemenResponse(data: Record<string, any>) {
    let t: Record<string, any> = {
      ...data,
      _typeLbl: data.type,
      _typeColor: "primary",
      _redirectionUrl: this.getTransactionRedirectionUrl(
        data.transactionType,
        data.transactionId
      ),
    };

    if (t.type === "earn") {
      t._typeLbl = "Rewarded";
      t._typeColor = "success";
    } else if (t.type === "redeem") {
      t._typeLbl = "Redeemed";
      t._typeColor = "destructive";
    } else if (t.type === "expired") {
      t._typeLbl = "Expired";
      t._typeColor = "warning";
    } else if (t.type === "cancel") {
      t._typeLbl = "Cancelled";
      t._typeColor = "destructive";
    }

    return t;
  }

  static async getRewardRedeemSummary(
    params: Record<string, any>
  ): Promise<{ totalEarned: number; totalRedeemed: number }> {
    try {
      let totalEarned = 0;
      let totalRedeemed = 0;

      const r = await this.getStatement({ params, groupbycond: "type" });

      if (r.data?.data?.length > 0) {
        r.data.data.forEach((item: any) => {
          if (item.type === "earn") {
            totalEarned += item.totalPoints;
          } else if (item.type === "redeem") {
            totalRedeemed += item.totalPoints;
          }
        });
      }

      return {
        totalEarned: totalEarned || 0,
        totalRedeemed: totalRedeemed || 0,
      };
    } catch (error) {
      return {
        totalEarned: 0,
        totalRedeemed: 0,
      };
    }
  }

  static async getLoyaltyCustomers(params: Record<string, any>) {
    try {
      const r = await this.getStatement({
        params,
        groupbycond: "sumofcustomer",
      });
      return {
        totalCustomers: r?.data?.data?.[0]?.customerCount || 0,
      };
    } catch (error) {
      return {
        totalCustomers: 0,
      };
    }
  }

  static getTransactionTypes() {
    return [
      { name: "POS", value: "pos" },
      { name: "Club", value: "club" },
      { name: "Expired", value: "expire" },
      { name: "Adjustment", value: "adjustment" },
      { name: "Transfer", value: "transfer" },
      { name: "Manual", value: "manual" },
    ];
  }

  static async getStatement(params = {}) {
    const r = await AjaxService.request(
      `${API}loyaltypoints/statements`,
      "GET",
      params
    );
    return r;
  }

  public static prepareRechargeRedeemParams(
    params: any,
    formData: any,
    reserve: boolean,
    additionParams: any = {}
  ) {
    const rp = params;
    const f = formData;
    const u = f.user;
    return merge(
      {
        products: [
          {
            refId: "",
            category: "",
            brand: "",
            discountedPrice:
              u === "retailer" ? 1 * rp.retailerPrice : 1 * rp.amount,
            qty: 1,
            type: rp.type || "Recharge",
            operation: rp.operation,
            subType: rp.subType,
            serviceProvider: rp.serviceProvider,
          },
        ],
        salesType: "Digital",
        ownerId: u === "retailer" ? rp.fid : rp.cid,
        accountId: u === "retailer" ? rp.franAccountId : rp.cid,
        ownerType: u,
        franchiseId: rp.fid,
        reserve,
        transactionType: "Recharge",
        redeemPoints: 1 * f.points,
      },
      additionParams
    );
  }

  public static getLoyaltyBalance(id: string, type: string) {
    return AjaxService.request(
      `${this.BASE_URL}/commission/${this.API_VERSION}/loyaltypoints/account/${id}/${type}`,
      "GET"
    );
  }

  /**
   * Get available points for a holder by type and id.
   * Example API: loyaltypoints/accounts/holder/Customer/CUST123456
   */
  public static async getHolderPoints(holderType: string, holderId: string) {
    const r = await AjaxService.request(
      `${API}loyaltypoints/accounts/holder/${holderType}/${holderId}`,
      "GET",
      {
        franchiseId: AuthService.getLoggedInUserId(),
      }
    );

    let available = 0;
    let totalEarned = 0;
    let totalRedeemed = 0;

    const balance = r?.data?.data?.balance;
    totalEarned = Number(balance.totalEarned) || 0;
    totalRedeemed = Number(balance.totalRedeemed) || 0;

    if (balance) {
      available = Number(balance.available) || 0;
    }

    return { available, totalEarned, totalRedeemed, raw: r };
  }

  public static checkRedeem(params: any) {
    return AjaxService.request(
      `${this.BASE_URL}commission/${this.API_VERSION}//loyaltypoints/checkredeem`,
      "POST",
      params || {}
    );
  }

  static async getExpiredPoints(
    ownerId: string,
    ownerType: string,
    params: any = {}
  ) {
    const p = merge({}, params, {
      filter: {
        processedType: "Expired",
        payoutType: "Debit",
        ownerId,
        ownerType,
      },
    });
    const r = await this.getStatement(p);

    let points = 0;

    if (r.data.length > 0) {
      points = (
        r.data.find((x: any) => x.ownerType == ownerType) || { total: 0 }
      ).total;
    }

    return { points };
  }
}

export default LoyaltyPointService;
