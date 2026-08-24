import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import type { BillingCycle } from "../helper";

/** The two plan shapes listed under JUMP TO. */
export type ComparePlanType = "stock" | "shop";

export interface ComparePlanItemData {
  /** Plan id — also the DOM id of the plan card this row jumps to. */
  id: string;
  name: string;
  /** Headline number of the plan — credit capacity or bill volume. */
  value: string;
}

/** Copy and query that differ between the two plan shapes. */
const SHAPE = {
  stock: {
    typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.stock,
    label: "STOCK",
  },
  shop: {
    typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.shop,
    label: "SHOP",
  },
} as const;

/** Billing cycle of the compare page in the months the API filters by. */
const CYCLE_MONTHS: Record<BillingCycle, number> = {
  "6months": 6,
  "1year": 12,
};

/** Eyebrow above each list, e.g. "STOCK · 5 TIERS". */
export const getShapeLabel = (type: ComparePlanType, count: number) =>
  `${SHAPE[type].label} · ${count} ${count === 1 ? "TIER" : "TIERS"}`;

/** Credit capacity for stock plans, monthly bill volume for shop plans. */
const getValue = (plan: any, type: ComparePlanType) => {
  if (type === "stock")
    return CommonService.formatCompact(plan.amountTo || 0, { fallback: "—" });

  const bills = Number(plan.amountTo) || 0;
  return bills ? bills.toLocaleString("en-IN") : "∞";
};

/**
 * Query for one plan shape's tiers on the selected billing duration.
 * Endpoint: GET franchise/service-fee-plan/operational-fees
 */
export const prepareParams = (
  type: ComparePlanType,
  billingCycle: BillingCycle,
) => ({
  type: "Month",
  value: CYCLE_MONTHS[billingCycle],
  typeOfPlan: SHAPE[type].typeOfPlan,
  outputType: "list",
});

/** Tiers of one plan shape, low to high, ready for the JUMP TO rows. */
export const getData = async (
  type: ComparePlanType,
  params: Record<string, any>,
): Promise<ComparePlanItemData[]> => {
  const response =
    await FranchiseService.fetchServiceFeePlanOperationalFees(params);
  const plans: any[] = response?.data?.data || [];

  return plans
    .slice()
    .sort(
      (a, b) =>
        (a.amountTo ?? a.subscriptionAmount ?? 0) -
        (b.amountTo ?? b.subscriptionAmount ?? 0),
    )
    .map((plan) => ({
      id: plan._id || plan.planId || plan.refId || "",
      name: plan.title || plan.name || "",
      value: getValue(plan, type),
    }));
};
