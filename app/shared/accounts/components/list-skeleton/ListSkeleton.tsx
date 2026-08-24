import clsx from "clsx";

type ListSkeletonProps = {
  /** How many placeholder rows to print; match the page size of the block. */
  rows?: number;
  /** Rows that lead with a party/customer avatar get the leading circle. */
  avatar?: boolean;
  /**
   * Blocks whose mobile read is a bare sheet bleed to the screen edges and
   * carry their own white; pass `false` when the block stays a card at every
   * width and the white is already under the rows.
   */
  bleed?: boolean;
};

/**
 * Placeholder rows for the accounts list blocks, shaped like the rows they
 * stand in for — leading avatar, a name line with a shorter meta line under
 * it, and an amount block on the right rail — so the block does not resize
 * once the read lands.
 *
 * It carries the same surface as the mobile sheet (white, bled to the screen
 * edges, hairline-ruled); from md up the block's own card supplies the white,
 * so the bleed and the outer rules drop away.
 */
const ListSkeleton = ({
  rows = 5,
  avatar = true,
  bleed = true,
}: ListSkeletonProps) => {
  return (
    <div
      className={clsx(
        "tw:divide-y tw:divide-gray-100 tw:bg-white",
        bleed &&
          "app-bleed-x tw:border-y tw:border-gray-100 tw:md:border-y-0",
      )}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="tw:flex tw:items-center tw:gap-2.5 tw:px-4 tw:py-3.5"
        >
          {avatar && (
            <div className="skeleton-loader tw:h-9 tw:w-9 tw:shrink-0 tw:rounded-full" />
          )}
          <div className="tw:min-w-0 tw:flex-1">
            <div className="skeleton-loader tw:h-3.5 tw:w-2/5" />
            <div className="skeleton-loader tw:mt-1.5 tw:h-2.5 tw:w-3/5" />
          </div>
          <div className="tw:shrink-0">
            <div className="skeleton-loader tw:h-3.5 tw:w-16" />
            <div className="skeleton-loader tw:mt-1.5 tw:ml-auto tw:h-2.5 tw:w-10" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
