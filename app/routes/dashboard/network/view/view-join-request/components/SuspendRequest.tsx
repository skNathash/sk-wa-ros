import React, { useState } from "react";
import { AlertTriangle, Clock, MessageSquare } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import InfoBlock from "~/components/core/info-blk/InfoBlock";

interface SuspendRequestProps {
  data?: {
    requestedOn?: string | Date;
    reason?: string;
  };
  onAction?: (action: {
    type: "approve" | "reject";
    requestId: string;
  }) => void;
}

const SuspendRequest: React.FC<SuspendRequestProps> = ({ data, onAction }) => {
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  // Static data for demonstration
  const staticData = {
    requestedOn: new Date("2024-01-15T10:30:00Z"),
    reason:
      "Temporary business closure due to renovation. Need to suspend operations for 2 months.",
  };

  const requestData = data || staticData;

  const handleAction = (actionType: "approve" | "reject") => {
    if (actionType === "approve") {
      setConfirmApproveOpen(true);
    } else {
      setConfirmRejectOpen(true);
    }
  };

  const confirmApprove = () => {
    setConfirmApproveOpen(false);
    onAction?.({
      type: "approve",
      requestId: "static-request-id",
    });
  };

  const confirmReject = () => {
    setConfirmRejectOpen(false);
    onAction?.({
      type: "reject",
      requestId: "static-request-id",
    });
  };

  return (
    <>
      <InfoBlock variant="danger">
        <div className="tw:flex tw:gap-2">
          <AlertTriangle
            size={16}
            className="tw:text-red-500 tw:flex-shrink-0 tw:mt-0.5"
          />
          <div className="tw:flex-1">
            <div className="tw:flex-1">
              <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
                Disconnect Request
              </h3>
            </div>
            <p className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              Buyer has requested to suspend their connection
            </p>

            <div className="tw:flex tw:gap-2 tw:justify-between">
              <div className="tw:mt-2 tw:text-xs">
                {requestData.disconnectRequestMessage || "No remarks provided"}
              </div>
              <div className="tw:flex tw:gap-2">
                <AppButton size="small" color="success">
                  Approve Request
                </AppButton>
                <AppButton size="small" color="danger">
                  Reject Request
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </InfoBlock>

      {/* Approve Confirmation Dialog */}
      <AppAlertDialog
        title="Approve Disconnect Request?"
        description="Are you sure you want to approve this disconnect request? The buyer will be disconnected from the network and will need to reapply to join again."
        okText="Approve"
        cancelText="Cancel"
        type="confirm"
        show={confirmApproveOpen}
        onConfirm={confirmApprove}
        onCancel={() => setConfirmApproveOpen(false)}
      />

      {/* Reject Confirmation Dialog */}
      <AppAlertDialog
        title="Reject Disconnect Request?"
        description="Are you sure you want to reject this disconnect request? The buyer will remain connected to the network."
        okText="Reject"
        cancelText="Cancel"
        type="confirm"
        show={confirmRejectOpen}
        onConfirm={confirmReject}
        onCancel={() => setConfirmRejectOpen(false)}
      />
    </>
  );
};

export default SuspendRequest;
