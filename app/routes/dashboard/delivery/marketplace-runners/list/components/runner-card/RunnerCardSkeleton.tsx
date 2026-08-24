interface RunnerCardSkeletonProps {
  /** How many placeholder cards to print; match the page size of the grid. */
  count?: number;
}

/**
 * Placeholder cards for the marketplace runners grid, shaped like
 * `RunnerCard` — the avatar with the name and rating line beside it, the
 * figures row, the location line and the two action buttons — so the grid
 * does not resize once the runners land.
 */
export default function RunnerCardSkeleton({
  count = 8,
}: RunnerCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-2.5 tw:shadow-sm"
        >
          <div className="tw:flex tw:items-center tw:gap-2.5">
            <div className="skeleton-loader tw:h-9 tw:w-9 tw:shrink-0 tw:rounded-full" />

            <div className="tw:min-w-0 tw:flex-1">
              <div className="skeleton-loader tw:h-3 tw:w-1/2" />
              <div className="skeleton-loader tw:mt-1.5 tw:h-2.5 tw:w-4/5" />
            </div>
          </div>

          <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:bg-slate-100/70 tw:px-2.5 tw:py-2">
            <div className="skeleton-loader tw:h-2 tw:w-12" />
            <div className="skeleton-loader tw:h-2 tw:w-10" />
            <div className="skeleton-loader tw:h-2 tw:w-14" />
          </div>

          <div className="skeleton-loader tw:h-2.5 tw:w-3/5" />

          <div className="tw:grid tw:grid-cols-2 tw:gap-1.5">
            <div className="skeleton-loader tw:h-8 tw:rounded-lg" />
            <div className="skeleton-loader tw:h-8 tw:rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}
