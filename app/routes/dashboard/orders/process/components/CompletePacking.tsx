import React, { useState } from "react";
import { Check, Package } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import useAppToast from "~/hooks/useAppToast";
import SellerService from "~/services/SellerService";

interface CompletePackingUIProps {
  callback: (params: { action: string; data?: any }) => void;
  orderId: string;
  boxes: any[];
}

const CompletePacking: React.FC<CompletePackingUIProps> = ({
  callback,
  orderId,
  boxes,
}) => {
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCompletePackingClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmComplete = async () => {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      // Filter boxes with "Closed" status
      const closedBoxes = boxes.filter((box) => box.status === "Saved");

      if (closedBoxes.length === 0) {
        throw new Error("No closed boxes found");
      }

      const payload = {
        orderId,
        packageIds: closedBoxes.map((box) => box._id),
      };

      // Use the first closed box ID for the API call (assuming the API needs a box ID)
      const response = await SellerService.closeBox(payload);

      if (response?.statusCode === 200) {
        appToast.show({
          msg: "Packing completed successfully and stock deducted from batches.",
          color: "success",
        });

        // Trigger callback with success action
        callback({
          action: "packingCompleted",
          data: { boxIds: closedBoxes.map((box) => box.id), response },
        });
      } else {
        throw new Error(
          response?.data?.message || "Failed to complete packing"
        );
      }
    } catch (error: any) {
      appToast.show({
        msg: error?.message || "An error occurred while completing packing.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelComplete = () => {
    setShowConfirmDialog(false);
  };

  if (!boxes || boxes.length === 0) {
    return null;
  }

  // Filter only closed boxes for display
  const closedBoxes = boxes.filter((box) => box.status === "Saved");

  if (closedBoxes.length === 0) {
    return null;
  }

  const totalBoxes = closedBoxes.length;

  return (
    <>
      <div className="tw:mt-4 tw:p-6 tw:bg-green-50 tw:rounded-lg tw:border tw:border-green-200 tw:mb-4">
        <div className="tw:text-center">
          {/* Success Icon */}
          <div className="tw:flex tw:justify-center tw:mb-4">
            <div className="tw:w-16 tw:h-16 tw:bg-green-100 tw:rounded-full tw:flex tw:items-center tw:justify-center">
              <Check className="tw:w-8 tw:h-8 tw:text-green-600" />
            </div>
          </div>

          {/* Main Heading */}
          <h3 className="tw:text-xl tw:font-bold tw:text-green-800 tw:mb-2">
            All items have been packed!
          </h3>

          {/* Status */}
          <p className="tw:text-green-700 tw:mb-4">
            {totalBoxes} box{totalBoxes > 1 ? "es" : ""} ready for shipment
          </p>

          {/* Information Bar */}
          <div className="tw:bg-green-100 tw:rounded tw:px-4 tw:py-3 tw:mb-6">
            <p className="tw:text-sm tw:text-green-700">
              Completing packing will deduct stock from the specified batches
            </p>
          </div>

          {/* Action Button */}
          <AppButton
            color="success"
            fill="solid"
            onClick={handleCompletePackingClick}
            disabled={loading}
            isLoading={loading}
          >
            <Package size={18} />
            Complete Packing & Deduct Stock from Batches
          </AppButton>
        </div>
      </div>

      <AppAlertDialog
        show={showConfirmDialog}
        title="Complete Packing"
        description="Are you sure you want to complete packing and deduct stock from the specified batches? This action cannot be undone."
        onConfirm={handleConfirmComplete}
        onCancel={handleCancelComplete}
        type="confirm"
        okText="Complete Packing"
        cancelText="Cancel"
      />
    </>
  );
};

export default CompletePacking;
