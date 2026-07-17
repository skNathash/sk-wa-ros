import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import MiscService from "~/services/MiscService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";

type PlanHighlight = {
  value: string[];
  languageCode: string;
  _id: string;
};

export const getPlanHighlights = (
  planHighlights?: PlanHighlight[],
): string[] => {
  if (!planHighlights?.length) return [];
  const selectedLang = MiscService.getSelectedLang();
  const match =
    planHighlights.find((h) => h.languageCode === selectedLang) ||
    planHighlights.find((h) => h.languageCode === "en") ||
    planHighlights[0];
  return match?.value || [];
};

export const prepareParams = (
  filters: Record<string, any>,
  pagination: PaginationState,
  sort: SortProps,
) => {
  const params: Record<string, any> = {
    page: pagination.activePage,
    limit: pagination.rowsPerPage,
    filter: {
      isActive: true,
      status: "Approved",
    },
  };

  if (filters.planType === "FIXED") {
    params.filter.type = "Value";
    params.filter.typeOfPlan = "Value-Based";
  } else if (filters.planType === "HYBRID") {
    params.filter.type = "Value";
    params.filter.typeOfPlan = "Hybrid";
  } else if (filters.planType === "PERCENTAGE") {
    params.filter.type = "Percentage";
    params.filter.typeOfPlan = "Commission-Based";
  }

  // SKSELLER networkType is treated as distributor
  // if (AuthService.isSkSeller()) {
  //   params.filter.userType = "Distributor";
  // }

  return params;
};

export const getData = async (params: Record<string, any>) => {
  const response = await FranchiseService.fetchServiceFeePlan(params);
  let plans = response?.data?.data || [];

  // Legacy monthly (value === 1) hybrid fee is only shown to franchises who
  // purchased a plan before the cutoff; new franchises don't get it.
  const canSeeMonthly = FranchiseService.canSeeMonthlyHybridPlan();

  // Apply the same transformation as was in index.tsx
  // sort plans by amountTo ascending (low to high)
  plans = plans.slice().sort((a: any, b: any) => {
    const va = a.amountTo ?? a.purchaseValue ?? 0;
    const vb = b.amountTo ?? b.purchaseValue ?? 0;
    return va - vb;
  });

  // Calculate percentage and total amount to pay
  plans = plans.map((plan: any) => {
    let subscriptionAmount = plan.subscriptionAmount || 0;
    const setupFee = plan.setupFeeInfo?.value || 0;
    const taxPercentage = plan.taxPercentage || 0;
    const isInclusiveTax = !!plan.isInclusiveTax;

    // For HYBRID plans, use the matching operational fee's discountSubscriptionAmount
    let operationalFeesList = plan.operationalFeesList;
    if (plan.typeOfPlan === "Hybrid" && operationalFeesList?.length) {
      // Hide the legacy monthly (value === 1) fee from franchises who aren't
      // eligible, so it disappears from the swiper, confirm modal and default.
      if (!canSeeMonthly) {
        operationalFeesList = operationalFeesList.filter(
          (fee: any) => fee.value !== 1,
        );
      }

      // Default to the lowest-duration active fee (monthly for legacy users,
      // next-lowest for everyone else).
      const matchedFee = operationalFeesList
        .filter((fee: any) => fee.isActive)
        .sort((a: any, b: any) => a.value - b.value)[0];
      if (matchedFee) {
        // subscriptionAmount =
        //   matchedFee.discountSubscriptionAmount || subscriptionAmount;
        plan._matchedOperationalFeeId = matchedFee.refId;
      }
    }

    const { total } = FranchiseService.calculatePlanPayable({
      subscriptionAmount,
      duration: 1,
      setupFee,
      taxPercentage,
      isInclusiveTax,
    });

    return {
      ...plan,
      operationalFeesList,
      // Unfiltered list so the UI can still read the legacy monthly (value === 1)
      // fee even when it's hidden from the swiper for ineligible franchises.
      rawOperationalFeesList: plan.operationalFeesList,
      subscriptionAmount,
      operationalFeeId: plan._matchedOperationalFeeId || undefined,
      percentage: plan.amountTo
        ? CommonService.roundedByDecimalPlace(
            (subscriptionAmount / plan.amountTo) * 100,
            2,
          )
        : 0,
      total,
    };
  });

  return plans;
};

export const getCount = async (params: Record<string, any>) => {
  // Assuming fetchServiceFeePlan supports outputType or returns count
  // If not supported, we might skip or return 0.
  // Existing calls didn't use count.
  return 0;
};
