import React, { useEffect, useState } from "react";
import { CheckCircle, Calendar, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import FranchiseService from "~/services/FranchiseService";
import useAppNav from "~/hooks/useAppNav";

interface ActivePlatformFeeModalProps {
  show: boolean;
  callback: (params: { action: string }) => void;
  showViewTransactionButton?: boolean;
}

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
}

const ActivePlatformFeeModal: React.FC<ActivePlatformFeeModalProps> = ({
  show,
  callback,
  showViewTransactionButton = false,
}) => {
  const [activePlan, setActivePlan] = useState<ActivePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const appNav = useAppNav();

  useEffect(() => {
    if (show) {
      fetchActivePlan();
    }
  }, [show]);

  const fetchActivePlan = async () => {
    setLoading(true);
    try {
      const plan = await FranchiseService.getActivePlan();
      setActivePlan(plan);
    } catch (error) {
      console.error("Failed to fetch active plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleViewTransaction = () => {
    callback({ action: "close" });
    appNav.to(
      "/dashboard/accounts/purchase-commission?tab=commission-invoices"
    );
  };

  return (
    <AppModal show={show} backdropDismiss={true} callback={handleClose}>
      <AppModal.Title noShadow onClose={handleClose}>
        <div className="tw:font-semibold">
          Platform Fee - Current Active plan
        </div>
      </AppModal.Title>
      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-8">
            <div className="tw:text-gray-500">Loading...</div>
          </div>
        ) : activePlan ? (
          <div className="tw:space-y-3">
            {/* Plan Header */}
            <div className="tw:bg-gradient-to-br tw:from-green-50 tw:to-emerald-50 tw:border tw:border-green-200 tw:rounded-lg tw:p-3">
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:p-1.5 tw:bg-green-100 tw:rounded-md">
                    <CheckCircle className="tw:text-green-600 tw:w-4 tw:h-4" />
                  </div>
                  <div>
                    <div className="tw:text-xs tw:font-semibold tw:text-gray-700">
                      {activePlan.planName || "Platform Fee Plan"}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      Plan Amount:{" "}
                      <Amount value={activePlan.totalLimit} decimalPlaces={2} />
                    </div>
                  </div>
                </div>
                <span className="tw:bg-green-600 tw:text-white tw:text-[9px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-semibold tw:uppercase">
                  Active
                </span>
              </div>
            </div>

            {/* Balance Card */}
            <div className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                <TrendingDown className="tw:text-blue-600 tw:w-4 tw:h-4" />
                <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
                  Balance Limit
                </span>
              </div>
              <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:mb-3">
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                    Purchases Capacity
                  </div>
                  <div className="tw:text-sm tw:font-bold tw:text-gray-700">
                    <Amount value={activePlan.totalLimit} decimalPlaces={2} />
                  </div>
                </div>
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                    Purchases Made
                  </div>
                  <div className="tw:text-sm tw:font-bold tw:text-gray-700">
                    <Amount value={activePlan.usedAmount} decimalPlaces={2} />
                  </div>
                </div>
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                    Purchases Available
                  </div>
                  <div className="tw:text-sm tw:font-bold tw:text-green-600">
                    <Amount
                      value={activePlan.availableAmount}
                      decimalPlaces={2}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="tw:space-y-1">
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-xs tw:text-gray-500">Usage</span>
                  <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
                    {activePlan.usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="tw:w-full tw:bg-gray-200 tw:rounded-full tw:h-2 tw:overflow-hidden">
                  <div
                    className="tw:bg-gradient-to-r tw:from-green-500 tw:to-green-600 tw:h-full tw:rounded-full tw:transition-all tw:duration-300"
                    style={{ width: `${activePlan.usagePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Expiry Information */}
            <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:p-3">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                <Calendar className="tw:text-amber-600 tw:w-4 tw:h-4" />
                <span className="tw:text-xs tw:font-semibold tw:text-gray-700">
                  Plan Validity
                </span>
              </div>
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                    Expiry Date
                  </div>
                  <div className="tw:text-xs tw:font-semibold tw:text-gray-800">
                    {activePlan.planEndAt
                      ? format(new Date(activePlan.planEndAt), "dd MMM yyyy")
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                    Days Remaining
                  </div>
                  <div
                    className={`tw:text-xs tw:font-bold ${
                      activePlan.remainingDays > 7
                        ? "tw:text-green-600"
                        : activePlan.remainingDays > 0
                          ? "tw:text-amber-600"
                          : "tw:text-red-600"
                    }`}
                  >
                    {activePlan.remainingDays > 0
                      ? `${activePlan.remainingDays} days`
                      : "Expired"}
                  </div>
                </div>
              </div>
            </div>

            <div className="tw:mt-1 tw:pb-4 tw:text-xs tw:text-gray-500 tw:italic">
              Note: For total purchases above ₹50,00,000 a fee of 1% + 18% GST
              will be applied on the total purchase amount.
            </div>
          </div>
        ) : (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-8">
            <div className="tw:text-gray-500 tw:text-sm">
              No active plan found
            </div>
          </div>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end">
          {showViewTransactionButton && (
            <AppButton onClick={handleViewTransaction}>
              View Transaction
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ActivePlatformFeeModal;
