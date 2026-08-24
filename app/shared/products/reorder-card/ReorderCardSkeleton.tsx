import clsx from "clsx";

interface ReorderCardSkeletonProps {
  /** Number of placeholder rows to render. */
  count?: number;
  className?: string;
}

/**
 * Placeholder rows for lists built out of `ReorderCard` (variant="list").
 * The metrics mirror the real row — 44px tile, name / price / meta lines and
 * the trailing action pill — so the feed doesn't jump when data arrives.
 */
const ReorderCardSkeleton = ({
  count = 8,
  className,
}: ReorderCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`reorder-card-skeleton-${idx}`}
          className={clsx(
            "tw:flex tw:w-full tw:items-center tw:gap-3 tw:p-3 tw:border-b tw:border-slate-100 tw:last:border-b-0 tw:animate-pulse",
            className,
          )}
        >
          <div className="tw:h-11 tw:w-11 tw:shrink-0 tw:rounded-xl tw:bg-slate-100" />

          <div className="tw:min-w-0 tw:flex-1">
            {/* Product name */}
            <div className="tw:h-3.5 tw:w-3/5 tw:rounded tw:bg-slate-100" />

            {/* Price / MRP / tag line */}
            <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
              <div className="tw:h-3.5 tw:w-12 tw:rounded tw:bg-slate-100" />
              <div className="tw:h-3 tw:w-14 tw:rounded tw:bg-slate-100" />
              <div className="tw:h-3 tw:w-10 tw:rounded-md tw:bg-slate-100" />
            </div>

            {/* stock • vsl • prev meta */}
            <div className="tw:mt-2 tw:h-2.5 tw:w-4/5 tw:rounded tw:bg-slate-100" />
          </div>

          <div className="tw:h-8 tw:w-16 tw:shrink-0 tw:rounded-full tw:bg-slate-100" />
        </div>
      ))}
    </>
  );
};

export default ReorderCardSkeleton;
