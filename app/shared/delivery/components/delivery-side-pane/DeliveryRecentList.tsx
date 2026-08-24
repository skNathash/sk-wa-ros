import clsx from "clsx";
import { ChevronRight, PackageCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import useAppNav from "~/hooks/useAppNav";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import { getRecentDeliveryOrders } from "./helper";

export type DeliveryRecentType = "dispatch" | "in-transit";

/** What each list is called and where "view all" lands — the rest is shared. */
const TYPES: Record<
  DeliveryRecentType,
  { label: string; empty: string; icon: typeof Truck }
> = {
  dispatch: {
    label: "Recent to Dispatch",
    empty: "Nothing waiting to go out",
    icon: PackageCheck,
  },
  "in-transit": {
    label: "Recent In Transit",
    empty: "Nothing on the road",
    icon: Truck,
  },
};

interface DeliveryRecentListProps {
  /** Which delivery stage to list — decides the status filter and the labels. */
  type: DeliveryRecentType;
  /** How many rows to show. */
  limit?: number;
  className?: string;
}

/**
 * The newest orders sitting in one delivery stage, as a side-pane list. One
 * component serves both stages: `type` picks the status filter (the same one
 * that stage's page runs) and the wording. A row opens the order; the header
 * link opens the full stage list.
 */
const DeliveryRecentList = ({
  type,
  limit = 5,
  className,
}: DeliveryRecentListProps) => {
  const appNav = useAppNav();

  const [orders, setOrders] = useState<any[]>();

  useEffect(() => {
    let cancelled = false;

    setOrders(undefined);
    getRecentDeliveryOrders(type, limit)
      .then((result) => {
        if (!cancelled) setOrders(result || []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [type, limit]);

  const { label, empty, icon: Icon } = TYPES[type];
  const loading = !orders;

  return (
    <div className={className}>
      {/* Header — what the list is, and the way through to all of it. */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <p className="app-pane-label">
          {label}
        </p>
        <button
          type="button"
          onClick={() => appNav.to(`/dashboard/delivery/${type}`, { tab: type })}
          className="tw:flex tw:cursor-pointer tw:items-center tw:gap-0.5 tw:px-1 tw:text-[11px] tw:font-semibold tw:text-slate-500 tw:hover:text-slate-900"
        >
          View all
          <ChevronRight size={12} />
        </button>
      </div>

      <div className="tw:mt-1.5 tw:flex tw:flex-col tw:gap-1.5">
        {loading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`delivery-recent-skeleton-${index}`}
              className="skeleton-loader tw:h-12 tw:rounded-xl"
            />
          ))}

        {!loading && orders.length === 0 && (
          <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-3 tw:text-xs tw:text-slate-400">
            <Icon size={14} className="tw:shrink-0" />
            {empty}
          </div>
        )}

        {!loading &&
          orders.map((item) => {
            const name = item.customerInfo?.name || "-";
            const shipping = item?.invoices?.[0]?.shippingDetails;
            const rider = shipping?.name;

            return (
              <button
                key={item._id}
                type="button"
                onClick={() =>
                  appNav.to(`/dashboard/orders/view/${item.orderId}`)
                }
                className={clsx(
                  "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-2 tw:rounded-xl tw:px-2 tw:py-1.5 tw:text-left",
                  "tw:transition-colors tw:hover:bg-slate-50",
                )}
              >
                <InitialsAvatar name={name} size={28} />

                <div className="tw:min-w-0 tw:flex-1">
                  <p className="tw:truncate tw:text-xs tw:font-bold tw:text-slate-900">
                    {item.orderRefNo}
                  </p>
                  <p className="tw:truncate tw:text-[11px] tw:text-slate-500">
                    {/* In transit the rider is the fact that matters; before
                        dispatch there is none yet, so the customer stands in. */}
                    {type === "in-transit" && rider ? rider : name}
                  </p>
                </div>

                <div className="tw:shrink-0 tw:text-right">
                  <span className="app-amount tw:block tw:text-xs tw:font-bold tw:tabular-nums tw:text-slate-900">
                    <Amount
                      value={
                        item.isKcStore
                          ? item.coinsRedeemedValue
                          : item._payableAmt
                      }
                    />
                  </span>
                  <span className="tw:block tw:whitespace-nowrap tw:text-[10px] tw:text-slate-400">
                    <DateFormat value={item.orderedDate} formatStr="dd MMM" />
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default DeliveryRecentList;
