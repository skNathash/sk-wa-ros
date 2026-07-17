import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Barcode } from "lucide-react";

interface AssignBarcodeModalProps {
  barcode: string;
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}

const AssignBarcodeModal: React.FC<AssignBarcodeModalProps> = ({
  barcode,
  show,
  callback,
}) => {
  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <span className="tw:text-lg tw:font-bold">Barcode Not Found</span>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:bg-yellow-50 tw:rounded tw:p-4 tw:flex tw:items-center tw:gap-2 tw:text-sm tw:flex-wrap">
          <span className="tw:text-gray-700">The barcode</span>
          <span className="tw:bg-yellow-100 tw:px-2 tw:py-1 tw:rounded tw:font-mono tw:text-sm tw:font-semibold tw:text-yellow-800">
            {barcode}
          </span>
          <span className="tw:text-gray-700">
            was not found in any existing products.
          </span>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:gap-4 tw:w-full">
          <AppButton
            color="dark"
            onClick={() => callback({ action: "add-to-existing" })}
            size="small"
            expand="block"
            className="tw:flex-1"
          >
            <Barcode className="tw:w-5 tw:h-5" />
            Add to Existing Product
          </AppButton>
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={() => callback({ action: "close" })}
            expand="block"
            className="tw:flex-1"
          >
            Cancel
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default AssignBarcodeModal;
