import FranchiseService from "~/services/FranchiseService";

export interface PerkItem {
  /** Feature id from the API, e.g. "PFTD8". */
  id: string;
  title: string;
  desc: string;
  /** Right-hand value on the row, e.g. "Included". */
  valueLabel: string;
}

export interface PerkGroup {
  title: string;
  caption: string;
  perks: PerkItem[];
}

export interface PerksBreakdown {
  stock: PerkGroup;
  shop: PerkGroup;
}

/** Plan shapes on the benefits page map onto these plan types. */
const PLAN_SHAPE_TYPE = {
  stock: "Hybrid",
  shop: "FeatureLimit",
} as const;

/** The API returns one plan record per plan type, each holding its own featuresList. */
const pickPerks = (data: any[], typeOfPlan: string): PerkItem[] => {
  const plan = data.find((item: any) => item?.typeOfPlan === typeOfPlan);

  return (plan?.featuresList || []).map((feature: any) => ({
    id: feature.id,
    title: feature.title,
    desc: feature.description,
    valueLabel: feature.valueLabel,
  }));
};

const buildGroup = (
  title: string,
  caption: (count: number) => string,
  perks: PerkItem[],
): PerkGroup => ({ title, caption: caption(perks.length), perks });

/** Query params for the plan-features listing. */
const PLAN_FEATURES_PARAMS = {
  isActive: true,
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

const stockCaption = (count: number) => `${count} perks · unlocked at signup`;
const shopCaption = (count: number) => `${count} modules · in your language`;

/**
 * Perks bundled with the service fee plans, grouped by plan shape.
 * Endpoint: GET franchise/service-fee-plan/plan-features
 */
export const getPerksBreakdown = async (): Promise<PerksBreakdown> => {
  let stockPerks: PerkItem[] = [];
  let shopPerks: PerkItem[] = [];

  try {
    const response =
      await FranchiseService.fetchServiceFeePlanFeatures(PLAN_FEATURES_PARAMS);

    const data = response?.data?.data || [];

    stockPerks = pickPerks(data, PLAN_SHAPE_TYPE.stock);
    shopPerks = pickPerks(data, PLAN_SHAPE_TYPE.shop);
  } catch (e) {
    // Cards fall back to their empty state.
  }

  return {
    stock: buildGroup("Stock · Go Live", stockCaption, stockPerks),
    shop: buildGroup("Shop · Manage Counter", shopCaption, shopPerks),
  };
};

export { PLAN_SHAPE_TYPE };
