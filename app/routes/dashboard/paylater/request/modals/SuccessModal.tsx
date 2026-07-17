import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { CheckCircle, Store } from "lucide-react";
import AuthService from "~/services/AuthService";

type Props = {
  show: boolean;
  onClose: () => void;
  requestId?: string;
  amount?: string | number;
};

const SuccessModal: React.FC<Props> = ({
  show,
  onClose,
  requestId,
  amount,
}) => {
  const user = AuthService.getLoggedInUser() || {};

  const displayName =
    user?.name ||
    user?.ownerDetails?.name ||
    user?.sk_franchise_details?.name ||
    "-";

  const displayMobile =
    user?.mobile ||
    user?.ownerDetails?.mobile ||
    user?.sk_franchise_details?.mobile ||
    "";

  // Prefer linkedFranchise.name as requested, fallback to existing franchise detail
  const franchiseName =
    user?.linkedFranchise?.name || user?.sk_franchise_details?.name || "-";

  const handleShare = async () => {
    const text = `PayLater request sent by ${displayName} ${
      displayMobile ? `(${displayMobile})` : ""
    }${requestId ? `\nRequest ID: ${requestId}` : ""}${
      amount ? `\nAmount: ${amount}` : ""
    }`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        // fallback: copied to clipboard
      }
    } catch (e) {
      // ignore share errors
    }
  };

  return (
    <AppModal show={show} callback={() => onClose()}>
      <AppModal.Title onClose={onClose}>Request Submitted</AppModal.Title>

      <AppModal.Content>
        <div className="tw:relative tw:text-center">
          {/* success circle placed inside the white block */}
          <div className="tw:w-16 tw:h-16 tw:rounded-full tw:mx-auto tw:flex tw:items-center tw:justify-center tw:mb-4 tw:shadow-sm tw:border tw:border-app-success">
            <CheckCircle className="tw:text-4xl tw:text-green-500" />
          </div>
          <div className="tw:text-xl tw:font-semibold tw:mb-2">
            Application Submitted
          </div>
          <div className="tw:text-sm text-app-gray-6 tw:mb-4">
            Your Paylater application has been submitted successfully.
          </div>

          <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:mb-4">
            <div className="tw:text-xs text-app-gray-5 tw:mb-2">
              Request sent to
            </div>
            <div className="tw:flex tw:items-center tw:justify-center">
              <Store className="tw:text-lg text-app-primary tw:mr-2" />

              <span className="text-app-primary tw:font-medium">
                {franchiseName}
              </span>
            </div>
          </div>

          <div className="tw:text-xs text-app-gray-5 tw:mb-4">
            The request will be reviewed and approved by the retailer.
          </div>

          <AppButton
            color="primary"
            onClick={onClose}
            type="button"
            className="tw:w-full"
          >
            Done
          </AppButton>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default SuccessModal;
