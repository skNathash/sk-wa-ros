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
    <div className="tw:border tw:border-border tw:rounded-xl tw:p-4 tw:bg-card">
      <h3 className="wa-section-label tw:text-foreground tw:mb-3">
        Payment Summary
      </h3>

      <div className="tw:text-sm tw:text-muted-foreground">
        <div className="tw:flex tw:justify-between tw:mb-2">
          <span>Subtotal</span>
          <span className="wa-mono">
            <Amount value={subtotal} decimalPlaces={2} />
          </span>
        </div>

        {/* <div className="tw:flex tw:justify-between tw:mb-2">
          <span>Shipping Fee</span>
          <Amount value={shippingFee} decimalPlaces={2} />
        </div> */}

        {couponDiscount > 0 && (
          <div className="tw:flex tw:justify-between tw:mb-2">
            <span>Coupon Discount</span>
            <span className="wa-mono tw:text-destructive">
              -<Amount value={couponDiscount} decimalPlaces={2} />
            </span>
          </div>
        )}

        {roundOff !== 0 && (
          <div className="tw:flex tw:justify-between tw:mb-2">
            <span>Round off</span>
            <span className="wa-mono tw:text-foreground">
              {roundOff >= 0 ? "+" : "-"}
              <Amount value={Math.abs(roundOff)} decimalPlaces={2} />
            </span>
          </div>
        )}

        <div className="tw:mt-4 tw:border-t tw:border-border tw:pt-3">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div>
              <div className="tw:text-sm tw:text-foreground tw:font-semibold">
                Grand Total
              </div>
              <div className="tw:text-xs tw:text-muted-foreground">
                {totalItems} items
              </div>
            </div>
            <div className="wa-amount tw:text-primary tw:text-lg tw:font-bold">
              <Amount value={orderAmount} decimalPlaces={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
