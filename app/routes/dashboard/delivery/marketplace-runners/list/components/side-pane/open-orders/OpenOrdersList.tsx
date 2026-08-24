import type { OpenOrder } from "./helper";

interface OpenOrdersListProps {
  orders: OpenOrder[];
  /** Fired with the tapped order so the pane decides what a tap opens. */
  onSelect: (order: OpenOrder) => void;
  className?: string;
}

/**
 * The store's own invoiced orders still without a runner — what the runners
 * above are being picked for.
 */
export default function OpenOrdersList({
  orders,
  onSelect,
  className,
}: OpenOrdersListProps) {
  return (
    <div className={className}>
      <p className="app-pane-label">
        My open orders needing runners
      </p>

      {orders.length === 0 ? (
        <p className="tw:px-1 tw:py-3 tw:text-xs tw:text-slate-400">
          Every order has a runner on it.
        </p>
      ) : (
        <div className="tw:mt-1.5 tw:flex tw:flex-col tw:gap-2">
          {orders.map((order) => (
            <button
              key={order.orderId}
              type="button"
              onClick={() => onSelect(order)}
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:bg-emerald-50 tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-emerald-100"
            >
              <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-white tw:text-xs tw:font-bold tw:tabular-nums tw:text-emerald-700">
                {order._refLbl}
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <h3 className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                  {order.customerInfo?.name}
                </h3>
                <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
                  {order._dropLbl}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
