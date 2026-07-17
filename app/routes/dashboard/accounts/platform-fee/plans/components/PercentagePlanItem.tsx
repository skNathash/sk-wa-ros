import { Percent, Wallet } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ViewCategorySplitages from "./ViewCategorySplitages";
import CommonService from "~/services/CommonService";

type Plan = {
  _id: string;
  title?: string;
  subscriptionAmount: number;
  planDurationDays: number;
  amountTo?: number;
  percentage?: number;
  purchaseChargeConfig?: {
    avgCommissionPercentage?: number;
    data?: { menuName?: string; skCommission?: number }[];
  };
  taxPercentage?: number;
  type?: string;
};

type Props = {
  plan: Plan;
  balance: number;
  agreed: boolean;
  subscribingId: string | null;
  activePlanId?: string | null;
  onToggleTerms: (planId: string) => void;
  onOpenTerms: (title: string) => void;
  onSubscribe: (plan: Plan) => void;
  redirectToDepositMoney: () => void;
};

const PercentagePlanItem: React.FC<Props> = ({
  plan,
  balance,
  agreed,
  subscribingId,
  activePlanId,
  onToggleTerms,
  onOpenTerms,
  onSubscribe,
  redirectToDepositMoney,
}) => {
  const { t } = useTranslation();
  return (
    <AppCard key={plan._id} className="tw:mb-0 tw:overflow-hidden">
      <div className="tw:flex tw:flex-col tw:h-full">
        {/* Header Section */}
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-4 tw:mb-6 tw:pb-4 tw:border-b tw:border-gray-100">
          <div>
            {plan.title && (
              <h3 className="tw:text-lg tw:font-bold tw:text-gray-900">
                {plan.title}
              </h3>
            )}
            <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              {t("platformFee:planPercItem.optimizedForHighVolume")}
            </p>
          </div>
          <div className="tw:flex tw:items-start tw:gap-2 tw:bg-blue-50 tw:p-3 tw:rounded-xl tw:border tw:border-blue-100 tw:min-w-[140px]">
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-[10px] tw:font-bold tw:text-blue-600 tw:uppercase tw:tracking-wider">
                {t("platformFee:planPercItem.feePercentLabel")}
              </span>
              <div className="tw:flex tw:items-baseline tw:gap-1">
                <span className="tw:text-2xl tw:font-black tw:text-blue-700">
                  {t("platformFee:planPercItem.avgOnePercent")}
                </span>
              </div>
              <span className="tw:text-[10px] tw:text-blue-500 tw:font-medium">
                {t("platformFee:planPercItem.onPurchaseValue")}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-6 tw:mb-8 tw:flex-1">
          {/* Left Column: Benefits and Requirements */}
          <div className="tw:space-y-4">
            <div className="tw:p-4 tw:rounded-2xl tw:bg-blue-50/50 tw:border tw:border-blue-100 tw:transition-all hover:tw:shadow-sm">
              <div className="tw:flex tw:items-start tw:gap-3">
                <div className="tw:mt-1 tw:p-1.5 tw:bg-blue-100 tw:rounded-lg">
                  <Percent className="tw:w-4 tw:h-4 tw:text-blue-600" />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-bold tw:text-blue-900">
                    {t("platformFee:planPercItem.payAsYouGo")}
                  </div>
                  <p className="tw:text-xs tw:text-blue-800/80 tw:leading-relaxed tw:mt-1">
                    {t("platformFee:planPercItem.payAsYouGoDesc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="tw:p-4 tw:rounded-2xl tw:bg-amber-50/50 tw:border tw:border-amber-100 tw:transition-all hover:tw:shadow-sm">
              <div className="tw:flex tw:items-start tw:gap-3">
                <div className="tw:mt-1 tw:p-1.5 tw:bg-amber-100 tw:rounded-lg">
                  <Wallet className="tw:w-4 tw:h-4 tw:text-amber-600" />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-bold tw:text-amber-900">
                    {t("platformFee:planPercItem.pleaseNote")}
                  </div>
                  <p className="tw:text-xs tw:text-amber-800/80 tw:leading-relaxed tw:mt-1">
                    {t("platformFee:planPercItem.minimumBalanceRequired", {
                      amount:
                        "₹" +
                        CommonService.roundedByDecimalPlace(
                          plan.subscriptionAmount,
                          2
                        ),
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="tw:space-y-2 tw:px-1">
              <div className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                {t("platformFee:planPercItem.planHighlights")}
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-2">
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-600">
                  <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-400 tw:rounded-full" />
                  <span>{t("platformFee:planPercItem.flexibleTopups")}</span>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-600">
                  <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-400 tw:rounded-full" />
                  <span>{t("platformFee:planPercItem.noHiddenCharges")}</span>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-600">
                  <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-400 tw:rounded-full" />
                  <span>
                    {t("platformFee:planPercItem.unlimitedPurchases")}
                  </span>
                </div>
                <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-gray-600">
                  <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-400 tw:rounded-full" />
                  <span>
                    {t("platformFee:planPercItem.instantAccessAfterTopup")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations and Splitages */}
          <div className="tw:space-y-4">
            {(plan.purchaseChargeConfig?.data?.length ?? 0) > 0 && (
              <ViewCategorySplitages
                data={plan.purchaseChargeConfig?.data ?? []}
              />
            )}

            <div className="tw:p-4 tw:rounded-2xl tw:bg-gray-50 tw:border tw:border-gray-100">
              <div className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider tw:mb-4 text-center">
                {t("platformFee:planPercItem.visualCalculationExample")}
              </div>
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
                <div className="tw:flex-1 tw:text-center tw:p-2 tw:bg-white tw:rounded-xl tw:border tw:border-gray-100">
                  <div className="tw:text-[10px] tw:text-gray-500 tw:mb-1">
                    {t("platformFee:planPercItem.purchaseAddStock")}
                  </div>
                  <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                    <Amount value={1000} />
                  </div>
                </div>
                <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-gray-100">
                  <span className="tw:text-gray-400 tw:font-bold">→</span>
                </div>
                <div className="tw:flex-1 tw:text-center tw:p-2 tw:bg-blue-50 tw:rounded-xl tw:border tw:border-blue-100">
                  <div className="tw:text-[10px] tw:text-blue-500 tw:mb-1">
                    {t("platformFee:planPercItem.feeExample", { percent: 1 })}
                  </div>
                  <div className="tw:text-sm tw:font-bold tw:text-blue-600">
                    <Amount value={10} />
                  </div>
                </div>
              </div>
              <p className="tw:text-[11px] tw:text-gray-500 tw:mt-4 tw:text-center tw:leading-relaxed">
                {t("platformFee:planPercItem.feeIsDynamicallyCalculated")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="tw:mt-auto tw:pt-6 tw:border-t tw:border-gray-100">
          {activePlanId === plan._id ? (
            <div className="tw:flex tw:items-center tw:gap-3 tw:p-4 tw:bg-green-50 tw:border tw:border-green-100 tw:rounded-2xl">
              <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-green-100 tw:flex tw:items-center tw:justify-center">
                <div className="tw:w-2 tw:h-2 tw:bg-green-600 tw:rounded-full tw:animate-pulse" />
              </div>
              <div className="tw:flex-1">
                <span className="tw:text-sm tw:font-bold tw:text-green-800">
                  {t("platformFee:planPercItem.currentActivePlan")}
                </span>
                <p className="tw:text-[11px] tw:text-green-700 tw:mt-0.5">
                  {t("platformFee:planPercItem.usingCommissionBasedModel")}
                </p>
              </div>
            </div>
          ) : (
            <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:gap-6">
              <div className="tw:flex-1">
                {balance >= (plan.subscriptionAmount || 0) && (
                  <div className="tw:flex tw:items-start tw:gap-3">
                    <input
                      type="checkbox"
                      id={`terms-percentage-${plan._id}`}
                      checked={agreed}
                      onChange={() => onToggleTerms(plan._id)}
                      className="tw:mt-1 tw:w-4 tw:h-4 tw:text-blue-600 tw:rounded tw:border-gray-300 focus:tw:ring-blue-500"
                    />
                    <label
                      htmlFor={`terms-percentage-${plan._id}`}
                      className="tw:text-xs tw:text-gray-600 tw:cursor-pointer tw:leading-relaxed"
                    >
                      {t("platformFee:planPercItem.agreeTermsLabel")}{" "}
                      <span
                        className="tw:text-blue-600 tw:font-bold tw:hover:tw:underline tw:cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenTerms(plan.title || "");
                        }}
                      >
                        {t("platformFee:planPercItem.termsAndConditions")}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="tw:min-w-[200px]">
                {balance < (plan.subscriptionAmount || 0) ? (
                  <div className="tw:space-y-3">
                    <div className="tw:text-red-600 tw:text-[11px] tw:font-medium">
                      {t("platformFee:planPercItem.insufficientWalletBalance", {
                        amount:
                          "₹" +
                          CommonService.formattedAmount(
                            plan.subscriptionAmount,
                            2
                          ),
                      })}
                    </div>
                    <AppButton
                      className="tw:w-full tw:rounded-xl"
                      fill="solid"
                      color="success"
                      onClick={redirectToDepositMoney}
                    >
                      {t("platformFee:planPercItem.depositMoney")}
                    </AppButton>
                  </div>
                ) : (
                  <AppButton
                    className="tw:w-full tw:font-bold"
                    fill="solid"
                    color="primary"
                    isLoading={subscribingId === plan._id}
                    disabled={subscribingId === plan._id}
                    onClick={() => onSubscribe(plan)}
                  >
                    {t("platformFee:planPercItem.subscribeNow")}
                  </AppButton>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default PercentagePlanItem;
