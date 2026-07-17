import { API } from "~/constants";
import AjaxService from "./AjaxService";

// Normalized exclude entry as stored in the reward config
export interface RewardExcludeItem {
  id: string;
  refId: string;
  name: string;
}

export interface RewardConfig {
  // Coins granted per `amountThreshold` rupees spent on every order
  pointsPerAmount: number;
  amountThreshold: number;
  excludeMenu: RewardExcludeItem[];
  excludeCategory: RewardExcludeItem[];
  excludeBrand: RewardExcludeItem[];
  excludeFranchise: RewardExcludeItem[];
}

class LoyaltyRewardService {
  // GET the coins reward configuration (read-only here, edited from erp-content)
  static async getRewardConfig() {
    return AjaxService.request(
      `${API}loyaltypoints/reward-config/reward`,
      "GET"
    );
  }

  // Pulls the relevant earning rule + exclusions out of the raw API response.
  // Returns null when the response is empty/unsuccessful.
  static parseRewardConfig(r: any): RewardConfig | null {
    if (r?.statusCode !== 200) return null;

    // Response shape: { data: [ { _id, data: { excludeMenu, general_every_order, ... } } ] }
    const list = r?.data?.data ?? r?.data;
    const config = Array.isArray(list) ? list[0] : list;
    const cfg = config?.data ?? {};
    if (!cfg) return null;

    const everyOrder = cfg?.general_every_order ?? {};

    return {
      pointsPerAmount: Number(everyOrder?.points_per_amount) || 0,
      amountThreshold: Number(everyOrder?.amount_threshold) || 0,
      excludeMenu: cfg?.excludeMenu || [],
      excludeCategory: cfg?.excludeCategory || [],
      excludeBrand: cfg?.excludeBrand || [],
      excludeFranchise: cfg?.excludeFranchise || [],
    };
  }
}

export default LoyaltyRewardService;
