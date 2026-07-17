import React, { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import SellerCatalogService from "~/services/SellerCatalogService";

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  success: {
    bg: "tw:bg-green-50",
    border: "tw:border-green-100",
    text: "tw:text-green-600",
  },
  warning: {
    bg: "tw:bg-amber-50",
    border: "tw:border-amber-100",
    text: "tw:text-amber-600",
  },
  danger: {
    bg: "tw:bg-red-50",
    border: "tw:border-red-100",
    text: "tw:text-red-600",
  },
  light: {
    bg: "tw:bg-purple-50",
    border: "tw:border-purple-100",
    text: "tw:text-purple-600",
  },
  primary: {
    bg: "tw:bg-blue-50",
    border: "tw:border-blue-100",
    text: "tw:text-blue-600",
  },
};

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
  const totalProducts = products.length;

  const typeCounts = useMemo(() => {
    if (!show) return [];
    const sellingTypes = SellerCatalogService.getSellingTypes();
    const countMap: Record<
      string,
      { label: string; count: number; color: string }
    > = {};

    products.forEach((p: any) => {
      const packageType = p?.formData?.packageType;
      if (!packageType) return;

      if (!countMap[packageType]) {
        const match = sellingTypes.find((t) => t.apiValue === packageType);
        countMap[packageType] = {
          label: match?.label || packageType,
          count: 0,
          color: match?.color || "primary",
        };
      }
      countMap[packageType].count++;
    });

    return Object.entries(countMap).map(([key, val]) => ({ key, ...val }));
  }, [show, products]);

  return (
    <AppModal
      show={show}
      callback={(a) => callback && callback(a)}
      className="tw:max-w-lg"
    >
      <AppModal.Title onClose={() => callback && callback({ action: "close" })}>
        Confirm Sell In Config
      </AppModal.Title>

      <AppModal.Content>
        {/* Summary Section */}
        <div className="tw:mb-4">
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:mb-3">
            Summary
          </h3>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <div className="tw:bg-blue-50 tw:rounded-lg tw:p-3 tw:border tw:border-blue-100">
              <div className="tw:text-xs tw:text-gray-600 tw:uppercase tw:tracking-tight tw:font-medium">
                Total Products
              </div>
              <div className="tw:text-2xl tw:font-bold tw:text-blue-600 tw:mt-1">
                {totalProducts}
              </div>
            </div>

            {typeCounts.map((type) => {
              const colors = colorMap[type.color] || colorMap.primary;
              return (
                <div
                  key={type.key}
                  className={`${colors.bg} tw:rounded-lg tw:p-3 tw:border ${colors.border}`}
                >
                  <div className="tw:text-xs tw:text-gray-600 tw:uppercase tw:tracking-tight tw:font-medium">
                    {type.label}
                  </div>
                  <div
                    className={`tw:text-2xl tw:font-bold ${colors.text} tw:mt-1`}
                  >
                    {type.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Note */}
        <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded-lg tw:p-3">
          <div className="tw:flex tw:gap-2">
            <Info className="tw:text-blue-600 tw:w-5 tw:h-5 tw:shrink-0" />
            <div className="tw:text-xs tw:text-gray-700">
              Review and confirm to process sell in config.
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
