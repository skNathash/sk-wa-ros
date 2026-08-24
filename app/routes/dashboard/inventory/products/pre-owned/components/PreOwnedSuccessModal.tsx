import { CheckCircle, PackagePlus, Warehouse } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

interface PreOwnedSuccessModalProps {
  show: boolean;
  /** `go-to-inventory` | `add-stock` | `close` */
  callback: (params: { action: string; data?: any }) => void;
  dealName?: string;
}

/**
 * Shown once a pre-owned unit has been listed. The unit exists in the catalog
 * at this point but carries no stock yet, so the two ways forward are opening
 * the inventory list or adding the intake quantity right away.
 */
const PreOwnedSuccessModal: React.FC<PreOwnedSuccessModalProps> = ({
  show,
  callback,
  dealName,
}) => {
  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <CheckCircle className="tw:text-green-500 tw:shrink-0" size={24} />
          <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
            Pre-owned unit listed
          </h2>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:py-4 tw:text-center">
          <div className="tw:mb-4 tw:flex tw:justify-center">
            <div className="tw:rounded-full tw:bg-green-100 tw:p-3">
              <PackagePlus className="tw:text-green-600" size={32} />
            </div>
          </div>
          <p className="tw:text-base tw:text-gray-700">
            {dealName ? (
              <>
                <span className="tw:font-medium">"{dealName}"</span> has been
                added to your catalog.
              </>
            ) : (
              "The pre-owned unit has been added to your catalog."
            )}
          </p>
          <p className="tw:mt-2 tw:text-sm tw:text-gray-600 tw:md:text-xs">
            Add the intake stock now so it is ready to sell, or head to your
            inventory to review it.
          </p>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        {/* Stacked on narrow screens — both labels are too long to sit side by
            side without wrapping. */}
        <div className="tw:flex tw:w-full tw:flex-col-reverse tw:gap-3 tw:sm:flex-row tw:sm:justify-center">
          <AppButton
            onClick={() => callback({ action: "go-to-inventory" })}
            fill="outline"
            color="secondary"
            size="default"
          >
            <Warehouse size={16} />
            Go to Inventory
          </AppButton>
          <AppButton
            onClick={() => callback({ action: "add-stock" })}
            color="primary"
            size="default"
          >
            <PackagePlus size={16} />
            Add Stock
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PreOwnedSuccessModal;
