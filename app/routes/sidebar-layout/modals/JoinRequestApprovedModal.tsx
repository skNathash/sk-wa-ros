import { CheckCircle2 } from "lucide-react";
import React from "react";
import AppModal from "~/components/core/modal/AppModal";

type JoinRequestApprovedModalProps = {
  show: boolean;
  callback: (r: { action: "close" | "continue"; data?: any }) => void;
  sellerName?: string;
};

const JoinRequestApprovedModal: React.FC<JoinRequestApprovedModalProps> = ({
  show,
  callback,
  sellerName,
}) => {
  return (
    <AppModal
      show={show}
      callback={(e) => e.action === "close" && callback({ action: "close" })}
      backdropDismiss={false}
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:font-semibold">Request Approved</div>
      </AppModal.Title>
      <AppModal.Content className="tw:p-4">
        <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:gap-3">
          <CheckCircle2 className="tw:w-12 tw:h-12 tw:text-emerald-600" />
          <div className="tw:text-lg tw:font-semibold">
            Your join request has been approved
          </div>
          {sellerName ? (
            <div className="tw:text-sm tw:text-gray-800 tw:font-medium">
              By SK Seller:{" "}
              <span className="tw:text-black tw:font-semibold">
                &quot;{sellerName}&quot;
              </span>
            </div>
          ) : null}
          <div className="tw:text-sm tw:text-gray-600">
            You can now start engaging with your seller. Explore products, place
            orders, and manage your relationship seamlessly.
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:justify-end">
          <button
            className="tw:px-4 tw:py-2 tw:text-sm tw:rounded-md tw:bg-black tw:text-white"
            onClick={() => callback({ action: "continue" })}
          >
            Continue
          </button>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default JoinRequestApprovedModal;
