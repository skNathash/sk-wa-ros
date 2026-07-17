import React, { useState } from "react";
import { Package } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import { pickAllProcess } from "./helper";

interface PickAllItemsProps {
  products: any[];
  orderId: string;
  onPickAllComplete?: (result: any) => void;
  onPickAllError?: (error: Error) => void;
}

const PickAllItems: React.FC<PickAllItemsProps> = ({
  products,
  orderId,
  onPickAllComplete,
  onPickAllError,
}) => {
  const [loading, setLoading] = useState(false);

  // Check if any product has snapshots array length > 0
  const hasProductsWithSnapshots = products.some(
    (product) => product.snapshots && product.snapshots.length > 0,
  );

  // Hide the block if products have snapshots
  if (hasProductsWithSnapshots) {
    return null;
  }

  const handlePickAll = async () => {
    if (loading || products.length === 0) return;

    setLoading(true);
    try {
      await pickAllProcess(
        products,
        orderId,
        (result) => {
          if (onPickAllComplete) {
            onPickAllComplete(result);
          }
        },
        (error) => {
          console.error("Pick all error:", error);
          if (onPickAllError) {
            onPickAllError(error);
          }
        },
      );
    } catch (error) {
      console.error("Unexpected error in pick all:", error);
      if (onPickAllError) {
        onPickAllError(error as Error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw:mb-4 tw:p-4 tw:bg-gradient-to-r tw:from-blue-50 tw:to-indigo-50 tw:rounded-lg tw:border tw:border-blue-200">
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-10 tw:h-10 tw:bg-blue-100 tw:rounded-full">
            <Package className="tw:w-5 tw:h-5 tw:text-blue-600" />
          </div>
          <div>
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900">
              Pick All Items
            </h3>
            <p className="tw:text-xs tw:text-gray-600">
              {products.length > 0
                ? `${products.length} items available for picking`
                : "No items available"}
            </p>
          </div>
        </div>

        <div className="tw:flex tw:items-center tw:gap-2">
          <AppButton
            onClick={handlePickAll}
            size="small"
            fill="solid"
            color="primary"
            disabled={loading || products.length === 0}
            className="tw:min-w-[120px]"
          >
            {loading ? (
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:w-4 tw:h-4 tw:border-2 tw:border-white tw:border-t-transparent tw:rounded-full tw:animate-spin" />
                Picking...
              </div>
            ) : (
              <div className="tw:flex tw:items-center tw:gap-2">
                <Package className="tw:w-4 tw:h-4" />
                Pick All Items
              </div>
            )}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default PickAllItems;
