import { Package, Eye } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";

interface Props {
  products: any[];
}

const MobileView: React.FC<Props> = ({ products = [] }) => {
  if (!products?.length) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-4">
      {products.map((product, index) => (
        <div
          key={product._id || product.dealId || index}
          className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
        >
          {/* Product Header Section */}
          <div className="tw:flex tw:items-start tw:mb-4">
            {/* Product Image */}
            <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:mr-4 tw:overflow-hidden tw:flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <ImgRender
                  assetId={product.images[0]}
                  className="tw:w-full tw:h-full tw:object-cover tw:rounded"
                  alt={product.dealName || product.productName}
                />
              ) : (
                <Package className="tw:w-8 tw:h-8 tw:text-gray-400" />
              )}
            </div>

            {/* Product Text Details */}
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:font-semibold tw:text-base tw:text-gray-900 tw:mb-2 tw:line-clamp-2">
                <AppLink
                  asLink
                  href={`/dashboard/inventory/products/view/${product.dealId}`}
                >
                  {product.dealName || product.productName}
                </AppLink>
              </div>
              <div className="tw:text-sm tw:text-gray-600 tw:mb-1">
                {product.productId || product.dealRefId}
              </div>
              {product.status && (
                <AppBadge
                  variant={product._statusColor || "primary"}
                  className="tw:text-xs"
                >
                  {product._statusLabel || product.status}
                </AppBadge>
              )}
            </div>
          </div>

          {/* Product Details Section */}
          <div className="tw:space-y-3 tw:mb-4">
            {/* Ordered Quantity */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">Ordered</span>
              <span className="tw:text-sm tw:text-blue-600 tw:font-medium">
                {product.packages?.quantity || product.quantity || 0}
              </span>
            </div>

            {/* Received Quantity */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">Received</span>
              <span className="tw:text-sm tw:text-green-600 tw:font-medium">
                {product.receivedQuantity || 0}
              </span>
            </div>

            {/* Damaged Quantity */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-700">Damaged</span>
              <span className="tw:text-sm tw:text-red-600 tw:font-medium">
                {product.damagedQuantity || 0}
              </span>
            </div>

            {/* Price */}
            {product.purchasePrice && (
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:text-gray-700">Price</span>
                <span className="tw:text-sm tw:text-gray-900 tw:font-medium">
                  ₹{product.purchasePrice.toFixed(2)}
                </span>
              </div>
            )}

            {/* MRP */}
            {product.mrp && (
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:text-gray-700">MRP</span>
                <span className="tw:text-sm tw:text-gray-900 tw:font-medium">
                  ₹{product.mrp.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total Value */}
            {product._totalValue && (
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:text-gray-700">Total Value</span>
                <span className="tw:text-sm tw:text-gray-900 tw:font-medium">
                  ₹{product._totalValue.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Action Button Section */}
          <div className="tw:pt-3 tw:border-t tw:border-gray-100">
            <div className="tw:flex tw:gap-2">
              <AppButton
                color="primary"
                fill="outline"
                size="small"
                className="tw:flex-1"
                onClick={() => {
                  window.open(
                    `/dashboard/inventory/products/view/${product.dealId}`,
                    "_blank"
                  );
                }}
              >
                <Eye size={14} />
                View Product
              </AppButton>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
