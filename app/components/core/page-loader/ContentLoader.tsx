import clsx from "clsx";
import { Skeleton } from "~/components/ui/skeleton";

interface ContentLoaderProps {
  /** How many card-shaped placeholders to stack. */
  cards?: number;
  /** Body lines inside each card. */
  lines?: number;
  className?: string;
}

/**
 * In-flow loading placeholder for a routed section — cards that echo the shape
 * of the content that is about to land, instead of a full-screen overlay that
 * hides the page around it.
 */
const ContentLoader = ({
  cards = 2,
  lines = 3,
  className,
}: ContentLoaderProps) => (
  <div
    className={clsx("tw:flex tw:flex-col tw:gap-3", className)}
    role="status"
    aria-busy="true"
    aria-label="Loading"
  >
    {Array.from({ length: cards }).map((_, cardIndex) => (
      <div
        key={cardIndex}
        className="tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-3"
      >
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <Skeleton className="tw:h-3 tw:w-32" />
          <Skeleton className="tw:h-3 tw:w-16" />
        </div>

        <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2">
          {Array.from({ length: lines }).map((_, lineIndex) => (
            <Skeleton
              key={lineIndex}
              className={clsx(
                "tw:h-9",
                lineIndex === lines - 1 ? "tw:w-2/3" : "tw:w-full",
              )}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default ContentLoader;
