import { Package, ArrowRight } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import SellerService from "~/services/SellerService";
import useAppToast from "~/hooks/useAppToast";

type Props = {
  products: any[];
  callback: ({ action, data }: { action: string; data?: any }) => void;
};

const MoveAllToBox = ({ products, callback }: Props) => {
  // Get boxes from the first record of the products
  const firstProduct = products?.[0];
  const boxes = firstProduct?.boxes || [];

  // Show this component only if there is exactly one box
  if (boxes.length !== 1) {
    return null;
  }

  // Use the first (and only) box details
  const box = boxes[0];
  const boxId = box?._id;
  const boxName = box?.displayBoxName;

  // Loading state for API call
  const [isLoading, setIsLoading] = useState(false);

  // Toast hook for error handling
  const { show: showToast } = useAppToast();

  // Alert dialog state
  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleMoveAll = () => {
    setAppAlertDialog({
      show: true,
      title: "Move All Products",
      description: `Are you sure you want to move all remaining products to "${
        boxName || "the selected box"
      }"?`,
      onConfirm: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        moveAllToBox();
      },
      onCancel: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const moveAllToBox = async () => {
    if (!boxId || !products || products.length === 0) {
      showToast({
        msg: "Invalid box or products data",
        color: "error",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Build payload similar to MoveToBoxModal
      const items: any[] = [];

      products.forEach((product) => {
        // Get the first pickDetail for this product
        const pickDetail = product.pickDetails?.[0];
        if (pickDetail && pickDetail.snapshots) {
          pickDetail.snapshots.forEach((snapshot: any) => {
            items.push({
              dealId: product.dealId,
              qty: snapshot.quantity,
              mrp: snapshot.mrp,
              snapshotId: snapshot.snapshotId || snapshot._id || snapshot.id,
            });
          });
        }
      });

      if (items.length === 0) {
        showToast({
          msg: "No items to move",
          color: "error",
        });
        return;
      }

      const payload = {
        pickingId: products[0]?.pickDetails[0]?.pickingId,
        items: items,
      };

      const response = await SellerService.saveBox(boxId, payload);

      if (response.statusCode === 200) {
        showToast({
          msg: `Successfully moved all products to ${boxName}`,
          color: "success",
        });

        // Notify parent Products component
        callback({
          action: "moveAll",
          data: {
            products,
            boxId,
            boxName,
            success: true,
          },
        });
      } else {
        showToast({
          msg: response.data?.message || "Failed to move products to box",
          color: "error",
        });
      }
    } catch (error: any) {
      console.error("Error moving all products to box:", error);
      showToast({
        msg: error?.message || "An error occurred while moving products",
        color: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="tw:bg-white tw:rounded-lg tw:p-3 tw:sm:p-4 tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:gap-3 tw:sm:gap-4">
        {/* Icon Column */}
        <div className="tw:flex-shrink-0 tw:self-center tw:sm:self-start">
          <div className="tw:w-10 tw:h-10 tw:bg-blue-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
            <Package className="tw:w-5 tw:h-5 tw:text-blue-600" />
          </div>
        </div>

        {/* Content Column */}
        <div className="tw:flex-1 tw:min-w-0 tw:w-full">
          <div className="tw:mb-3 tw:sm:mb-2">
            <h3 className="tw:text-sm tw:font-medium tw:text-gray-900 tw:text-center tw:sm:text-left">
              Move All Products
            </h3>
            <p className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:text-center tw:sm:text-left tw:leading-relaxed">
              Move all remaining products to{" "}
              {boxName ? `"${boxName}"` : "the selected box"}
            </p>
          </div>

          {/* Move All Button */}
          <AppButton
            color="success"
            size="small"
            onClick={handleMoveAll}
            className="tw:mt-2 tw:w-full tw:sm:w-auto"
            disabled={isLoading}
            isLoading={isLoading}
          >
            <span className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:w-full">
              <span className="tw:truncate">
                {isLoading ? "Moving..." : `Move all to ${boxName || "box"}`}
              </span>
              {!isLoading && (
                <ArrowRight size={12} className="tw:flex-shrink-0" />
              )}
            </span>
          </AppButton>
        </div>
      </div>

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
        type="confirm"
        okText="Move All"
        cancelText="Cancel"
      />
    </>
  );
};

export default MoveAllToBox;
