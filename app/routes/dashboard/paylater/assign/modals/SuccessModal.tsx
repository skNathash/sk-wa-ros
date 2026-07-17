import React from "react";
import { Check, Clock } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";

interface Props {
  show: boolean;
  onClose: () => void;
  isManpower?: boolean;
  customerName?: string;
  parentRetailerName?: string;
}

const SuccessModal: React.FC<Props> = ({
  show,
  onClose,
  isManpower = false,
  customerName,
  parentRetailerName,
}) => {
  return (
    <AppModal show={show} callback={onClose} className="tw:max-w-md">
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold">
          {isManpower ? "Request Sent for Approval" : "PayLater Assigned"}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:py-6 tw:space-y-4 tw:text-center">
          <div className="tw:flex tw:justify-center">
            {isManpower ? (
              <div className="tw:w-16 tw:h-16 tw:border-2 tw:border-amber-500 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-lg">
                <Clock className="tw:w-8 tw:h-8 tw:text-amber-500" />
              </div>
            ) : (
              <div className="tw:w-16 tw:h-16 tw:border-2 tw:border-green-500 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-lg">
                <Check className="tw:w-8 tw:h-8 tw:text-green-500" />
              </div>
            )}
          </div>

          {isManpower ? (
            <div className="tw:space-y-3">
              <h3 className="tw:text-lg tw:font-semibold tw:text-gray-800">
                Your request has been submitted
              </h3>
              <p className="tw:text-sm tw:text-gray-600">
                PayLater request
                {customerName ? (
                  <>
                    {" "}for{" "}
                    <span className="tw:font-semibold tw:text-gray-800">
                      {customerName}
                    </span>
                  </>
                ) : null}{" "}
                has been sent to
                {parentRetailerName ? (
                  <>
                    {" "}
                    <span className="tw:font-semibold tw:text-gray-800">
                      {parentRetailerName}
                    </span>
                  </>
                ) : (
                  " your parent retailer"
                )}{" "}
                for approval.
              </p>
              <div className="tw:flex tw:justify-center">
                <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1 tw:rounded-full tw:bg-amber-50 tw:text-amber-700 tw:text-xs tw:font-medium tw:border tw:border-amber-200">
                  <Clock className="tw:w-3 tw:h-3" />
                  Pending Approval
                </span>
              </div>
              <p className="tw:text-xs tw:text-gray-500">
                You'll be notified once it's reviewed.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="tw:text-lg tw:font-semibold tw:text-gray-800">
                PayLater assigned successfully
              </h3>
              <p className="tw:text-sm tw:text-gray-600">
                The PayLater has been assigned to the customer.
              </p>
            </div>
          )}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <AppButton
          onClick={onClose}
          color={isManpower ? "primary" : "success"}
          className="tw:w-full"
        >
          {isManpower ? "Got it" : "OK"}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SuccessModal;
