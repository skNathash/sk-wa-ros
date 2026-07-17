import React, { useEffect, useState } from "react";
import { CheckCircle, Eye } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import FranchiseService from "~/services/FranchiseService";
import ActivePlatformFeeModal from "~/shared/catalog/modals/active-platform-fee/ActivePlatFormFeeModal";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

const ActivePlan: React.FC = () => {
  const [activePlan, setActivePlan] = useState<{
    planName: string;
    isPlanActive: boolean;
    planAmount: number;
    planEndAt: string;
    displayRemainingDays: string;
    availableAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchActivePlan();
  }, []);

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

  const handleViewMore = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:py-3">
        <div className="tw:text-sm tw:text-gray-500">Loading plan...</div>
      </div>
    );
  }

  if (!activePlan || !activePlan.isPlanActive) {
    return null;
  }

  return (
    <>
      <div className="tw:bg-gradient-to-br tw:from-green-50 tw:to-white tw:border tw:border-green-200 tw:rounded-lg tw:p-3 tw:mb-4 tw:shadow-sm">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
          <div className="tw:flex tw:items-start tw:gap-2.5 tw:flex-1 tw:min-w-0">
            <div className="tw:p-1.5 tw:bg-green-100 tw:rounded-md tw:flex-shrink-0">
              <CheckCircle className="tw:text-green-600 tw:w-4 tw:h-4" />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-tight">
                  {activePlan.planName}
                </h3>
                <span className="tw:bg-green-600 tw:text-white tw:text-[10px] tw:px-2 tw:py-0.5 tw:rounded-full tw:font-semibold tw:uppercase tw:leading-none">
                  Active
                </span>
              </div>
              <div className="tw:text-xs tw:text-gray-600 tw:space-y-0.5 tw:flex tw:gap-2 tw:flex-wrap">
                <div>
                  Available:{" "}
                  <span className="tw:font-semibold tw:text-green-700">
                    <Amount
                      value={activePlan.availableAmount}
                      decimalPlaces={2}
                    />
                  </span>
                </div>
                <div>
                  Expires:{" "}
                  <DateFormat
                    value={activePlan.planEndAt}
                    formatStr="dd MMM yyyy"
                  />
                </div>
              </div>
            </div>
          </div>
          <AppButton
            onClick={handleViewMore}
            size="small"
            fill="clear"
            color="primary"
            className="tw:flex tw:items-center tw:gap-1 tw:flex-shrink-0 tw:text-xs"
          >
            <Eye size={13} />
            <span className="tw:hidden sm:tw:inline">View More</span>
            <span className="sm:tw:hidden">View</span>
          </AppButton>
        </div>
      </div>
      <ActivePlatformFeeModal show={showModal} callback={handleModalClose} />
    </>
  );
};

export default ActivePlan;
