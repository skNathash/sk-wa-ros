import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import { Ban, Clock, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

type Props = {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
  status?: string | null;
  sellerName?: string | null;
  availableBalance?: number | null;
};

const StatusBlock = ({
  status,
  statusLabel,
  description,
  icon: Icon,
  bgColor,
  textColor,
}: any) => (
  <div
    className={`tw:p-3 tw:rounded-lg tw:border tw:border-gray-200 ${bgColor}`}
  >
    <div className="tw:flex tw:items-start tw:gap-3">
      <Icon className={`tw:w-5 tw:h-5 tw:shrink-0 ${textColor}`} />
      <div className="tw:flex-1 tw:min-w-0">
        <div className={`tw:font-medium tw:text-sm ${textColor}`}>
          {statusLabel}
        </div>
        <p className="tw:text-xs tw:text-gray-600 tw:mt-1">{description}</p>
      </div>
    </div>
  </div>
);

const PaylaterStatusModal = ({
  show,
  callback,
  status,
  sellerName,
  availableBalance,
}: Props) => {
  const onClose = () => callback({ action: "close", data: {} });

  const handleRequest = () => {
    callback({ action: "request", data: { sellerName } });
  };

  const handleTopUp = () => {
    callback({ action: "topup", data: { sellerName } });
  };

  const getStatusBlock = () => {
    // Use API-provided status values directly (e.g. "Approved", "NOT_AVAILABLE", "Pending")
    switch (status) {
      case "NOT_AVAILABLE":
        return (
          <StatusBlock
            status="NOT_AVAILABLE"
            statusLabel="Not Available"
            description={`A request has been sent to the seller to enable PayLater for ${sellerName}. We'll notify you when it's approved.`}
            icon={Ban}
            bgColor="tw:bg-red-50"
            textColor="tw:text-red-700"
          />
        );
      case "Pending":
        return (
          <StatusBlock
            status="Pending"
            statusLabel="Request Pending"
            description={`Your request for ${sellerName} is under review. We'll notify you soon.`}
            icon={Clock}
            bgColor="tw:bg-yellow-50"
            textColor="tw:text-yellow-700"
          />
        );
      case "Approved":
        if (availableBalance === null || Number(availableBalance) <= 0) {
          const desc =
            availableBalance !== null ? (
              <>
                Insufficient PayLater balance. Current balance:{" "}
                <Amount value={availableBalance} />. Top up to complete your
                purchase.
              </>
            ) : (
              `Insufficient PayLater balance. Top up to complete your purchase.`
            );

          return (
            <StatusBlock
              status="Approved_low_balance"
              statusLabel="Low Balance"
              description={desc}
              icon={AlertCircle}
              bgColor="tw:bg-orange-50"
              textColor="tw:text-orange-700"
            />
          );
        }
        return (
          <StatusBlock
            status="Approved"
            statusLabel="Ready to Use"
            description={`PayLater approved for ${sellerName}. Balance: ₹${availableBalance}`}
            icon={CheckCircle}
            bgColor="tw:bg-green-50"
            textColor="tw:text-green-700"
          />
        );
      default:
        return status ? (
          <StatusBlock
            status="unknown"
            statusLabel="Status Unknown"
            description={`Current status: ${status}`}
            icon={HelpCircle}
            bgColor="tw:bg-gray-50"
            textColor="tw:text-gray-700"
          />
        ) : (
          <StatusBlock
            status="no_status"
            statusLabel="No Status Available"
            description="Unable to determine PayLater status. Please try again."
            icon={AlertCircle}
            bgColor="tw:bg-gray-50"
            textColor="tw:text-gray-700"
          />
        );
    }
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={onClose}>PayLater Status</AppModal.Title>

      <AppModal.Content>{getStatusBlock()}</AppModal.Content>

      <AppModal.Footer>
        {(function footerForStatus() {
          // Footer uses API-provided status values directly
          if (status === "NOT_AVAILABLE") {
            return (
              <div className="tw:flex tw:gap-2 tw:w-full">
                <AppButton
                  fill="outline"
                  color="secondary"
                  onClick={onClose}
                  className="tw:flex-1"
                >
                  Cancel
                </AppButton>
                <AppButton
                  fill="solid"
                  color="primary"
                  onClick={handleRequest}
                  className="tw:flex-1"
                >
                  Request PayLater
                </AppButton>
              </div>
            );
          }

          if (
            status === "Approved" &&
            (availableBalance === null || Number(availableBalance) <= 0)
          ) {
            return (
              <AppButton
                fill="solid"
                color="primary"
                onClick={onClose}
                className="tw:w-full"
              >
                Close
              </AppButton>
            );
          }

          return (
            <AppButton
              fill="solid"
              color="primary"
              onClick={onClose}
              className="tw:w-full"
            >
              Close
            </AppButton>
          );
        })()}
      </AppModal.Footer>
    </AppModal>
  );
};

export default PaylaterStatusModal;
