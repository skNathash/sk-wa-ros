import React from "react";
import { CheckCircle, Clock, Edit } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";

type PaylaterStatusCardProps = {
  status: string;
  requestId: string;
  className?: string;
  retailerName: string;
  rawRequestId?: string;
};

const PaylaterStatusCard: React.FC<PaylaterStatusCardProps> = ({
  status,
  requestId,
  className = "",
  retailerName,
  rawRequestId,
}) => {
  const isApproved = String(status).toLowerCase().includes("approve");
  const isPending = String(status).toLowerCase() === "pending";
  const isPaused = String(status).toLowerCase() === "paused";
  const isCancelled = String(status).toLowerCase() === "cancelled";
  const appNav = useAppNav();

  const handleEdit = () => {
    // Use rawRequestId if provided, otherwise fall back to requestId
    const idToUse = rawRequestId || requestId;
    appNav.to("/dashboard/paylater/request", { id: idToUse });
  };

  return (
    <AppCard className={className}>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-4 tw:border-b tw:border-gray-200 tw:pb-2">
        <div className="tw:text-lg tw:font-semibold">
          Your Paylater Application Status
        </div>
        {isPending && (
          <AppButton
            size="small"
            color="primary"
            fill="outline"
            onClick={handleEdit}
            type="button"
          >
            <Edit size={14} className="tw:mr-1" />
            Edit
          </AppButton>
        )}
      </div>

      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
        {isApproved ? (
          <CheckCircle
            size={32}
            className="tw:w-8 tw:h-8 tw:text-green-500 tw:bg-green-100 tw:rounded-full tw:p-2"
          />
        ) : (
          <Clock
            size={32}
            className="tw:w-8 tw:h-8 tw:text-yellow-500 tw:bg-yellow-100 tw:rounded-full tw:p-2"
          />
        )}
        <div className="tw:flex-1">
          <div className="tw:text-sm tw:text-gray-500">Status</div>
          <div className="tw:text-lg tw:font-semibold tw:uppercase">
            {status === "Cancelled" ? "Stopped" : status}
          </div>
        </div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between tw:border-b tw:border-gray-200 tw:pb-2 tw:mb-2">
        <div className="tw:text-sm tw:text-gray-500">Request ID</div>
        <div className="tw:text-base tw:font-semibold">{requestId}</div>
      </div>

      <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between">
        <div className="tw:text-sm tw:text-gray-500">Retailer</div>
        <div className="tw:text-base tw:font-semibold">{retailerName}</div>
      </div>

      <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
        {isPaused && (
          <>
            Your Paylater account is currently Paused. Please contact your
            retailer to reactivate the account and continue using Paylater.
          </>
        )}
        {isCancelled && (
          <>
            Your Paylater account is Stopped by the retailer. Please contact
            your retailer to reactivate the account and continue using Paylater.
          </>
        )}
        {!isPaused && !isCancelled && (
          <>
            Please wait while your Paylater application is being processed by
            the retailer.
          </>
        )}
      </div>
    </AppCard>
  );
};

export default PaylaterStatusCard;
