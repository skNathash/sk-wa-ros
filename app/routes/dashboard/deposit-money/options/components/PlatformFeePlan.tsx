import { Info, PlusCircle, Wallet2 } from "lucide-react";
import type { FC } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FranchiseService from "~/services/FranchiseService";
import TopUpPlanModal from "../modals/TopUpPlanModal";
import "animate.css";

export interface PlatformFeePlanDetails {
  planName?: string;
  planEndAt?: string;
  remainingDays?: number;
  displayRemainingDays?: string;
  totalLimit?: number;
  usedAmount?: number;
  availableAmount?: number;
  usagePercentage?: number;
  isPercentage?: boolean;
  planDetails?: any;
}

const PlatformFeePlan: FC<{ highlight?: boolean }> = ({
  highlight = false,
}) => {
  const { t } = useTranslation("platformFee");
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlatformFeePlanDetails | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  const fetchActivePlan = async () => {
    try {
      const activePlan = await FranchiseService.getActivePlan();
      setPlan(activePlan);
    } catch (error) {
      console.error("Failed to fetch active plan:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePlan();
  }, []);

  useEffect(() => {
    if (highlight) {
      setAnimationClass("animate__animated animate__pulse animate__infinite");
      // Remove animation after a few seconds and open modal
      setTimeout(() => {
        setAnimationClass("");
        setShowTopUpModal(true);
      }, 3000);
    }
  }, [highlight]);

  if (loading) {
    return (
      <AppCard className="tw:mb-3 tw:flex tw:items-center tw:justify-center tw:rounded-xl tw:border tw:border-dashed tw:border-gray-200 tw:py-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-4 tw:h-4 tw:border-2 tw:border-blue-600 tw:border-t-transparent tw:rounded-full tw:animate-spin"></div>
          <span className="tw:text-xs tw:text-gray-500">
            {t("checkingPlatformFeePlan")}
          </span>
        </div>
      </AppCard>
    );
  }

  if (
    !plan ||
    !plan.isPercentage ||
    !plan.planDetails ||
    !plan.planDetails?._id
  ) {
    return null;
  }

  const usagePercent = Math.min(100, Math.max(0, plan.usagePercentage ?? 0));

  return (
    <AppCard
      className={`tw:mb-4 tw:border tw:border-blue-100 tw:rounded-xl tw:overflow-hidden tw:shadow-sm ${animationClass}`}
      noPadding
    >
      {/* Compact Header */}
      <div className="tw:bg-blue-50/50 tw:px-3 tw:py-2 tw:flex tw:items-center tw:justify-between tw:border-b tw:border-blue-100/50">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Wallet2 className="tw:text-blue-600 tw:w-4 tw:h-4" />
          <h3 className="tw:text-[11px] tw:font-bold tw:text-blue-900 tw:uppercase tw:tracking-wider">
            {t("platformFeePlanWithAvgFee")}
          </h3>
        </div>
        <div className="tw:flex tw:items-center tw:gap-1 tw:bg-white tw:px-2 tw:py-0.5 tw:rounded-full tw:border tw:border-blue-100">
          <span className="tw:text-[9px] tw:font-bold tw:text-blue-600">
            {plan.planName || t("activePlan")}
          </span>
        </div>
      </div>

      <div className="tw:p-3">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
          {/* Main Balance Info */}
          <div className="tw:flex-1">
            <div className="tw:flex tw:items-baseline tw:gap-1.5 tw:mb-0.5">
              <Amount
                value={plan.availableAmount ?? 0}
                decimalPlaces={0}
                className="tw:text-xl tw:font-black tw:text-gray-900"
              />
              <span className="tw:text-[10px] tw:font-bold tw:text-emerald-600 tw:uppercase">
                {t("planLimitAvailable")}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="tw:flex tw:items-center tw:gap-2 tw:w-full">
              <div className="tw:flex-1 tw:bg-gray-100 tw:h-1.5 tw:rounded-full tw:overflow-hidden">
                <div
                  className={`tw:h-full tw:rounded-full tw:transition-all tw:duration-700 ${
                    usagePercent > 80 ? "tw:bg-red-500" : "tw:bg-blue-600"
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <span className="tw:text-[9px] tw:font-bold tw:text-gray-400 tw:whitespace-nowrap">
                {usagePercent.toFixed(0)}
                {t("percentUsed")}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <AppButton
            size="small"
            color="primary"
            className="tw:rounded-lg tw:px-3 tw:h-8 tw:font-bold tw:flex-shrink-0"
            onClick={() => setShowTopUpModal(true)}
          >
            <PlusCircle size={14} />
            <span>{t("topUpPlan")}</span>
          </AppButton>
        </div>

        {/* Footer info line */}
        <div className="tw:mt-2 tw:pt-2 tw:border-t tw:border-gray-50 tw:flex tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex tw:items-start tw:gap-1.5 tw:text-[9px] tw:text-gray-500">
            <Info size={10} className="tw:text-blue-500 tw:mt-0.5" />
            <div className="tw:flex tw:flex-col tw:gap-0.5">
              <span className="tw:font-bold tw:text-gray-700">
                {t("howItWorks")}
              </span>
              <span>{t("platformFeeExplanation")}</span>
            </div>
          </div>
          <div className="tw:text-[9px] tw:font-bold tw:text-gray-400">
            {t("totalPlanLimit")}{" "}
            <Amount value={plan.totalLimit ?? 0} decimalPlaces={0} />
          </div>
        </div>
      </div>

      <TopUpPlanModal
        show={showTopUpModal}
        plan={plan}
        onClose={(success) => {
          setShowTopUpModal(false);
          if (success) {
            fetchActivePlan();
          }
        }}
      />
    </AppCard>
  );
};

export default PlatformFeePlan;
