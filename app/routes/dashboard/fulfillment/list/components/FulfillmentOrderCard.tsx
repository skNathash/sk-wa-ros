import { Link } from "react-router";
import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import type { FulfillmentOrder } from "../helper";

interface FulfillmentOrderCardProps {
  order: FulfillmentOrder;
  /** How far this order has travelled down the pipeline, 0 → 1. */
  progress: number;
  /** Bar colour for the stage the card sits in. */
  progressClass: string;
}

/**
 * One order tile on the fulfilment board: reference and order type on top, the
 * customer with its item / picker line under it, a pipeline progress bar, then
 * the value and the age of the order. The whole tile opens the order, which is
 * the action the stage column used to carry as a button.
 */
const FulfillmentOrderCard = ({
  order,
  progress,
  progressClass,
}: FulfillmentOrderCardProps) => {
  return (
    <Link
      to={`/dashboard/orders/process/${order.orderId}`}
      className="tw:block tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:transition tw:hover:-translate-y-0.5"
    >
      <div className="tw:mb-2 tw:flex tw:items-start tw:justify-between tw:gap-2">
        <span className="tw:truncate tw:text-xs tw:font-semibold tw:text-violet-600">
          {order.refLabel}
        </span>
        <span
          className={clsx(
            "tw:shrink-0 tw:rounded-md tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold",
            order.isB2B
              ? "tw:bg-amber-100 tw:text-amber-700"
              : "tw:bg-emerald-100 tw:text-emerald-700",
          )}
        >
          {order.orderType}
        </span>
      </div>

      <p className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
        {order.customerName}
      </p>
      <p className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-slate-400">
        {order.metaLabel}
      </p>

      {order.shipmentLabel && (
        <p className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-slate-400">
          {order.shipmentLabel}
        </p>
      )}

      <div className="tw:mt-2 tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
        <span
          className={clsx("tw:block tw:h-full tw:rounded-full", progressClass)}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="tw:mt-2 tw:flex tw:items-end tw:justify-between tw:gap-2">
        <span className="tw:text-sm tw:font-bold tw:text-slate-900">
          <Amount value={order.amount} decimalPlaces={0} />
        </span>
        <span className="tw:min-w-0 tw:text-right">
          <span className="tw:block tw:truncate tw:text-[11px] tw:text-slate-400">
            {order.ageLabel}
          </span>
          <span className="tw:block tw:truncate tw:text-[10px] tw:text-slate-400">
            {order.dateLabel}
          </span>
        </span>
      </div>
    </Link>
  );
};

export default FulfillmentOrderCard;
