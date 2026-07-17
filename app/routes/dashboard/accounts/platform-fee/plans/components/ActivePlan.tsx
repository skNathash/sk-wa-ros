import React, { useState } from "react";
import {
  CheckCircle,
  Calendar,
  TrendingDown,
  Download,
  RefreshCw,
  Percent,
  XCircle,
  Plus,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import FranchiseService from "~/services/FranchiseService";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import CancelPlanModal from "../modals/CancelPlanModal";
import useAppNav from "~/hooks/useAppNav";

interface ActivePlan {
  availableAmount: number;
  paidAt: string;
  totalLimit: number;
  planEndAt: string;
  planId: string | null;
  planName: string;
  planStartAt: string;
  isPlanActive: boolean;
  remainingDays: number;
  displayRemainingDays: string;
  usedAmount: number;
  usagePercentage: number;
  canUpgradePlan: boolean;
  planAmount: number;
  subscriptionId: string;
  isPercentage?: boolean;
  canCancel?: boolean;
  planDetails?: any;
  typeOfPlan?: string;
  type?: string;
  operationalFeeInfo?: { type?: string; value?: number } | null;
}

interface Props {
  activePlan?: ActivePlan | null;
  loading?: boolean;
  balance?: number;
  userName?: string;
  callback: (payload: { action: string; data?: any }) => void;
}

const ActivePlan: React.FC<Props> = ({
  activePlan,
  loading,
  balance = 0,
  userName = "Wallet",
  callback,
}) => {
  const { t } = useTranslation();
  const appToast = useAppToast();
  const appNav = useAppNav();

  const [busyloader, setBusyLoader] = useState({
    show: false,
  });

  const [showCancelModal, setShowCancelModal] = useState(false);

  const download = async () => {
    setBusyLoader({
      show: true,
    });
    const r = await FranchiseService.getPlatformPlanDetails(
      activePlan?.subscriptionId || "",
    );
    setBusyLoader({
      show: false,
    });

    const d = r.data.data?.invoiceDocumentId || "";

    if (!d) {
      appToast.show({
        color: "error",
        msg: "Failed to download plan details",
      });
      return;
    }

    CommonService.assetDownload(d);
  };

  const handleCancel = (payload: { action: string; data?: any }) => {
    if (payload.action === "confirm") {
      // backward compatibility: if some callers still send confirm
      appToast.show({
        color: "success",
        msg: "Plan cancellation request submitted",
      });
    }

    if (payload.action === "cancelled") {
      appToast.show({ color: "success", msg: "Plan cancelled successfully" });
      callback({ action: "cancelled" });
    }

    if (payload.action === "error") {
      appToast.show({ color: "danger", msg: "Failed to cancel plan" });
    }

    setShowCancelModal(false);
  };

  if (loading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:py-3">
        <div className="tw:text-sm tw:text-gray-500">
          {t("platformFee:loadingPlan")}
        </div>
      </div>
    );
  }

  if (!activePlan || !activePlan.isPlanActive || !activePlan.planId) {
    return null;
  }

  return (
    <div className="tw:mb-4">
      {/* Header */}
      <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between tw:mb-3">
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-gray-800">
          <div className="tw:w-2 tw:h-2 tw:bg-green-500 tw:rounded-full tw:flex-shrink-0"></div>
          Your current subscription plan for platform fee
        </div>
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:sm:gap-1.5 tw:items-end tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-lg tw:px-3 tw:py-1.5 tw:self-end tw:sm:self-auto">
          <span className="tw:text-[10px] tw:text-blue-500 tw:font-medium tw:leading-none">
            {userName} {t("platformFee:balance", { defaultValue: "Balance" })}
          </span>
          <span className="tw:text-base tw:font-bold tw:text-blue-700 tw:leading-tight">
            <Amount value={balance} decimalPlaces={2} />
          </span>
        </div>
      </div>

      {/* Compact Header */}
      <div className="tw:flex tw:flex-col sm:tw:flex-row tw:gap-3 tw:bg-white tw:border tw:border-gray-200 tw:border-l-4 tw:border-l-green-500 tw:rounded-lg tw:p-3 tw:shadow-sm">
        {/* Plan Info - Left Side */}
        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:flex tw:items-start tw:gap-2.5 tw:mb-3">
            <div className="tw:p-1.5 tw:bg-green-100 tw:rounded-md tw:flex-shrink-0">
              <CheckCircle className="tw:text-green-600 tw:w-4 tw:h-4" />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap tw:mb-1">
                <span className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                  {activePlan.planName || t("platformFee:platformFeePlan")}
                </span>
                <span className="tw:bg-green-600 tw:text-white tw:text-[9px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-semibold tw:uppercase tw:flex-shrink-0">
                  {t("platformFee:active")}
                </span>
                <span
                  className={`tw:text-[9px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-semibold tw:uppercase tw:flex-shrink-0 ${
                    activePlan.typeOfPlan === "Hybrid"
                      ? "tw:bg-amber-100 tw:text-amber-700"
                      : activePlan.isPercentage
                        ? "tw:bg-blue-100 tw:text-blue-700"
                        : "tw:bg-purple-100 tw:text-purple-700"
                  }`}
                >
                  {activePlan.typeOfPlan === "Hybrid"
                    ? t("platformFee:hybrid", { defaultValue: "Hybrid" })
                    : activePlan.isPercentage
                      ? t("platformFee:percentage")
                      : t("platformFee:fixed")}
                </span>
              </div>
              <div className="tw:text-xs tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                {activePlan.isPercentage ? (
                  <>
                    <Percent className="tw:w-3 tw:h-3 tw:text-blue-600" />
                    <span>{t("platformFee:percentageBasedPlan")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("platformFee:fee")}</span>
                    <Amount
                      value={activePlan.planAmount}
                      decimalPlaces={2}
                      className="tw:font-semibold"
                    />
                    {activePlan.operationalFeeInfo?.value ? (
                      <span className="tw:text-gray-500">
                        {" "}
                        for {activePlan.operationalFeeInfo.value}{" "}
                        {(
                          activePlan.operationalFeeInfo.type || "month"
                        ).toLowerCase()}
                        {activePlan.operationalFeeInfo.value > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Compact Stats Grid */}
          <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-4 tw:gap-3 tw:mb-3">
            {/* Total Limit */}
            <div>
              <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-0.5">
                {t("platformFee:purchaseCapacity")}
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                <Amount value={activePlan.totalLimit} decimalPlaces={2} />
              </div>
            </div>

            {/* Used Limit */}
            <div>
              <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-0.5">
                {t("platformFee:purchasesMade")}
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-gray-700">
                <Amount value={activePlan.usedAmount} decimalPlaces={2} />
              </div>
            </div>

            {/* Available Limit */}
            <div>
              <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-0.5">
                {t("platformFee:remaining")}
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-green-600">
                <Amount value={activePlan.availableAmount} decimalPlaces={2} />
              </div>
            </div>

            {/* Days Remaining */}
            <div>
              <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wide tw:mb-0.5">
                {t("platformFee:daysLeft")}
              </div>
              <div
                className={`tw:text-sm tw:font-bold ${
                  activePlan.remainingDays > 7
                    ? "tw:text-green-600"
                    : activePlan.remainingDays > 0
                      ? "tw:text-amber-600"
                      : "tw:text-red-600"
                }`}
              >
                {activePlan.displayRemainingDays}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="tw:space-y-1">
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wide">
                {t("platformFee:usage")}
              </span>
              <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
                {activePlan.usagePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="tw:w-full tw:bg-gray-200 tw:rounded-full tw:h-1.5 tw:overflow-hidden">
              <div
                className="tw:bg-linear-to-r tw:from-green-500 tw:to-green-600 tw:h-full tw:rounded-full tw:transition-all tw:duration-300"
                style={{ width: `${activePlan.usagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons - Right Side */}
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:flex-shrink-0 tw:items-start">
          {activePlan.canUpgradePlan &&
            activePlan.isPercentage &&
            activePlan.planDetails?._id && (
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:w-full tw:sm:w-auto tw:justify-center">
                <AppButton
                  size="small"
                  onClick={() =>
                    appNav.to("/dashboard/deposit-money/options", {
                      "topup-plan": "1",
                    })
                  }
                  color="primary"
                  className="tw:w-full"
                >
                  <Plus size={14} />
                  <span>{t("platformFee:topUp")}</span>
                </AppButton>
              </div>
            )}
          {!activePlan.isPercentage &&
            activePlan.planDetails &&
            activePlan.canUpgradePlan && (
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:w-full tw:sm:w-auto tw:justify-center">
                <AppButton
                  size="small"
                  onClick={() => callback({ action: "renew" })}
                  color="warning"
                  className="tw:w-full"
                >
                  <RefreshCw size={14} />
                  <span>{t("platformFee:renew")}</span>
                </AppButton>
              </div>
            )}
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:w-full tw:sm:w-auto tw:justify-center">
            <AppButton
              size="small"
              onClick={download}
              fill="outline"
              color="success"
              isLoading={busyloader.show}
              className="tw:w-full"
            >
              <Download size={14} />
              <span>{t("platformFee:invoice")}</span>
            </AppButton>
          </div>
          {activePlan.canCancel && (
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:w-full tw:sm:w-auto tw:justify-center">
              <AppButton
                size="small"
                onClick={() => setShowCancelModal(true)}
                fill="outline"
                color="danger"
                className="tw:w-full"
              >
                <XCircle size={14} />
                <span>{t("platformFee:cancelPlan")}</span>
              </AppButton>
            </div>
          )}
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:w-full tw:sm:w-auto tw:justify-center">
            <AppButton
              size="small"
              onClick={() =>
                appNav.to("/dashboard/accounts/platform-fee/statement")
              }
              fill="outline"
              color="primary"
              className="tw:w-full"
            >
              <FileText size={14} />
              <span>Platform Fee Statement</span>
            </AppButton>
          </div>
        </div>
      </div>

      <CancelPlanModal
        show={showCancelModal}
        plan={activePlan}
        callback={handleCancel}
      />

      {/* Expiry Date Info - Only show if expiring soon */}
      {activePlan.remainingDays <= 7 && activePlan.remainingDays > 0 && (
        <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:px-3 tw:py-2">
          <Calendar className="tw:text-amber-600 tw:w-3.5 tw:h-3.5 tw:flex-shrink-0" />
          <span className="tw:text-xs tw:text-amber-700">
            {t("platformFee:expiresOn")}{" "}
            <DateFormat
              value={activePlan.planEndAt}
              formatStr="dd MMM yyyy"
              className="tw:font-semibold"
            />
          </span>
        </div>
      )}
    </div>
  );
};

export default ActivePlan;
