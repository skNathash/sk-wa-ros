import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import type { BillingCycle } from "../helper";
import {
  formatInr,
  type PlanCardAccent,
  type PlanCardData,
  type PlanCardTier,
} from "~/shared/accounts/platform-fee/plan-card/helper";

/** The two plan shapes a plan list can render. */
export type PlanListType = "stock" | "shop";

/** Copy, query and styling that differ between the two plan shapes. */
const SHAPE = {
  stock: {
    typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.stock,
    label: "STOCK",
    accent: "amber" as PlanCardAccent,
    highlightLabel: "MONTHLY CREDIT",
    highlightSub: "buy on credit each month",
  },
  shop: {
    typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.shop,
    label: "SHOP",
    accent: "blue" as PlanCardAccent,
    highlightLabel: "MONTHLY BILLS",
    highlightSub: "billed from your counter",
  },
} as const;

/** Billing cycle of the page in the months the API filters by. */
const CYCLE_MONTHS: Record<BillingCycle, number> = {
  "6months": 6,
  "1year": 12,
};

/** Short duration label used in the card's fee breakdown. */
const CYCLE_LABEL: Record<BillingCycle, string> = {
  "6months": "6mo",
  "1year": "1yr",
};

/** Icon tier climbs with the plan's position in the ladder. */
const TIER_LADDER: PlanCardTier[] = [
  "bronze",
  "bronze",
  "silver",
  "gold",
  "platinum",
];

/** Accent of one plan shape — amber for stock, blue for shop. */
export const getAccent = (type: PlanListType) => SHAPE[type].accent;

/** Eyebrow above the list, e.g. "STOCK · 5 TIERS". */
export const getShapeLabel = (type: PlanListType, count: number) =>
  `${SHAPE[type].label} · ${count} ${count === 1 ? "TIER" : "TIERS"}`;

/** Credit capacity for stock plans, monthly bill volume for shop plans. */
const getHighlightValue = (plan: any, type: PlanListType) => {
  const capacity = Number(plan.amountTo) || 0;

  if (type === "stock")
    return CommonService.formatCompact(capacity, { fallback: "—" });

  return capacity ? capacity.toLocaleString("en-IN") : "∞";
};

/** Falls back to the capacity the tier is sold on when the API sends no copy. */
const getSubtitle = (plan: any, type: PlanListType) => {
  if (plan.subTitle || plan.description)
    return plan.subTitle || plan.description;

  const capacity = Number(plan.amountTo) || 0;
  if (!capacity) return "";

  if (type === "stock")
    return `For shops buying up to ${CommonService.formatCompact(capacity)} / month`;

  return `Up to ${capacity.toLocaleString("en-IN")} bills per month`;
};

/** Bottom chips — only the counts the plan actually carries. */
const getTags = (plan: any) => {
  const tags: string[] = [];

  const peers = Number(plan.peersCount) || 0;
  if (peers) tags.push(`${peers} peers`);

  const perks = Number(plan.perksCount ?? plan.perks?.length) || 0;
  if (perks) tags.push(`${perks} perks`);

  return tags;
};

/**
 * Query for one plan shape's tiers on the selected billing duration.
 * Endpoint: GET franchise/service-fee-plan/operational-fees
 */
export const prepareParams = (
  type: PlanListType,
  billingCycle: BillingCycle,
) => ({
  type: "Month",
  value: CYCLE_MONTHS[billingCycle],
  typeOfPlan: SHAPE[type].typeOfPlan,
  outputType: "list",
});

/** Tiers of one plan shape, low to high, ready for the plan cards. */
export const getData = async (
  type: PlanListType,
  billingCycle: BillingCycle,
  params: Record<string, any>,
): Promise<PlanCardData[]> => {
  const response =
    await FranchiseService.fetchServiceFeePlanOperationalFees(params);
  const plans: any[] = response?.data?.data || [];
  const months = CYCLE_MONTHS[billingCycle];

  return plans
    .slice()
    .sort(
      (a, b) =>
        (a.amountTo ?? a.subscriptionAmount ?? 0) -
        (b.amountTo ?? b.subscriptionAmount ?? 0),
    )
    .map((plan, index) => {
      const setupFee = Number(plan.setupFeeInfo?.value) || 0;
      const taxPercentage = Number(plan.taxPercentage) || 0;
      // The operational-fees endpoint already prices the duration; only fall
      // back to multiplying the monthly amount when it doesn't.
      const durationFee =
        Number(plan.discountSubscriptionAmount) ||
        (Number(plan.subscriptionAmount) || 0) * months;

      const { gst, total } = FranchiseService.calculatePlanPayable({
        subscriptionAmount: durationFee,
        duration: 1,
        setupFee,
        taxPercentage,
        isInclusiveTax: !!plan.isInclusiveTax,
      });

      const isRecommended = !!plan.isRecommended;
      const isPopular = !!plan.isPopular;

      return {
        id: plan._id || "",
        name: plan.title || "",
        subtitle: getSubtitle(plan, type),
        badge: isRecommended
          ? { label: "+ RECOMMENDED", variant: "recommended" as const }
          : isPopular
            ? { label: "+ MOST POPULAR", variant: "popular" as const }
            : undefined,
        isHighlighted: isRecommended,
        iconTier: TIER_LADDER[index] || TIER_LADDER[TIER_LADDER.length - 1],
        highlight: {
          label: SHAPE[type].highlightLabel,
          value: getHighlightValue(plan, type),
          sub: SHAPE[type].highlightSub,
        },
        feeRows: [
          { label: "Setup", value: formatInr(setupFee) },
          { label: CYCLE_LABEL[billingCycle], value: formatInr(durationFee) },
          { label: `GST ${taxPercentage}%`, value: formatInr(Math.round(gst)) },
        ],
        payTodayLabel: "PAY TODAY",
        payTodayValue: formatInr(Math.round(total)),
        tags: getTags(plan),
      };
    });
};
