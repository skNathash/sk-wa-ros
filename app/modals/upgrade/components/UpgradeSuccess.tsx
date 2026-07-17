import React from "react";
import { Check } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

interface UpgradeSuccessProps {
  onComplete: (data: any) => void;
  onClose: () => void;
}

const UpgradeSuccess: React.FC<UpgradeSuccessProps> = ({
  onComplete,
  onClose,
}) => {
  const handleClose = () => {
    onComplete({ action: "close" });
  };

  const nextSteps = [
    "StoreKing team will review your request",
    "You'll receive WhatsApp notification on approval",
  ];

  return (
    <>
      <AppModal.Content>
        <div className="tw:space-y-8 tw:py-8">
          {/* Success Icon */}
          <div className="tw:flex tw:justify-center">
            <div className="tw:w-16 tw:h-16 tw:border-2 tw:border-green-500 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-lg">
              <Check className="tw:w-10 tw:h-10 tw:text-green-500" />
            </div>
          </div>

          {/* Success Message */}
          <div className="tw:text-center tw:space-y-3">
            <h2 className="tw:text-2xl tw:font-bold tw:text-gray-800">
              Information Submitted Successfully!
            </h2>
            <p className="tw:text-base tw:text-gray-600 tw:px-4">
              Your upgrade request has been received and is being processed.
            </p>
          </div>

          {/* What's Next Section */}
          <div className="tw:space-y-4">
            <h3 className="tw:text-lg tw:font-semibold tw:text-blue-600">
              What's Next?
            </h3>
            <div className="tw:space-y-3">
              {nextSteps.map((step, index) => (
                <div
                  key={index}
                  className="tw:flex tw:items-start tw:gap-3 tw:text-base tw:text-gray-700"
                >
                  <div className="tw:flex tw:gap-1 tw:items-center">
                    <span>{index + 1}.</span>
                  </div>
                  <span className="tw:leading-relaxed tw:font-medium">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:flex-col tw:items-center tw:space-y-6">
          {/* Close Button */}
          <AppButton
            onClick={handleClose}
            className="tw:w-full tw:max-w-xs tw:bg-blue-600 hover:tw:bg-blue-700 tw:text-white tw:font-medium tw:py-3 tw:rounded-lg"
            size="large"
          >
            Close
          </AppButton>
        </div>
      </AppModal.Footer>
    </>
  );
};

export default UpgradeSuccess;
