import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  show: boolean;
  products?: any[];
  callback?: (args: { action: string; data?: any }) => void;
};

const ConfirmModal: React.FC<Props> = ({
  show = false,
  products = [],
  callback,
}) => {
  const [totals, setTotals] = useState({
    totalProducts: products.length,
    totalEnabled: 0,
    totalDisabled: 0,
  });

  useEffect(() => {
    if (!show) return;

    const totalProducts = products.length;
    const totalEnabled = products.filter(
      (p: any) => p?.formData?.enableReserve === "yes",
    ).length;
    const totalDisabled = products.filter(
      (p: any) => p?.formData?.enableReserve === "no",
    ).length;

    setTotals({
      totalProducts,
      totalEnabled,
      totalDisabled,
    });
  }, [show, products]);

  return (
    <AppModal
      show={show}
      callback={(a) => callback && callback(a)}
      className="tw:max-w-lg"
    >
      <AppModal.Title onClose={() => callback && callback({ action: "close" })}>
        Confirm Reserve Configuration
      </AppModal.Title>

      <AppModal.Content>
        {/* Summary Section */}
        <div className="tw:mb-4">
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:mb-3">
            Summary
          </h3>
          <div className="tw:grid tw:grid-cols-3 tw:gap-2">
            <div className="tw:bg-blue-50 tw:rounded-lg tw:p-3 tw:border tw:border-blue-100">
              <div className="tw:text-xs tw:text-gray-600 tw:uppercase tw:tracking-tight tw:font-medium">
                Total Products
              </div>
              <div className="tw:text-2xl tw:font-bold tw:text-blue-600 tw:mt-1">
                {totals.totalProducts}
              </div>
            </div>

            <div className="tw:bg-green-50 tw:rounded-lg tw:p-3 tw:border tw:border-green-100">
              <div className="tw:text-xs tw:text-gray-600 tw:uppercase tw:tracking-tight tw:font-medium">
                Reserve Enabled
              </div>
              <div className="tw:text-2xl tw:font-bold tw:text-green-600 tw:mt-1">
                {totals.totalEnabled}
              </div>
            </div>

            <div className="tw:bg-amber-50 tw:rounded-lg tw:p-3 tw:border tw:border-amber-100">
              <div className="tw:text-xs tw:text-gray-600 tw:uppercase tw:tracking-tight tw:font-medium">
                Reserve Disabled
              </div>
              <div className="tw:text-2xl tw:font-bold tw:text-amber-600 tw:mt-1">
                {totals.totalDisabled}
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3">
          <div className="tw:flex tw:gap-2">
            <Info className="tw:text-blue-600 tw:w-5 tw:h-5 tw:flex-shrink-0 tw:mt-0.5" />
            <div className="tw:text-sm tw:text-gray-700">
              Review and confirm to process reserve configuration.
            </div>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:justify-end tw:gap-2">
          <AppButton
            fill="outline"
            color="secondary"
            onClick={() => callback && callback({ action: "close" })}
          >
            Cancel
          </AppButton>
          <AppButton
            color="primary"
            onClick={() => callback && callback({ action: "submit" })}
          >
            Submit
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ConfirmModal;
