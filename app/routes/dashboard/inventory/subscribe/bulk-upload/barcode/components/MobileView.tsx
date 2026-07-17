import React from "react";
import { Barcode, Trash2, CheckCircle, XCircle } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import type { BarcodeDealType } from "../helper";
import AppBadge from "~/components/core/badge/AppBadge";

interface MobileViewProps {
  products: BarcodeDealType[];
  // onRemove receives index of the item in the products array
  onRemove?: (index: number) => void;
  // onSubscribe now receives index of the item in the products array
  onSubscribe?: (index: number) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  products,
  onRemove,
  onSubscribe,
}) => {
  const handleRemove = (index: number) => {
    if (onRemove) {
      onRemove(index);
    }
  };

  const handleSubscribe = (index: number) => {
    if (onSubscribe) {
      onSubscribe(index);
    }
  };

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {products.length > 0 ? (
        products.map((product, index) => (
          <div
            key={product.dealId || index}
            className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-white tw:flex tw:flex-col tw:h-full"
          >
            {/* Barcode with icon */}
            <div className="tw:text-xs tw:text-gray-800 tw:font-mono tw:flex tw:items-center tw:gap-2 tw:mb-3">
              <Barcode size={14} />
              {product.status === "VALID" ? (
                <CheckCircle size={16} className="tw:text-green-600" />
              ) : (
                <XCircle size={16} className="tw:text-red-600" />
              )}
              <span className="tw:truncate">{product.barcode?.[0]}</span>
            </div>

            {product.status === "INVALID" && product.error ? (
              <div className="tw:text-xs tw:text-red-600 tw:line-clamp-2">
                {product.error}
              </div>
            ) : null}

            {/* Product Name */}
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-2 tw:line-clamp-2">
              {product.dealName}
            </h3>

            {product?.brand?.brandName || product?.category?.categoryName ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                {product?.brand?.brandName ? (
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                    {product.brand.brandName}
                  </div>
                ) : null}

                <span>•</span>

                {product?.category?.categoryName ? (
                  <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                    {product.category.categoryName}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* ID and MRP grid */}
            <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mb-3 tw:flex-1">
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">ID</div>
                <div className="tw:font-medium tw:text-xs">
                  {product.refId || "N/A"}
                </div>
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">MRP</div>
                <div className="tw:text-xs">
                  <Amount value={Number(product.mrp)} decimalPlaces={2} />
                </div>
              </div>
            </div>

            {/* Status and Action buttons with flex layout */}
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
              <div className="tw:flex-1">
                <AppBadge variant={product.statusColor}>
                  {product.status === "INVALID" ? "Not Found" : product.status}
                </AppBadge>
              </div>
              {!product?.subscribeError ? (
                <div className="tw:flex tw:items-center tw:gap-1">
                  {product.isSubscribed && (
                    <div className="tw:text-xs tw:text-gray-500">
                      Already Subscribed
                    </div>
                  )}

                  {product.status === "VALID" &&
                    !product.isInCart &&
                    !product.isSubscribed && (
                      <AppButton
                        size="small"
                        fill="solid"
                        color="success"
                        onClick={() => handleSubscribe(index)}
                        className="tw:px-2 tw:py-1 tw:text-xs"
                      >
                        Subscribe
                      </AppButton>
                    )}

                  {product.isInCart && (
                    <AppButton size="small" fill="outline" color="success">
                      <CheckCircle size={14} />
                      In Cart
                    </AppButton>
                  )}

                  {!product.isInCart && (
                    <AppButton
                      size="small"
                      fill="outline"
                      color="danger"
                      onClick={() => handleRemove(index)}
                      className="tw:px-2 tw:py-1"
                    >
                      <Trash2 size={12} />
                    </AppButton>
                  )}
                </div>
              ) : (
                <div className="tw:text-xs tw:text-red-500 tw:text-right">
                  {product.subscribeError}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="tw:col-span-full">
          <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-8 tw:bg-white tw:text-center tw:text-gray-500">
            No products found
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileView;
