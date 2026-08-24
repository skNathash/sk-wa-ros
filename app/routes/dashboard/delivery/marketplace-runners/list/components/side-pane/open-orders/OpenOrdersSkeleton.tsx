interface OpenOrdersSkeletonProps {
  /** How many placeholder rows to print. */
  count?: number;
  className?: string;
}

/**
 * Placeholder rows for the open-orders list, shaped like `OpenOrdersList` —
 * the ref badge with the customer and drop lines beside it — so the pane does
 * not resize once the orders land.
 */
export default function OpenOrdersSkeleton({
  count = 3,
  className,
}: OpenOrdersSkeletonProps) {
  return (
    <div className={className}>
      <p className="app-pane-label">
        My open orders needing runners
      </p>

      <div className="tw:mt-1.5 tw:flex tw:flex-col tw:gap-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:bg-emerald-50 tw:px-3 tw:py-2.5"
          >
            <div className="skeleton-loader tw:size-9 tw:shrink-0 tw:rounded-lg" />

            <div className="tw:min-w-0 tw:flex-1">
              <div className="skeleton-loader tw:h-3.5 tw:w-3/5" />
              <div className="skeleton-loader tw:mt-1.5 tw:h-2.5 tw:w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
