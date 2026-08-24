import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import type { AssignRunnerOrder } from "../../helper";

interface OrderCardProps {
  order: AssignRunnerOrder;
}

/**
 * The drop being assigned — just enough of the order to pick a runner for it:
 * who it goes to, where, how big it is and what has to be collected.
 */
export default function OrderCard({ order }: OrderCardProps) {
  return (
    <div className="app-bleed-x tw:-mt-4 tw:mb-4 tw:flex tw:items-start tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:md:mt-0">
      <InitialsAvatar
        initials={order._initials}
        name={order.customerInfo?.name}
        size={56}
        className="tw:rounded-xl tw:text-xl"
      />

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <h3 className="tw:truncate tw:text-base tw:font-bold tw:text-slate-900">
            {order.customerInfo?.name}
          </h3>
          <AppBadge variant={order._typeColor} size="xs">
            {order.orderType}
          </AppBadge>
          <AppBadge variant={order._statusColor} size="xs">
            {order._statusLbl}
          </AppBadge>
        </div>

        <p className="tw:mt-1 tw:text-[13px] tw:text-slate-500">
          {order._meta}
          {order.invoices?.[0]?.invoicedDate && (
            <>
              {" · invoiced "}
              <DateFormat
                value={order.invoices[0].invoicedDate}
                formatStr="h:mm a"
              />
            </>
          )}
        </p>
      </div>

      <div className="tw:shrink-0 tw:text-right">
        <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400">
          {order._isCod ? "Collect COD" : "Prepaid"}
        </p>
        <p
          className={`tw:text-2xl tw:font-bold ${
            order._isCod ? "tw:text-emerald-700" : "tw:text-slate-400"
          }`}
        >
          {order._codAmountLbl}
        </p>
      </div>
    </div>
  );
}
