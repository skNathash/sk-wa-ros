import { BadgeCheck, Star } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import { type Order } from "../helper";

interface Props {
  orders: Order[];
  totalAmount: number;
  couponCode: string;
  couponDiscount: number;
  onRateOrder?: (order: Order) => void;
}

const paymentLabel = (method?: string) => {
  if (!method) return "Cash";
  if (method === "COD") return "Cash on Delivery";
  if (method === "PREPAID") return "Paid Online";
  if (method === "POSTPAID" || method === "PAYLATER") return "Pay Later";
  return method;
};

// A clean summary footer: the payable total on the right, with coupon and
// order-reference details beneath it.
// totalAmount (order.orderAmount) is already the after-coupon payable, so the
// pre-coupon figure is derived by adding the discount back.
const ThreadFooter = ({
  orders,
  totalAmount,
  couponCode,
  couponDiscount,
  onRateOrder,
}: Props) => {
  const hasCoupon = couponDiscount > 0;
  const beforeCoupon = totalAmount + couponDiscount;
  const methods = Array.from(
    new Set(orders.map((o) => o.paymentMethod).filter(Boolean) as string[]),
  );

  return (
    <div className="tw:border-t tw:border-gray-200 tw:bg-gray-50 tw:px-4 tw:py-3">
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-3">
        <span className="tw:text-sm tw:font-medium tw:text-gray-600">
          {hasCoupon ? "You paid" : "Total"}
        </span>
        <div className="tw:text-right">
          {hasCoupon && (
            <Amount
              value={beforeCoupon}
              className="tw:mr-2 tw:text-xs tw:text-gray-400 tw:line-through"
            />
          )}
          <Amount
            value={totalAmount}
            className="tw:text-lg tw:font-bold tw:text-gray-900"
          />
        </div>
      </div>

      {hasCoupon && (
        <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-green-700">
          <BadgeCheck size={13} strokeWidth={2.25} className="tw:shrink-0" />
          <span>
            Coupon {couponCode && <b>{couponCode}</b>} applied — saved{" "}
            <Amount value={couponDiscount} />
          </span>
        </div>
      )}

      <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:border-t tw:border-gray-200/70 tw:pt-2 tw:text-[11px] tw:text-gray-500">
        {methods.map((m) => (
          <span key={m} className="tw:font-medium tw:text-gray-600">
            {paymentLabel(m)}
          </span>
        ))}
        {methods.length > 0 && orders.length > 0 && <span>·</span>}
        {orders.map((o) => (
          <span key={o.orderId} className="tw:inline-flex tw:items-center">
            <AppLink
              href={`/dashboard/orders/view/${o.orderId}`}
              asLink
              className="tw:font-medium tw:text-primary"
            >
              #{o.orderRefNo || o.orderId}
            </AppLink>
          </span>
        ))}
      </div>

      {onRateOrder && (
        <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-gray-200/70 tw:pt-2">
          <span className="tw:text-[11px] tw:font-medium tw:text-gray-500">
            Rate your order
          </span>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            {orders.map((o) => (
              <button
                key={o.orderId}
                type="button"
                onClick={() => onRateOrder(o)}
                aria-label={`Rate order ${o.orderRefNo || o.orderId}`}
                className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary tw:px-3 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-white tw:shadow-sm tw:transition-colors hover:tw:bg-primary-dark"
              >
                <Star size={11} strokeWidth={2.25} className="tw:fill-current" />
                {orders.length > 1
                  ? `Rate #${o.orderRefNo || o.orderId}`
                  : "Rate this order"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadFooter;
