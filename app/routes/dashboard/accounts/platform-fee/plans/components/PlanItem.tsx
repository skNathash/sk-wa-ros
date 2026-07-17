import { CheckCircle, Wallet } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AmountInWords from "~/components/core/amount-in-words/AmountInWords";
import AppButton from "~/components/core/button/AppButton";
import { getPlanHighlights } from "../helper";
import HybridPlanFeeSwiper from "./HybridPlanFeeSwiper";

type PlanHighlight = {
  value: string[];
  languageCode: string;
  _id: string;
};

type SetupFeeInfo = {
  value: number;
  isInclusiveTax?: boolean;
  taxPercentage?: number;
};

type Plan = {
  _id: string;
  title?: string;
  subscriptionAmount: number;
  planDurationDays: number;
  amountTo?: number;
  percentage?: number;
  taxPercentage?: number;
  type?: string;
  typeOfPlan?: string;
  isInclusiveTax?: boolean;
  setupFee?: number;
  setupFeeInfo?: SetupFeeInfo;
  isExistingUser?: boolean;
  annualCredits?: number;
  economics?: string;
  targetSegment?: string;
  total?: number;
  features?: string[];
  planHighlights?: PlanHighlight[];
  operationalFeesList?: OperationalFee[];
  rawOperationalFeesList?: OperationalFee[];
};

type OperationalFee = {
  type: string;
  value: number;
  discountPercent: number;
  discountSubscriptionAmount: number;
  isActive: boolean;
  isFree: boolean;
  displayName: string;
  refId: string;
};

type Props = {
  plan: Plan;
  balance: number;
  agreed: boolean;
  subscribingId: string | null;
  activePlanId?: string | null;
  canUpgradePlan?: boolean;
  onToggleTerms: (planId: string) => void;
  onOpenTerms: (title: string) => void;
  onSubscribe: (plan: Plan) => void;
  redirectToDepositMoney: () => void;
};

const PlanItem: React.FC<Props> = ({
  plan,
  balance,
  agreed,
  subscribingId,
  activePlanId,
  canUpgradePlan,
  onToggleTerms,
  onOpenTerms,
  onSubscribe,
  redirectToDepositMoney,
}) => {
  const { t } = useTranslation();

  const isHybrid = (plan.typeOfPlan || "").toUpperCase() === "HYBRID";
  const isCurrentPlan = activePlanId === plan._id && !canUpgradePlan;

  const durationLabel = isHybrid
    ? `/ month`
    : `/ ${plan.planDurationDays || 0} ${
        (plan.planDurationDays || 0) === 1 ? "day" : "days"
      }`;

  // For hybrid plans the monthly fee always comes from the legacy monthly
  // (value === 1) operational fee in the unfiltered list, even when it's hidden
  // from ineligible franchises. Other plan types use the subscription amount.
  const monthlyOperationalFee = isHybrid
    ? plan.rawOperationalFeesList?.find((fee) => fee.value === 1)
    : undefined;
  const monthlyFee =
    monthlyOperationalFee?.discountSubscriptionAmount ?? plan.subscriptionAmount;

  const setupFeeInfo = plan.setupFeeInfo;
  const setupFeeBase = plan.isExistingUser
    ? 0
    : setupFeeInfo?.value || plan.setupFee || 0;
  const setupFeeTaxPercentage = setupFeeInfo?.taxPercentage || 0;
  const setupFeeIsInclusiveTax = !!setupFeeInfo?.isInclusiveTax;
  const setupFeeTax = setupFeeIsInclusiveTax
    ? 0
    : (setupFeeBase * setupFeeTaxPercentage) / 100;
  const setupFee = setupFeeBase + setupFeeTax;
  const setupFeeDisplay = setupFeeBase;
  const annualFeesDisplay = monthlyFee * 12;
  const taxPct = plan.taxPercentage || 0;
  const gstDisplay = plan.isInclusiveTax
    ? (annualFeesDisplay * taxPct) / (100 + taxPct)
    : (annualFeesDisplay * taxPct) / 100;

  const highlights = getPlanHighlights(plan.planHighlights);
  const features = highlights.length ? highlights : plan.features || [];

  return (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-3 tw:flex tw:flex-col tw:h-full tw:shadow-sm tw:border-t-4 tw:border-t-blue-500">
      {/* Plan Badge */}
      {plan.title && (
        <div className="tw:mb-2">
          <span className="tw:inline-block tw:px-3 tw:py-1 tw:rounded-full tw:bg-blue-50 tw:text-blue-700 tw:text-xs tw:font-semibold">
            {plan.title}
          </span>
        </div>
      )}

      {/* Purchase Credits */}
      <div className="tw:mb-2">
        <p className="tw:text-[10px] tw:font-semibold tw:text-gray-800 tw:mb-0.5">
          Inventory Credit
        </p>
        <div className="tw:flex tw:items-baseline tw:gap-1">
          <span className="tw:text-2xl tw:font-bold tw:text-gray-900">
            <AmountInWords value={plan.amountTo || 0} />
          </span>
          <span className="tw:text-xs tw:text-gray-500 tw:font-medium">
            {durationLabel}
          </span>
        </div>
        {isHybrid && plan.amountTo && (
          <p className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
            (<AmountInWords value={(plan.amountTo || 0) * 12} /> Annual
            Inventory Credit)
          </p>
        )}
      </div>

      {/* Annual Cost Box - only for hybrid plans */}
      {isHybrid && (
        <div className="tw:mb-3 tw:p-2 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50">
          {/* <p className="tw:text-[10px] tw:font-semibold tw:text-gray-600 tw:mb-1">
            {t("platformFee:annualCost", { defaultValue: "Annual Cost" })}
          </p> */}
          <div className="tw:flex tw:flex-col tw:gap-1">
            {setupFeeDisplay > 0 && (
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <span className="tw:text-gray-500">
                  {t("platformFee:setupFee", { defaultValue: "Setup Fee" })}{" "}
                  <span className="tw:text-gray-400">(One Time)</span>
                </span>
                <span className="tw:font-semibold tw:text-gray-800">
                  <Amount value={setupFeeDisplay} decimalPlaces={0} />
                </span>
              </div>
            )}
            <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
              <span className="tw:text-gray-500">
                Subscription Fee{" "}
                <span className="tw:text-gray-400">/month</span>
              </span>
              <span className="tw:font-semibold tw:text-gray-800">
                <Amount value={monthlyFee} decimalPlaces={0} />
                {/* <span className="tw:text-gray-400 tw:font-normal">/month</span> */}
              </span>
            </div>
            <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
              <span className="tw:text-gray-500">
                Annual Fees{" "}
                <span className="tw:text-gray-400">(× 12 months)</span>
              </span>
              <span className="tw:font-semibold tw:text-gray-800">
                <Amount value={annualFeesDisplay} decimalPlaces={0} />
              </span>
            </div>
            {/* {taxPct > 0 && (
              <div className="tw:flex tw:items-center tw:justify-between tw:text-xs">
                <span className="tw:text-gray-500">GST</span>
                <span className="tw:font-semibold tw:text-gray-800">
                  {taxPct}%{" "}
                  <span className="tw:text-gray-400 tw:font-normal">
                    ({plan.isInclusiveTax ? "Inclusive" : "Exclusive"})
                  </span>
                </span>
              </div>
            )} */}
            {taxPct > 0 && !plan.isInclusiveTax && (
              <p className="tw:text-[10px] tw:text-gray-400 tw:mt-0.5 tw:text-right">
                GST extra as applicable
              </p>
            )}
          </div>
        </div>
      )}

      {isHybrid && <HybridPlanFeeSwiper plan={plan} />}

      {/* Fee Section - for non-hybrid plans */}
      {!isHybrid && (
        <div className="tw:mt-2 tw:mb-1">
          <div className="tw:flex tw:items-baseline tw:gap-1">
            <span className="tw:text-lg tw:font-bold tw:text-gray-900">
              <Amount value={monthlyFee} decimalPlaces={0} />
            </span>
            <span className="tw:text-sm tw:text-gray-500">
              {durationLabel} {t("platformFee:fee", { defaultValue: "fee" })}
            </span>
          </div>
          {(plan.taxPercentage || 0) > 0 && (
            <p className="tw:text-[10px] tw:text-gray-400 tw:mt-0.5">
              {plan.isInclusiveTax
                ? `incl of ${plan.taxPercentage}% GST`
                : `+ ${plan.taxPercentage}% GST applicable`}
            </p>
          )}
          {setupFee > 0 && (
            <p className="tw:text-xs tw:font-semibold tw:text-gray-500 tw:mt-0.5">
              + <Amount value={setupFee} decimalPlaces={0} />{" "}
              {t("platformFee:setupFee", { defaultValue: "setup fee" })}
              {setupFeeTaxPercentage > 0 && (
                <span className="tw:text-[10px] tw:font-normal tw:text-gray-400">
                  {" "}
                  (incl. of GST ({setupFeeTaxPercentage}%))
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="tw:border-t tw:border-gray-100 tw:my-3" />

      {/* Features List */}
      <div className="tw:flex tw:flex-col tw:gap-1.5 tw:flex-1">
        {features.map((feature, idx) => (
          <div key={idx} className="tw:flex tw:items-start tw:gap-2">
            <CheckCircle className="tw:w-4 tw:h-4 tw:text-blue-500 tw:shrink-0 tw:mt-0.5" />
            <span className="tw:text-[11px] tw:font-medium tw:text-gray-800">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* Action Section */}
      <div className="tw:mt-3">
        {isCurrentPlan ? (
          <div className="tw:flex tw:items-center tw:gap-2 tw:p-3 tw:bg-green-50 tw:border tw:border-green-100 tw:rounded-lg">
            <div className="tw:w-full tw:text-center">
              <span className="tw:text-sm tw:font-semibold tw:text-green-700">
                {t("platformFee:currentActivePlan")}
              </span>
              <p className="tw:text-[10px] tw:text-green-600 tw:mt-0.5">
                {t("platformFee:youAreSubscribed")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {balance >= (plan.subscriptionAmount || 0) && (
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                <input
                  type="checkbox"
                  id={`terms-${plan._id}`}
                  checked={agreed}
                  onChange={() => onToggleTerms(plan._id)}
                  className="tw:w-4 tw:text-blue-600 tw:rounded tw:border-gray-300 focus:tw:ring-blue-500"
                />
                <label
                  htmlFor={`terms-${plan._id}`}
                  className="tw:text-xs tw:text-gray-600 tw:cursor-pointer"
                >
                  {t("platformFee:agreeTermsPrefix")}{" "}
                  <span
                    className="tw:text-blue-600 tw:underline tw:cursor-pointer"
                    onClick={() => onOpenTerms(plan.title || "")}
                  >
                    {t("platformFee:termsAndConditions")}
                  </span>
                </label>
              </div>
            )}

            {balance < (plan.subscriptionAmount || 0) ? (
              <div className="tw:space-y-2">
                {!isHybrid && plan.total != null && plan.total > 0 && (
                  <div className="tw:flex tw:items-center tw:justify-between tw:p-2.5 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-200">
                    <span className="tw:text-xs tw:text-gray-500 tw:font-medium">
                      {t("platformFee:subscriptionFee", {
                        defaultValue: "Subscription Fee",
                      })}
                    </span>
                    <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                      <Amount value={plan.total} decimalPlaces={0} />
                    </span>
                  </div>
                )}
                <div className="tw:flex tw:items-center tw:gap-2 tw:p-2 tw:rounded-lg tw:bg-red-50 tw:border tw:border-red-100">
                  <div className="tw:shrink-0 tw:w-5 tw:h-5 tw:rounded-full tw:bg-red-100 tw:flex tw:items-center tw:justify-center">
                    <Wallet className="tw:w-3 tw:h-3 tw:text-red-500" />
                  </div>
                  <span className="tw:text-[11px] tw:text-red-600 tw:font-medium tw:leading-tight">
                    {t("platformFee:insufficientBalanceSubscribe")}
                  </span>
                </div>
                <AppButton
                  className="tw:w-full"
                  fill="solid"
                  color="success"
                  onClick={redirectToDepositMoney}
                >
                  {t("platformFee:depositMoney")}
                </AppButton>
              </div>
            ) : (
              <>
                {!isHybrid && plan.total != null && plan.total > 0 && (
                  <div className="tw:flex tw:items-center tw:justify-between tw:p-2.5 tw:rounded-lg tw:bg-blue-50 tw:border tw:border-blue-100 tw:mb-2">
                    <span className="tw:text-xs tw:text-blue-600 tw:font-medium">
                      {t("platformFee:subscriptionFee", {
                        defaultValue: "Subscription Fee",
                      })}
                    </span>
                    <span className="tw:text-sm tw:font-bold tw:text-blue-700">
                      <Amount value={plan.total} decimalPlaces={0} />
                    </span>
                  </div>
                )}
                <AppButton
                  className="tw:w-full"
                  fill="solid"
                  color={activePlanId === plan._id ? "warning" : "primary"}
                  isLoading={subscribingId === plan._id}
                  disabled={subscribingId === plan._id}
                  onClick={() => onSubscribe(plan)}
                >
                  {activePlanId === plan._id
                    ? t("platformFee:renewNow")
                    : t("platformFee:subscribeNow")}
                </AppButton>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanItem;
