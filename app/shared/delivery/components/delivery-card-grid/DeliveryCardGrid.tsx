import clsx from "clsx";
import type { ReactNode } from "react";
import NoData from "~/components/core/no-data/NoData";

interface DeliveryCardGridProps {
  /** Rendered once there is data — one card per record. */
  children?: ReactNode;
  /** True while the first page is loading; swaps the cards for skeletons. */
  loading?: boolean;
  /** True when the loaded page came back empty. */
  empty?: boolean;
  /** How many skeleton cards to hold the grid open with. */
  skeletonCount?: number;
  className?: string;
}

/** One card per order, one column on phones and three on desktop. */
const GRID_CLASS = "tw:grid tw:grid-cols-1 tw:lg:grid-cols-3 tw:gap-3";

/**
 * The shell every delivery list shares in theme-2: the same card grid on phone
 * and desktop (so a single card component covers both), plus the skeleton and
 * empty states that go with it. Pages hand it their cards; it owns nothing but
 * the layout.
 */
const DeliveryCardGrid = ({
  children,
  loading = false,
  empty = false,
  skeletonCount = 6,
  className,
}: DeliveryCardGridProps) => {
  if (loading) {
    return (
      <div className={clsx(GRID_CLASS, className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div
            key={`delivery-card-skeleton-${index}`}
            className="tw:animate-pulse tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-3"
          >
            <div className="tw:flex tw:items-start tw:gap-3">
              <div className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-xl tw:bg-slate-200"></div>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:h-4 tw:w-32 tw:rounded tw:bg-slate-200"></div>
                <div className="tw:mt-2 tw:h-3 tw:w-40 tw:rounded tw:bg-slate-200"></div>
              </div>
              <div className="tw:h-5 tw:w-24 tw:shrink-0 tw:rounded-full tw:bg-slate-200"></div>
            </div>
            <div className="tw:mt-4 tw:space-y-2">
              <div className="tw:h-3 tw:w-full tw:rounded tw:bg-slate-200"></div>
              <div className="tw:h-3 tw:w-3/4 tw:rounded tw:bg-slate-200"></div>
            </div>
            <div className="tw:mt-4 tw:h-8 tw:w-full tw:rounded-lg tw:bg-slate-200"></div>
          </div>
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white">
        <NoData />
      </div>
    );
  }

  return <div className={clsx(GRID_CLASS, className)}>{children}</div>;
};

export default DeliveryCardGrid;
