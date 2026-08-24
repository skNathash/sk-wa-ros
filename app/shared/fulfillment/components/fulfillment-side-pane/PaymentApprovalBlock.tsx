import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import useAppNav from "~/hooks/useAppNav";
import {
  PAYMENT_APPROVAL_FROM_PARAM,
  PAYMENT_APPROVAL_ROW_LIMIT,
  type PaymentApprovalOrder,
} from "./paymentApprovalHelper";

export type PaymentApprovalTone = "amber" | "green";

const TONES: Record<PaymentApprovalTone, { ref: string; amount: string }> = {
  amber: {
    ref: "tw:text-amber-800",
    amount: "tw:text-amber-700",
  },
  green: {
    ref: "tw:text-emerald-800",
    amount: "tw:text-emerald-700",
  },
};

interface PaymentApprovalBlockProps {
  /** Block heading, e.g. "Payment Pending". */
  label: string;
  tone: PaymentApprovalTone;
  data: PaymentApprovalOrder[];
  loading?: boolean;
  /** Shown in place of the rows when nothing came back. */
  emptyText: string;
  /** What the small line under the value says. */
  secondary: "paidVia" | "date";
  className?: string;
}

/**
 * Shared shell behind the two payment-approval pane blocks — the pane label
 * with a count, then one tappable row per order (ref + customer on the left,
 * value + when / how it was paid on the right) divided by hairlines and bled
 * out of the pane gutter with `app-bleed-x`, so the rows run edge to edge.
 * Tapping a row opens that order.
 */
const PaymentApprovalBlock = ({
  label,
  tone,
  data,
  loading = false,
  emptyText,
  secondary,
  className,
}: PaymentApprovalBlockProps) => {
  const appNav = useAppNav();
  const toneClasses = TONES[tone];

  return (
    <div className={className}>
      <div className="tw:flex tw:items-baseline tw:justify-between tw:gap-2">
        <p className="app-pane-label">
          {label}
        </p>
        {!loading && data.length > 0 && (
          <span className="app-amount tw:px-1 tw:text-xs tw:font-bold tw:text-slate-400">
            {data.length}
            {data.length >= PAYMENT_APPROVAL_ROW_LIMIT ? "+" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="app-bleed-x tw:mt-1.5 tw:divide-y tw:divide-slate-100 tw:border-b tw:border-slate-100">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={`payment-approval-skeleton-${idx}`} className="tw:px-4 tw:py-3">
              <div className="skeleton-loader tw:h-8 tw:rounded" />
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="tw:mt-1.5 tw:px-1 tw:py-4 tw:text-xs tw:text-slate-400">
          {emptyText}
        </p>
      ) : (
        <div className="app-bleed-x tw:mt-1.5 tw:divide-y tw:divide-slate-100 tw:border-b tw:border-slate-100">
          {data.map((order) => (
            <button
              key={order.orderId}
              type="button"
              onClick={() =>
                appNav.to(`/dashboard/orders/view/${order.orderId}`, {
                  from: PAYMENT_APPROVAL_FROM_PARAM,
                })
              }
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
            >
              <span className="tw:min-w-0">
                <span
                  className={clsx(
                    "tw:block tw:truncate tw:text-xs tw:font-bold",
                    toneClasses.ref,
                  )}
                >
                  {order.orderRefNo}
                </span>
                <span className="tw:block tw:truncate tw:text-xs tw:text-slate-500">
                  {order.customerName}
                  {order.customerMobile ? ` · ${order.customerMobile}` : ""}
                </span>
              </span>

              <span className="tw:shrink-0 tw:text-right">
                <Amount
                  value={order.amount}
                  decimalPlaces={0}
                  className={clsx(
                    "tw:block tw:text-sm tw:font-bold",
                    toneClasses.amount,
                  )}
                />
                <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[10px] tw:text-slate-400">
                  {secondary === "paidVia" ? (
                    order.paidVia
                  ) : (
                    <DateFormat value={order.date} formatStr="dd MMM, hh:mm a" />
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentApprovalBlock;
