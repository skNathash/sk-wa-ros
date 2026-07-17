import { Info } from "lucide-react";
import React from "react";
import DateFormat from "~/components/core/date/DateFormat";
import AppPopover from "~/components/core/popover/AppPopover";

interface PlatformFeeStatementPlanProps {
  planName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

const PlatformFeeStatementPlan: React.FC<PlatformFeeStatementPlanProps> = ({
  planName,
  startDate,
  endDate,
}) => {
  if (!planName) return null;

  return (
    <div className="tw:flex tw:items-center tw:gap-3">
      <div className="tw:text-gray-800 tw:font-medium">Plan: {planName}</div>

      <AppPopover
        triggerContent={<Info size={16} className="tw:text-gray-600" />}
      >
        <div className="tw:p-2 tw:max-w-xs">
          <div className="tw:text-base tw:font-bold tw:text-gray-900 tw:mb-3">
            {planName}
          </div>

          <div className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2">
            Plan Validity Period
          </div>
          <div className="tw:space-y-1">
            {startDate && (
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:text-gray-600">Start Date:</span>
                <span className="tw:text-sm tw:text-gray-800 tw:font-medium">
                  <DateFormat value={startDate} formatStr="dd MMM yyyy" />
                </span>
              </div>
            )}
            {endDate && (
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:text-gray-600">End Date:</span>
                <span className="tw:text-sm tw:text-gray-800 tw:font-medium">
                  <DateFormat value={endDate} formatStr="dd MMM yyyy" />
                </span>
              </div>
            )}
          </div>
        </div>
      </AppPopover>
    </div>
  );
};

export default PlatformFeeStatementPlan;
