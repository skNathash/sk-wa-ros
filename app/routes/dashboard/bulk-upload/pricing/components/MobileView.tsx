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
    <div className="tw:space-y-4 tw:px-4">
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
                {product.isDuplicate && (
                  <AppBadge variant="warning" className="tw:text-xs">
                    Duplicate Barcode
                  </AppBadge>
                )}
                <div className="tw:text-xs tw:text-gray-500">
                  {product.dealRef}
                </div>
              </div>
              {product.barcode && (
                <div className="tw:mt-1">
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-amber-800 tw:bg-amber-100 tw:border tw:border-amber-200 tw:rounded tw:px-1.5 tw:py-0.5">
                    Barcode: {product.barcode}
                  </span>
                </div>
              )}
              {product.status === "INVALID" && product.validationMessage && (
                <div className="tw:text-xs tw:text-red-600 tw:mt-1">
                  {product.validationMessage}
                </div>
              )}
            </div>
          </div>

          {/* Product Information Grid */}
          <div className="tw:space-y-3 tw:mb-4">
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">MRP</span>
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                <Amount value={product.mrp} decimalPlaces={2} />
              </span>
            </div>

            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">Selling Price</span>
              <span className="tw:text-sm tw:font-medium tw:text-gray-900">
                <Amount value={product.price} decimalPlaces={2} />
              </span>
            </div>

            <div className="tw:flex tw:justify-between tw:items-start">
              <span className="tw:text-sm tw:text-gray-700">Discount</span>
              <div className="tw:flex tw:flex-col tw:items-end">
                <span className="tw:text-sm tw:font-medium tw:text-blue-600">
                  {product.isPercentage ? (
                    `${product.discount}%`
                  ) : (
                    <Amount value={product.fixedPrice} decimalPlaces={2} />
                  )}
                </span>
                <span className="tw:text-xs tw:text-gray-500">
                  {product.discountLabel}
                </span>
              </div>
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
