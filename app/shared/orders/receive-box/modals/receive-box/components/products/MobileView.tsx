import React from "react";
import { Package } from "lucide-react";
import { Input } from "~/components/ui/input";
import AppCard from "~/components/core/card/AppCard";
// Inputs and expanded controls removed for mobile view
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import ImgRender from "~/components/core/img/ImgRender";

interface MobileViewProps {
  products: any[];
  callback: (a: { action: string; data?: any }) => void;
  selectedProducts?: Set<string>;
}

const MobileView: React.FC<MobileViewProps> = ({
  products = [],
  callback,
  selectedProducts = new Set(),
}) => {
  // Expanded view removed for mobile — keep UI compact on mobile devices.

  const handleQuantityChange = (
    productId: string,
    value: string | number,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        _id: productId,
        field: "received",
        value,
        index,
      },
    });
  };

  const handleDamagedChange = (
    productId: string,
    value: string | number,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        _id: productId,
        field: "damaged",
        value,
        index,
      },
    });
  };

  // expansion behavior intentionally removed

  if (!products || products.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="tw:space-y-3">
      {products.map((product, index) => {
        const productKey = product.dealId;
        const orderedQty = Number(product.quantity) || 0;

        return (
          <AppCard
            key={product._id}
            bodyClassName="tw:p-0"
            className={`tw:border-2 ${
              selectedProducts.has(product._id)
                ? "tw:border-primary tw:bg-primary/5"
                : "tw:border-gray-200"
            }`}
          >
            {/* Product Header */}
            <div className="tw:p-4">
              <div className="tw:flex tw:items-center tw:justify-between">
                <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
                  <div className="tw:flex-shrink-0 tw:h-12 tw:w-12">
                    {product.image ? (
                      <ImgRender
                        className="tw:h-12 tw:w-12 tw:rounded-lg tw:object-cover"
                        src={product.image}
                        alt={product.name}
                      />
                    ) : (
                      <div className="tw:h-12 tw:w-12 tw:rounded-lg tw:bg-gray-200 tw:flex tw:items-center tw:justify-center">
                        <Package className="tw:w-6 tw:h-6 tw:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:truncate">
                      {product.dealName}
                    </div>
                    <div className="tw:mt-1 tw:text-xs tw:text-gray-500 tw:truncate">
                      ID: {product.dealRefId} · Ordered Qty: {orderedQty}
                    </div>
                    <div className="tw:mt-2">
                      <LocationsBlock locations={product.locations} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info (kept minimal for mobile) */}
              {/* Inline inputs (compact mobile) */}
              <div className="tw:mt-3 tw:text-sm tw:text-gray-600">
                <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                  <div>
                    <label className="tw:block tw:text-xs tw:text-gray-500">
                      Received
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={orderedQty}
                      value={product.receivedQty ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleQuantityChange(productKey, e.target.value, index)
                      }
                      className="tw:w-full tw:mt-1"
                    />
                  </div>
                  <div>
                    <label className="tw:block tw:text-xs tw:text-gray-500">
                      Damaged
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={orderedQty}
                      value={product.damagedQty ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleDamagedChange(productKey, e.target.value, index)
                      }
                      className="tw:w-full tw:mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded content and action buttons removed for mobile;
                keep cards compact and readonly in this view. */}
          </AppCard>
        );
      })}
    </div>
  );
};

export default MobileView;
