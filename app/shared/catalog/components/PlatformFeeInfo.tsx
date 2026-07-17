import React from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { Button } from "~/components/ui/button";

interface PlatformFeeInfoProps {
  commissionAmount: number;
  commissionPercentage: number;
  planName?: string;
  planType?: string;
  typeOfPlan?: string;
  availableAmount?: number;
  hasSufficientBalance?: boolean;
  calculating: boolean;
  className?: string;
  onBuyPlan?: () => void;
}

const PlatformFeeInfo: React.FC<PlatformFeeInfoProps> = ({
  commissionAmount,
  commissionPercentage,
  planName,
  planType,
  typeOfPlan,
  availableAmount,
  hasSufficientBalance,
  calculating,
  className,
  onBuyPlan,
}) => {
  const { t } = useTranslation("platformFee");
  if (calculating) {
    return (
      <div
        className={`tw:flex tw:items-center tw:gap-2 tw:bg-gray-50 tw:rounded-lg tw:px-3 tw:py-2 tw:border tw:border-gray-200 ${className || ""}`}
      >
        <AppSpinner size="sm" />
        <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
          {t("calculatingCharges")}
        </span>
      </div>
    );
  }

  if (commissionAmount === 0) {
    return null;
  }

  const isInsufficient = hasSufficientBalance === false;
  const balanceAfterDebit =
    availableAmount !== undefined
      ? availableAmount - commissionAmount
      : undefined;

  const isPercentagePlan = planType?.toLowerCase().includes("percentage");
  const isHybridPlan = typeOfPlan?.toLowerCase() === "hybrid";
  const planTypeLabel = isHybridPlan
    ? "Hybrid"
    : isPercentagePlan
      ? t("percentage")
      : t("fixed");

  return (
    <div
      className={`tw:overflow-hidden tw:rounded-md tw:border-2 ${
        isInsufficient
          ? "tw:bg-red-50 tw:border-red-200"
          : "tw:bg-white tw:border-blue-100"
      } ${className || ""}`}
    >
      {/* Title Section */}
      <div
        className={`tw:px-3 tw:py-2 tw:border-b ${isInsufficient ? "tw:border-red-200 tw:bg-red-100/30" : "tw:border-blue-100 tw:bg-blue-50/50"}`}
      >
        <div className="tw:flex tw:items-center tw:justify-between">
          <div>
            <h3 className="tw:text-xs tw:font-black tw:text-gray-900 tw:uppercase tw:tracking-wide">
              {t("platformFee")}
            </h3>
          </div>
          {isPercentagePlan && (
            <span className="tw:bg-blue-600 tw:text-white tw:px-2 tw:py-1 tw:rounded-md tw:text-[10px] tw:font-black">
              {commissionPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Plan Name (if available) */}
      {planName && (
        <div
          className={`tw:px-3 tw:py-1.5 tw:border-b ${isInsufficient ? "tw:border-red-100" : "tw:border-blue-50 tw:bg-blue-50/30"}`}
        >
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:w-1.5 tw:h-1.5 tw:bg-blue-500 tw:rounded-full" />
            <span className="tw:text-[10px] tw:font-bold tw:text-gray-700">
              {t("planLabel")} {planName}
            </span>
            <span
              className={`tw:text-[9px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-semibold tw:uppercase tw:flex-shrink-0 ${
                isPercentagePlan
                  ? "tw:bg-blue-100 tw:text-blue-700"
                  : "tw:bg-purple-100 tw:text-purple-700"
              }`}
            >
              {planTypeLabel}
            </span>
          </div>
        </div>
      )}

      {/* Main Info Box */}
      <div
        className={`tw:grid tw:divide-x ${availableAmount !== undefined ? "tw:grid-cols-3" : "tw:grid-cols-1"} ${isInsufficient ? "tw:divide-red-100" : "tw:divide-blue-100"}`}
      >
        {/* Wallet Balance */}
        {availableAmount !== undefined && (
          <div className="tw:px-3 tw:py-2.5">
            <div className="tw:text-[9px] tw:font-bold tw:text-gray-400 tw:uppercase tw:mb-0.5">
              {t("purchaseCapacity")}
            </div>
            <Amount
              value={availableAmount}
              className="tw:text-sm tw:font-bold tw:text-gray-900"
            />
          </div>
        )}

        {/* Fee */}
        <div className="tw:px-3 tw:py-2.5">
          <div className="tw:text-[9px] tw:font-bold tw:text-gray-400 tw:uppercase tw:mb-0.5">
            {t("feeLbl")} {isPercentagePlan && `(${commissionPercentage}%)`}
          </div>
          <Amount
            value={commissionAmount}
            className="tw:text-sm tw:font-bold tw:text-red-600"
            decimalPlaces={4}
          />
        </div>

        {/* Remaining */}
        {balanceAfterDebit !== undefined && (
          <div className="tw:px-3 tw:py-2.5">
            <div className="tw:text-[9px] tw:font-bold tw:text-gray-400 tw:uppercase tw:mb-0.5">
              {t("remaining")}
            </div>
            <Amount
              value={balanceAfterDebit}
              className={`tw:text-sm tw:font-bold ${
                isInsufficient ? "tw:text-red-600" : "tw:text-green-600"
              }`}
              decimalPlaces={4}
            />
          </div>
        )}
      </div>

      {/* Low Balance Alert & Action */}
      {isInsufficient && (
        <div className="tw:px-3 tw:py-2 tw:bg-red-100/50 tw:flex tw:items-center tw:gap-3 tw:border-t tw:border-red-200">
          <AlertCircle className="tw:w-4 tw:h-4 tw:text-red-600 tw:flex-shrink-0" />
          <div className="tw:flex-1">
            <div className="tw:text-[11px] tw:font-black tw:text-red-700 tw:uppercase">
              {t("lowBalance")}
            </div>
            <div className="tw:text-[10px] tw:text-red-600 tw:font-medium">
              {t("pleaseRenewToContinue")}
            </div>
          </div>
          {onBuyPlan && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onBuyPlan}
              className="tw:h-8 tw:px-3 tw:text-[10px] tw:font-bold tw:uppercase tw:bg-red-600 hover:tw:bg-red-700 tw:shadow-sm"
            >
              {planType === "Percentage" ? t("topUp") : t("subscribeNow")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformFeeInfo;
