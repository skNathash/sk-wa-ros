import { CheckCircle, Sparkles } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  count?: number;
  pendingCount?: number;
};

const SubscribeSuccessModal = ({
  show,
  callback,
  count = 0,
  pendingCount = 0,
}: Props) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleUpdateConfig = () => {
    callback({ action: "update_config" });
  };

  const handleGoToInventory = () => {
    callback({ action: "go_to_inventory" });
  };

  const handleReviewPending = () => {
    callback({ action: "review_pending" });
  };

  return (
    <AppModal show={show} callback={handleClose} backdropDismiss={false}>
      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:items-center tw:p-4 tw:text-center">
          <CheckCircle className="tw:w-16 tw:h-16 tw:text-green-500 tw:mb-4" />
          <h2 className="tw:text-xl tw:font-bold tw:mb-2">
            Subscription Successful
          </h2>
          <p className="tw:text-sm tw:text-gray-600 tw:mb-6">
            You have successfully subscribed {count}{" "}
            {count === 1 ? "product" : "products"}.{" "}
            {pendingCount > 0
              ? "Next, create the pending items found by StoreKing AI."
              : "Please complete their configuration."}
          </p>

          {pendingCount > 0 && (
            <div className="tw:mb-6 tw:w-full tw:flex tw:items-start tw:gap-3 tw:rounded-lg tw:border tw:border-blue-100 tw:bg-blue-50 tw:p-3.5 tw:text-left">
              <Sparkles className="tw:w-5 tw:h-5 tw:text-blue-500 tw:shrink-0 tw:mt-0.5" />
              <div className="tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-blue-900">
                  Create pending products
                </div>
                <div className="tw:text-xs tw:text-blue-800 tw:mt-0.5">
                  You also have {pendingCount} pending {pendingCount === 1 ? "item" : "items"} found by StoreKing AI that {pendingCount === 1 ? "isn't" : "aren't"} in the catalog yet. Review and create them.
                </div>
              </div>
            </div>
          )}

          <div className="tw:w-full tw:flex tw:flex-col tw:gap-3">
            {pendingCount > 0 ? (
              <AppButton
                color="primary"
                onClick={handleReviewPending}
                className="tw:w-full"
              >
                Create pending items
              </AppButton>
            ) : (
              <>
                <AppButton
                  color="primary"
                  onClick={handleUpdateConfig}
                  className="tw:w-full"
                >
                  Update packaging type
                </AppButton>
                <AppButton
                  fill="outline"
                  onClick={handleGoToInventory}
                  className="tw:w-full"
                >
                  Go to inventory
                </AppButton>
              </>
            )}
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default SubscribeSuccessModal;
