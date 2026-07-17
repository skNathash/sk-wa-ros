import { TicketPercent } from "lucide-react";
import Amount from "~/components/core/amount/Amount";

interface Props {
  code: string;
  discount: number;
  totalAmount: number;
}

// Compact applied-coupon block shown on the order-success seller card.
// Shows the before-coupon total, the coupon discount and the payable amount.
// totalAmount (order.orderAmount) is already the after-coupon payable, so
// the coupon must NOT be subtracted again; the before-coupon figure is derived
// by adding the discount back.
const CouponBlock = ({ code, discount, totalAmount }: Props) => {
  if (discount <= 0) return null;

  const payable = totalAmount;
  const beforeCoupon = totalAmount + discount;

  return (
    <div className="tw:mt-3 tw:bg-green-50 tw:border tw:border-green-200 tw:rounded-lg tw:overflow-hidden">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-2">
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:min-w-0">
          <TicketPercent
            size={16}
            className="tw:text-green-600 tw:shrink-0"
            strokeWidth={2.25}
          />
          <span className="tw:text-xs tw:font-semibold tw:text-green-700">
            Coupon applied
          </span>
          {code ? (
            <span className="tw:text-[11px] tw:font-semibold tw:text-green-800 tw:bg-white tw:border tw:border-green-300 tw:rounded tw:px-1.5 tw:py-0.5 tw:truncate">
              {code}
            </span>
          ) : null}
        </div>
        <span className="tw:text-sm tw:font-semibold tw:text-green-700 tw:shrink-0">
          You saved <Amount value={discount} decimalPlaces={2} />
        </span>
      </div>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-2 tw:bg-white tw:border-t tw:border-green-200">
        <div className="tw:min-w-0">
          <div className="tw:text-xs tw:font-semibold tw:text-gray-700">
            You pay after coupon
          </div>
          <div className="tw:text-xs tw:font-medium tw:text-red-500 tw:line-through">
            <Amount value={beforeCoupon} decimalPlaces={2} />
          </div>
        </div>
        <Amount
          value={payable}
          decimalPlaces={2}
          className="tw:text-xl tw:font-extrabold tw:text-gray-900 tw:shrink-0"
        />
      </div>
    </div>
  );
};

export default CouponBlock;