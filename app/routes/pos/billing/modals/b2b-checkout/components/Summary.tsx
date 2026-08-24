import React from "react";
import { Edit3 } from "lucide-react";
import Amount from "~/components/core/amount/Amount";

type SummaryProps = {
  summary?: {
    subtotal?: number;
    shippingFee?: number;
    couponDiscount?: number;
    finalPrice?: number;
    orderAmount?: number;
  };
  totalItems?: number;
  /** Cart lines. Optional: the checkout page passes them so the panel can list
      what is being paid for; the modal, which already lists them above the
      summary, leaves this out. */
  items?: any[];
  /** Back to the cart. Optional, for the same reason as `items`. */
  onEditCart?: () => void;
};

const Summary: React.FC<SummaryProps> = ({
  summary = {},
  totalItems = 0,
  items,
  onEditCart,
}) => {
  const {
    subtotal = 0,
    shippingFee = 0,
    couponDiscount = 0,
    finalPrice = 0,
  } = summary;
  const orderAmount = summary.orderAmount ?? Math.round(finalPrice);
  const roundOff = orderAmount - finalPrice;

  return (
    <div className="app-osum tw:border tw:rounded tw:p-4 tw:bg-white">
      <div className="app-osum-head tw:flex tw:items-center tw:justify-between tw:mb-2">
        <h3 className="app-osum-title tw:text-lg tw:font-semibold">
          Payment Summary
          <span className="app-osum-count">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </h3>
        {onEditCart && (
          <button
            type="button"
            onClick={onEditCart}
            className="app-osum-edit tw:text-primary tw:text-xs tw:flex tw:items-center tw:gap-1 tw:cursor-pointer"
          >
            <Edit3 size={12} /> Edit cart
          </button>
        )}
      </div>

      <div className="app-osum-body tw:text-sm tw:text-gray-600">
        {!!items?.length && (
          <div className="app-osum-items tw:max-h-48 tw:overflow-auto tw:mb-2">
            {items.map((item: any, idx: number) => {
              const name = item?.deal?.name || item?.name || "Item";
              const qty = Number(item?.quantity) || 0;
              const unitPrice = Number(item?.purchasePrice) || 0;
              return (
                <div
                  key={item?.deal?.id || idx}
                  className="app-osum-item tw:flex tw:justify-between tw:text-xs tw:py-1"
                >
                  <span className="app-osum-item-name tw:truncate tw:pr-2 tw:text-gray-700">
                    {name}{" "}
                    <span className="app-osum-item-qty tw:text-gray-400">
                      × {qty}
                    </span>
                  </span>
                  <span className="app-osum-item-amt tw:text-gray-800">
                    <Amount value={unitPrice * qty} decimalPlaces={2} />
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="app-osum-rows">
          <div className="app-osum-row tw:flex tw:justify-between tw:mb-2">
            <span>Subtotal</span>
            <Amount value={subtotal} decimalPlaces={2} />
          </div>

          {/* <div className="tw:flex tw:justify-between tw:mb-2">
            <span>Shipping Fee</span>
            <Amount value={shippingFee} decimalPlaces={2} />
          </div> */}

          {couponDiscount > 0 && (
            <div className="app-osum-row tw:flex tw:justify-between tw:mb-2">
              <span>Coupon Discount</span>
              <span className="tw:text-red-600">
                -<Amount value={couponDiscount} decimalPlaces={2} />
              </span>
            </div>
          )}

          {roundOff !== 0 && (
            <div className="app-osum-row tw:flex tw:justify-between tw:mb-2">
              <span>Round off</span>
              <span className="tw:text-gray-700">
                {roundOff >= 0 ? "+" : "-"}
                <Amount value={Math.abs(roundOff)} decimalPlaces={2} />
              </span>
            </div>
          )}
        </div>

        <div className="app-osum-total tw:mt-4 tw:border-t tw:border-gray-200 tw:pt-3">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div>
              <div className="app-osum-total-label tw:text-sm">Grand Total</div>
              <div className="app-osum-total-sub tw:text-xs tw:text-gray-500">
                {totalItems} items
              </div>
            </div>
            <div className="app-osum-total-value tw:text-green-600 tw:text-lg tw:font-bold">
              <Amount value={orderAmount} decimalPlaces={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
