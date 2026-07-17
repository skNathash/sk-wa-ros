import { CheckCircle, Package } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

interface AddStockSuccessModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  productName?: string;
  quantity?: number;
}

const AddStockSuccessModal: React.FC<AddStockSuccessModalProps> = ({
  show,
  callback,
  productName,
  quantity,
}) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  const handleViewInventory = () => {
    callback({ action: "view-inventory" });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex-shrink-0">
            <CheckCircle className="tw:text-green-500" size={24} />
          </div>
          <div className="tw:flex-1">
            <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
              Stock Added Successfully!
            </h2>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:text-center tw:py-4">
          <div className="tw:flex tw:justify-center tw:mb-4">
            <div className="tw:bg-green-100 tw:rounded-full tw:p-3">
              <Package className="tw:text-green-600" size={32} />
            </div>
          </div>

          <div className="tw:space-y-2">
            <p className="tw:text-gray-700 tw:text-base">
              {productName && quantity ? (
                <>
                  <span className="tw:font-medium">{quantity}</span> units of{" "}
                  <span className="tw:font-medium">"{productName}"</span> have
                  been successfully added to your inventory.
                </>
              ) : (
                "Your stock has been added successfully to the inventory."
              )}
            </p>

            <p className="tw:text-gray-600 tw:md:text-xs tw:text-sm">
              You can now view your updated inventory or continue managing your
              products.
            </p>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-center tw:gap-3 tw:w-full">
          <AppButton
            onClick={handleClose}
            fill="outline"
            color="secondary"
            size="default"
          >
            Close
          </AppButton>
          <AppButton
            onClick={handleViewInventory}
            color="primary"
            size="default"
          >
            View Inventory
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AddStockSuccessModal;
