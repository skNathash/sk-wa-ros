import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import {
  formatInr,
  type PlanCardData,
  type PlanCardTier,
} from "~/shared/accounts/platform-fee/plan-card/helper";

export type BillingCycle = "1year" | "6months";

/** The two plan shapes the tiers page lists. */
export type TierType = "stock" | "shop";

/** Query params the page keeps its selection in. */
export const BILLING_CYCLE_PARAM = "cycle";
export const TIER_TYPE_PARAM = "type";

export const defaultBillingCycle: BillingCycle = "1year";
export const defaultTierType: TierType = "stock";

/** Reads the billing cycle off the URL, falling back to the default. */
export const getBillingCycle = (value: string | null): BillingCycle =>
  value === "6months" || value === "1year" ? value : defaultBillingCycle;

/** Reads the plan shape off the URL, falling back to the default. */
export const getTierType = (value: string | null): TierType =>
  value === "stock" || value === "shop" ? value : defaultTierType;

export type TierIcon = PlanCardTier;

/** A tier is a plan card plus what only this page acts on. */
export interface TierCardData extends PlanCardData {
  /** Kept apart from the tags so the side pane can print its own line. */
  peersCount: number;
  isSwaPick?: boolean;
  buttonLabel: string;
}

/** Copy and query that differ between the two plan shapes. */
const SHAPE = {
  stock: {
    typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.stock,
    label: "STOCK",
    highlightLabel: "MONTHLY CREDIT",
    highlightSub: "buy on credit each month",
  },
  shop: {
    typeOfPlan: FranchiseService.PLAN_SHAPE_TYPE.shop,
    label: "SHOP",
    highlightLabel: "MONTHLY BILLS",
    highlightSub: "billed from your counter",
  },
} as const;

/** Billing cycle of the page in the months the API filters by. */
const CYCLE_MONTHS: Record<BillingCycle, number> = {
  "6months": 6,
  "1year": 12,
};

/** Duration label used in the card's fee breakdown. */
const CYCLE_LABEL: Record<BillingCycle, string> = {
  "6months": "6-mo term",
  "1year": "1-year term",
};

/** Icon tier climbs with the plan's position in the ladder. */
const TIER_LADDER: TierIcon[] = [
  "bronze",
  "bronze",
  "silver",
  "gold",
  "platinum",
];

/** Eyebrow above the grid, e.g. "STOCK · GO LIVE · 5 TIERS". */
export const getShapeLabel = (type: TierType, count: number) =>
  `${SHAPE[type].label} · GO LIVE · ${count} ${count === 1 ? "TIER" : "TIERS"}`;

/** Credit capacity for stock plans, monthly bill volume for shop plans. */
const getHighlightValue = (plan: any, type: TierType) => {
  const capacity = Number(plan.amountTo) || 0;

  if (type === "stock")
    return CommonService.formatCompact(capacity, { fallback: "—" });

  return capacity ? capacity.toLocaleString("en-IN") : "∞";
};

/** Falls back to the capacity the tier is sold on when the API sends no copy. */
const getSubtitle = (plan: any, type: TierType) => {
  if (plan.subTitle || plan.description)
    return plan.subTitle || plan.description;

  const capacity = Number(plan.amountTo) || 0;
  if (!capacity) return "";

  if (type === "stock")
    return `For shops buying up to ${CommonService.formatCompact(capacity)} / month`;

  return `Up to ${capacity.toLocaleString("en-IN")} bills per month`;
};

/**
 * Query for one plan shape's tiers on the selected billing duration.
 * Endpoint: GET franchise/service-fee-plan/operational-fees
 */
export const prepareParams = (type: TierType, billingCycle: BillingCycle) => ({
  type: "Month",
  value: CYCLE_MONTHS[billingCycle],
  typeOfPlan: SHAPE[type].typeOfPlan,
  outputType: "list",
});

/** Tiers of one plan shape, low to high, priced for the selected cycle. */
export const getData = async (
  type: TierType,
  billingCycle: BillingCycle,
  params: Record<string, any>,
): Promise<TierCardData[]> => {
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
      const name = plan.title || "";

      const peersCount = Number(plan.peersCount) || 0;
      const perksCount = Number(plan.perksCount ?? plan.perks?.length) || 0;

      return {
        id: plan._id || "",
        name,
        subtitle: getSubtitle(plan, type),
        highlight: {
          label: SHAPE[type].highlightLabel,
          value: getHighlightValue(plan, type),
          sub: SHAPE[type].highlightSub,
        },
        badge: isRecommended
          ? { label: "+ RECOMMENDED", variant: "recommended" as const }
          : isPopular
            ? { label: "+ MOST POPULAR", variant: "popular" as const }
            : undefined,
        isHighlighted: isRecommended,
        feeRows: [
          { label: "Setup (one-time)", value: formatInr(setupFee) },
          { label: CYCLE_LABEL[billingCycle], value: formatInr(durationFee) },
          { label: `GST ${taxPercentage}%`, value: formatInr(Math.round(gst)) },
        ],
        payTodayLabel: "PAY TODAY",
        payTodayValue: formatInr(Math.round(total)),
        tags: [
          ...(peersCount ? [`${peersCount} peers`] : []),
          ...(perksCount ? [`${perksCount} perks`] : []),
        ],
        peersCount,
        isSwaPick: isRecommended,
        buttonLabel: isRecommended ? "Pick this (Swa's pick)" : `Pick ${name}`,
        iconTier: TIER_LADDER[index] || TIER_LADDER[TIER_LADDER.length - 1],
      };
    });
};
