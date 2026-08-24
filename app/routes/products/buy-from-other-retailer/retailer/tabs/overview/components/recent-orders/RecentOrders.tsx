import clsx from "clsx";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./DesktopView";
import { getData } from "./helper";
import MobileView from "./MobileView";

type RecentOrdersProps = {
  /** Retailer (seller) whose recent orders with the logged-in user are shown. */
  retailerId?: string;
  className?: string;
};

/**
 * "Recent orders" — the newest few orders exchanged with this retailer, as a
 * read-only recap. Everything else (filters, export, load more) lives in the
 * Orders tab, which the header links to.
 */
const RecentOrders = ({ retailerId, className }: RecentOrdersProps) => {
  const { isMobile } = useScreenView();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!retailerId) {
      setOrders([]);
      return;
    }

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await getData(retailerId);
        if (active) setOrders(result || []);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [retailerId]);

  // The page reads its active tab from the URL, so switching is a param write.
  const openOrders = () => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "orders");
    setSearchParams(next, { preventScrollReset: true });
  };

  if (!loading && orders.length === 0) {
    return null;
  }

  return (
    // Desktop: header and list are one card (the wrapper carries the surface,
    // the children go flat). Mobile: the header is a plain band on the page bg
    // and only the list keeps a surface, so they need the gap between them.
    <div
      className={clsx(
        "tw:space-y-2 tw:md:space-y-0 tw:md:overflow-hidden tw:md:rounded-2xl tw:md:bg-white tw:md:shadow-sm tw:md:ring-1 tw:md:ring-slate-200/70",
        className,
      )}
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:md:border-b tw:md:border-slate-100 tw:md:px-4 tw:md:py-3">
        <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-baseline tw:gap-x-2">
          <h2 className="tw:text-[0.9375rem] tw:font-bold tw:text-slate-900">
            Recent orders
          </h2>
          <span className="tw:text-[11px] tw:text-gray-400">last 5</span>
        </div>
        <button
          type="button"
          onClick={openOrders}
          className="tw:shrink-0 tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          All orders →
        </button>
      </div>

      {isMobile ? (
        <MobileView data={orders} loading={loading} />
      ) : (
        <DesktopView data={orders} loading={loading} />
      )}
    </div>
  );
};

export default RecentOrders;
export type { RecentOrdersProps };
