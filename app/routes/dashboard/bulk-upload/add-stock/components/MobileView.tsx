import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import { Package, Trash2 } from "lucide-react";

interface MobileViewProps {
  products: any[];
  callback: (a: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ products, callback }) => {
  const { t } = useTranslation(["common"]);

  if (!products || products.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:px-4">
        <div className="tw:text-gray-500">No products to display</div>
      </div>
    );
  }

  return (
    <div className="tw:space-y-3 tw:px-3">
      {products.map((product, index) => (
        <div
          key={index}
          className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200 tw:shadow-sm"
        >
          {/* Product Header Section */}
          <div className="tw:flex tw:items-start tw:mb-4">
            {/* Product Icon */}
            <div className="tw:w-12 tw:h-12 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-3 tw:flex-shrink-0">
              <Package className="tw:w-6 tw:h-6 tw:text-gray-400" />
            </div>

            {/* Product Details */}
            <div className="tw:flex-1 tw:min-w-0">
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${product.dealId}`}
                className="tw:font-semibold tw:text-base tw:text-gray-900 tw:mb-1 tw:line-clamp-2 tw:block"
              >
                {product.dealName}
              </AppLink>

              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                <AppBadge
                  variant={product.status === "VALID" ? "success" : "danger"}
                  className="tw:text-xs"
                >
                  {product.status}
                </AppBadge>
                <div className="tw:text-xs tw:text-gray-500">
                  {product.dealRefId}
                </div>
              </div>
            </div>
          </div>

          {/* Product Information Grid */}
          <div className="tw:space-y-3 tw:mb-4">
            {/* MRP */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">MRP</span>
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                <Amount value={product.mrp} decimalPlaces={2} />
              </span>
            </div>

            {/* Purchase Price */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">
                Purchase Price
              </span>
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                <Amount value={product.purchasePrice} decimalPlaces={2} />
              </span>
            </div>

            {/* Current Stock */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">Current Stock</span>
              <span className="tw:text-sm tw:font-medium tw:text-orange-600">
                {product.oldQuantity}
              </span>
            </div>

            {/* New Stock */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">New Stock</span>
              <span className="tw:text-sm tw:font-semibold tw:text-green-800">
                {product.qty}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="tw:flex tw:justify-end">
            <AppButton
              color="danger"
              size="small"
              fill="outline"
              onClick={() => {
                callback({ action: "remove", data: { index } });
              }}
              className="tw:flex tw:items-center tw:gap-1"
            >
              <Trash2 size={14} />
              Remove
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
