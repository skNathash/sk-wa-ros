import React from "react";
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
};

const Summary: React.FC<SummaryProps> = ({ summary = {}, totalItems = 0 }) => {
  const {
    subtotal = 0,
    shippingFee = 0,
    couponDiscount = 0,
    finalPrice = 0,
  } = summary;
  const orderAmount = summary.orderAmount ?? Math.round(finalPrice);
  const roundOff = orderAmount - finalPrice;

  return (
    <div className="tw:border tw:rounded tw:p-4 tw:bg-white">
      <h3 className="tw:text-lg tw:font-semibold tw:mb-2">Payment Summary</h3>

      <div className="tw:text-sm tw:text-gray-600">
        <div className="tw:flex tw:justify-between tw:mb-2">
          <span>Subtotal</span>
          <Amount value={subtotal} decimalPlaces={2} />
        </div>

        {/* <div className="tw:flex tw:justify-between tw:mb-2">
          <span>Shipping Fee</span>
          <Amount value={shippingFee} decimalPlaces={2} />
        </div> */}

        {couponDiscount > 0 && (
          <div className="tw:flex tw:justify-between tw:mb-2">
            <span>Coupon Discount</span>
            <span className="tw:text-red-600">
              -<Amount value={couponDiscount} decimalPlaces={2} />
            </span>
          </div>
        )}

        {roundOff !== 0 && (
          <div className="tw:flex tw:justify-between tw:mb-2">
            <span>Round off</span>
            <span className="tw:text-gray-700">
              {roundOff >= 0 ? "+" : "-"}
              <Amount value={Math.abs(roundOff)} decimalPlaces={2} />
            </span>
          </div>
        )}

        <div className="tw:mt-4 tw:border-t tw:border-gray-200 tw:pt-3">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div>
              <div className="tw:text-sm">Grand Total</div>
              <div className="tw:text-xs tw:text-gray-500">
                {totalItems} items
              </div>
            </div>
            <div className="tw:text-green-600 tw:text-lg tw:font-bold">
              <Amount value={orderAmount} decimalPlaces={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
