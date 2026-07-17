import { CheckCircle, Wallet } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AmountInWords from "~/components/core/amount-in-words/AmountInWords";
import AppButton from "~/components/core/button/AppButton";
import { getPlanHighlights } from "../helper";

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
  total?: number;
  features?: string[];
  planHighlights?: PlanHighlight[];
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

const DistributorPlanItem: React.FC<Props> = ({
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

  const isCurrentPlan = activePlanId === plan._id && !canUpgradePlan;

  const monthlyFee = plan.subscriptionAmount;
  const setupFeeInfo = plan.setupFeeInfo;
  const setupFeeBase = plan.isExistingUser ? 0 : (setupFeeInfo?.value || plan.setupFee || 0);
  const setupFeeTaxPercentage = setupFeeInfo?.taxPercentage || 0;
  const setupFeeIsInclusiveTax = !!setupFeeInfo?.isInclusiveTax;
  const setupFeeTax = setupFeeIsInclusiveTax
    ? 0
    : (setupFeeBase * setupFeeTaxPercentage) / 100;
  const setupFee = setupFeeBase + setupFeeTax;
  const annualGst = plan.isInclusiveTax
    ? 0
    : (monthlyFee * 12 * (plan.taxPercentage || 0)) / 100;
  const annualCost = monthlyFee * 12 + setupFee + annualGst;

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
          Purchase Credits / Turnover
          {/* {t("platformFee:purchaseCredits", {
            defaultValue: "Purchase Credits",
          })} */}
        </p>
        <div className="tw:flex tw:items-baseline tw:gap-1">
          <span className="tw:text-2xl tw:font-bold tw:text-gray-900">
            <AmountInWords value={plan.amountTo || 0} />
          </span>
          <span className="tw:text-xs tw:text-gray-500 tw:font-medium">
            / month
          </span>
        </div>
        {plan.amountTo && (
          <p className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
            (<AmountInWords value={(plan.amountTo || 0) * 12} /> Annual Purchase
            Credits / Turnover
            {/* {t("platformFee:annualPurchaseCredits", {
              defaultValue: "Annual Purchase Credits",
            })} */}
            )
          </p>
        )}
      </div>

      {/* Annual Cost Box */}
      <div className="tw:mb-3 tw:p-2 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50">
        <p className="tw:text-[10px] tw:font-semibold tw:text-gray-600 tw:mb-0.5">
          {t("platformFee:annualCost", { defaultValue: "Annual Cost" })}
        </p>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:flex-col">
            <span className="tw:text-lg tw:font-bold tw:text-blue-700 tw:shrink-0">
              <Amount value={annualCost} decimalPlaces={0} />
            </span>
            {(plan.taxPercentage || 0) > 0 && (
              <span className="tw:text-[10px] tw:text-gray-400">
                incl. of GST ({plan.taxPercentage}%)
              </span>
            )}
          </div>
          <div className="tw:flex tw:flex-col tw:gap-0.5">
            {setupFee > 0 && (
              <span className="tw:text-xs tw:text-gray-500 tw:leading-tight">
                <Amount value={setupFee} decimalPlaces={0} />{" "}
                {t("platformFee:setupFee", { defaultValue: "Setup Fee" })}
                {setupFeeTaxPercentage > 0 && (
                  <span className="tw:text-[10px] tw:text-gray-400">
                    {" "}(incl. of GST ({setupFeeTaxPercentage}%))
                  </span>
                )}
              </span>
            )}
            <span className="tw:text-xs tw:text-gray-500 tw:leading-tight">
              <Amount
                value={monthlyFee * 12}
                decimalPlaces={0}
                className="tw:font-semibold"
              />{" "}
              (= <Amount value={monthlyFee} decimalPlaces={0} /> /mo × 12)
            </span>
          </div>
        </div>
        {/* <p className="tw:text-xs tw:text-gray-400 tw:mt-1">
          <Amount value={monthlyFee} decimalPlaces={0} /> × 12 ={" "}
          <span className="tw:font-semibold tw:text-gray-600">
            <Amount value={monthlyFee * 12} decimalPlaces={0} />
          </span>
        </p> */}
      </div>

      {/* Effective Platform Fee */}
      {plan.percentage != null && (
        <div className="tw:mb-3">
          <p className="tw:text-[10px] tw:font-semibold tw:text-blue-600 tw:mb-0.5">
            {t("platformFee:effectivePlatformFee", {
              defaultValue: "Effective Platform Fee",
            })}
          </p>
          <span className="tw:text-2xl tw:font-bold tw:text-blue-600">
            {plan.percentage}%
          </span>
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
                  {t("platformFee:agreeTermsLabel")}{" "}
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
                {plan.total != null && plan.total > 0 && (
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
                {plan.total != null && plan.total > 0 && (
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

export default DistributorPlanItem;
