import { CheckCircle2, ClipboardCheck, ShoppingCart, Store } from "lucide-react";

import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

interface Props {
  show: boolean;
  /** FoundInSk products subscribed to the cart. */
  subscribedCount: number;
  /** Items sent to the catalog team for approval. */
  createdCount: number;
  /** Close the modal and head to the subscription cart. */
  onViewCart: () => void;
  onClose: () => void;
}

/**
 * Shown after a bulk subscribe completes. It states plainly what happened — how
 * many products landed in the subscription cart and how many were sent for
 * approval — and points the user to the cart to finish up.
 */
const SubscribeSuccessModal: React.FC<Props> = ({
  show,
  subscribedCount,
  createdCount,
  onViewCart,
  onClose,
}) => {
  return (
    <AppModal show={show} callback={onClose} isAutoHeight>
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <CheckCircle2 className="tw:w-5 tw:h-5 tw:text-emerald-500" />
          <span className="tw:font-bold">All done</span>
        </div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Here's a summary of what just happened.
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-2.5">
          {subscribedCount > 0 && (
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border tw:border-emerald-100 tw:bg-emerald-50 tw:px-3.5 tw:py-3">
              <Store className="tw:w-5 tw:h-5 tw:shrink-0 tw:text-emerald-500 tw:mt-0.5" />
              <div className="tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-emerald-800">
                  {subscribedCount}{" "}
                  {subscribedCount === 1 ? "item" : "items"} subscribed
                </div>
                <div className="tw:text-xs tw:text-emerald-700 tw:mt-0.5">
                  Added to your subscription cart.
                </div>
              </div>
            </div>
          )}

          {createdCount > 0 && (
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border tw:border-blue-100 tw:bg-blue-50 tw:px-3.5 tw:py-3">
              <ClipboardCheck className="tw:w-5 tw:h-5 tw:shrink-0 tw:text-blue-500 tw:mt-0.5" />
              <div className="tw:min-w-0">
                <div className="tw:text-sm tw:font-semibold tw:text-blue-800">
                  {createdCount} {createdCount === 1 ? "item request" : "item requests"}{" "}
                  sent for approval
                </div>
                <div className="tw:text-xs tw:text-blue-700 tw:mt-0.5">
                  The StoreKing catalog team will verify them.
                </div>
              </div>
            </div>
          )}
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <AppButton className="tw:w-full" onClick={onViewCart}>
          <ShoppingCart className="tw:w-4 tw:h-4 tw:mr-1.5" />
          View subscription cart
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SubscribeSuccessModal;
