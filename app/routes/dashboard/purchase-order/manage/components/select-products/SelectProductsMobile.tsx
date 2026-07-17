import { Info, Percent } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppPopover from "~/components/core/popover/AppPopover";
import { Input } from "~/components/ui/input";
import RecentPurchasePopover from "~/shared/vendor/popovers/recent-purchase/RecentPurchasePopover";

interface SelectProductsMobileProps {
  data: Record<string, any>[];
  loading?: boolean;
  callback: ({ action, data }: { action: string; data: any }) => void;
}

const SelectProductsMobile = ({
  data,
  loading = false,
  callback,
}: SelectProductsMobileProps) => {
  const handlePurchasePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        purchasePrice: e.target.value,
        key: "purchasePrice",
      },
    });
  };

  const handleDiscountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        discount: e.target.value,
        key: "discount",
      },
    });
  };

  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        quantity: e.target.value,
        key: "quantity",
      },
    });
  };

  if (loading) {
    return (
      <div className="tw:space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-32 tw:rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tw:space-y-4">
      {data.map((item, index) => (
        <div
          key={item.dealId}
          className={`tw:p-4  tw:rounded-lg tw:border tw:border-gray-200 ${
            item.quantity && item.quantity > 0
              ? "tw:bg-green-50 tw:border-green-300 tw:border-2"
              : "tw:bg-white"
          }`}
        >
          {/* First block: Flex layout for img, name and id */}
          <div className="tw:flex tw:gap-3 tw:mb-2">
            <div className="tw:flex-shrink-0">
              <div className="tw:w-16 tw:h-16 tw:bg-gray-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="tw:w-full tw:h-full tw:object-cover tw:rounded-lg"
                  />
                ) : (
                  <div className="tw:text-gray-400 tw:text-xs tw:text-center">
                    No Image
                  </div>
                )}
              </div>
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:font-semibold tw:text-gray-900 tw:text-base tw:mb-1">
                {item.name}
              </div>
              <div className="tw:text-sm tw:text-gray-500">
                ID: {item.dealId}
              </div>
            </div>
          </div>

          {/* Second block: 3-column grid for mrp, stock, sales with icons */}
          <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:mb-2">
            <div className="tw:flex tw:items-center tw:gap-2 tw:p-3">
              {/* <IndianRupee size={16} className="tw:text-gray-500" /> */}
              <KeyValue label="MRP" size="sm" className="tw:flex-1">
                <Amount
                  value={item.mrp}
                  decimalPlaces={2}
                  className="tw:font-medium"
                />
              </KeyValue>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2 tw:p-3">
              {/* <Package size={16} className="tw:text-gray-500" /> */}
              <KeyValue label="Stock" size="sm" className="tw:flex-1">
                <span className="tw:font-medium">{item.stock ?? 0}</span>
              </KeyValue>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2 tw:p-3">
              {/* <TrendingUp size={16} className="tw:text-gray-500" /> */}
              <KeyValue label="Sales" size="sm" className="tw:flex-1">
                <span className="tw:font-medium">{item.sales ?? 0}</span>
              </KeyValue>
            </div>
          </div>

          {/* Third block: 2-column grid for purchase price and discount */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:mb-4">
            <div>
              <KeyValue
                label={
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <span>Purchase Price</span>
                    <AppPopover
                      triggerContent={
                        <Info size={16} className="tw:text-blue-400 tw:-mt-1" />
                      }
                    >
                      <RecentPurchasePopover productId={item._id} limit={3} />
                    </AppPopover>
                  </div>
                }
                size="sm"
              >
                <Input
                  type="number"
                  value={item.purchasePrice}
                  onChange={(e) => handlePurchasePriceChange(e, index)}
                  className="tw:bg-white tw:border-gray-300"
                  placeholder="Price"
                />
              </KeyValue>
            </div>
            <div>
              <KeyValue label="Discount (%)" size="sm">
                <div className="tw:relative">
                  <Input
                    type="number"
                    value={item.discount}
                    onChange={(e) => handleDiscountChange(e, index)}
                    className="tw:bg-white tw:border-gray-300 tw:pr-8"
                    placeholder="0"
                  />
                  <div className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2">
                    <Percent size={14} className="tw:text-gray-400" />
                  </div>
                </div>
              </KeyValue>
            </div>
          </div>

          {/* Fourth block: Quantity with conditional styling */}
          <div className="tw:mb-4">
            <KeyValue label="Quantity" size="sm">
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(e, index)}
                className="tw:bg-white tw:border-gray-300"
                placeholder="Qty"
              />
            </KeyValue>
          </div>

          {/* Fifth block: Total amount */}
          {item.total > 0 && (
            <div className="tw:border-t tw:border-gray-200 tw:pt-2">
              <div className="tw:flex tw:justify-between tw:items-center">
                <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                  Total
                </span>
                <Amount
                  value={item.total}
                  decimalPlaces={2}
                  className="tw:text-lg tw:font-semibold tw:text-blue-600"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SelectProductsMobile;
