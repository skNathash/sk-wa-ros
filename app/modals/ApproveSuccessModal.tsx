import React from "react";
import { Check } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
// Using plain English strings instead of translations

interface ApproveSuccessModalProps {
  show: boolean;
  orderId?: string;
  onClose: () => void; // called when user chooses "Later" or closes
  onProcessNow: (orderId?: string) => void; // called when user chooses to process now
}

const ApproveSuccessModal: React.FC<ApproveSuccessModalProps> = ({
  show,
  orderId,
  onClose,
  onProcessNow,
}) => {
  // No i18n: use English literals directly

  const handleProcessNow = () => {
    onProcessNow(orderId);
  };

  const handleLater = () => {
    onClose();
  };

  return (
    <AppModal show={show} callback={() => onClose()} className="tw:max-w-md">
      <AppModal.Title onClose={() => onClose()}>
        <div className="tw:font-semibold">Order approved</div>
        <div className="tw:text-sm tw:text-gray-500">
          Do you want to process it now or later?
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:py-6 tw:space-y-4 tw:text-center">
          <div className="tw:flex tw:justify-center">
            <div className="tw:w-16 tw:h-16 tw:border-2 tw:border-green-500 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-lg">
              <Check className="tw:w-8 tw:h-8 tw:text-green-500" />
            </div>
          </div>

          <div className="tw:text">
            <h3 className="tw:text-lg tw:font-semibold tw:text-gray-800">
              Order approved
            </h3>
            <p className="tw:text-sm tw:text-gray-600">
              Would you like to process the order now or later?
            </p>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:md:flex-row tw:gap-2 tw:w-full">
          <AppButton
            onClick={handleLater}
            color="light"
            fill="outline"
            className="tw:flex-1"
          >
            Later
          </AppButton>

          <AppButton
            onClick={handleProcessNow}
            color="success"
            className="tw:flex-1"
          >
            Process now
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ApproveSuccessModal;
