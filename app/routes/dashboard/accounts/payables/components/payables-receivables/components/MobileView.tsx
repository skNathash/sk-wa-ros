import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";

type Props = {
  type: "payables" | "receivables";
  data: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  loadMore: () => void;
  pagination: PaginationState;
};

const MobileView = ({
  type,
  data,
  loading,
  loadingMore,
  hasMoreData,
  loadMore,
  pagination,
}: Props) => {
  const SkeletonLoader = () => (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className={clsx(
            "tw:p-3 tw:rounded-lg tw:border tw:bg-white tw:shadow-sm",
            "tw:flex tw:justify-between tw:items-center tw:gap-3",
            type === "payables"
              ? "tw:border-[color:var(--wa-domain-out)]/20"
              : "tw:border-[color:var(--wa-domain-in)]/20"
          )}
        >
          <div className="tw:flex-1 tw:min-w-0">
            <Skeleton className="tw:h-5 tw:w-32 tw:mb-2" />
            <Skeleton className="tw:h-4 tw:w-24" />
          </div>
          <div className="tw:text-right tw:shrink-0">
            <Skeleton className="tw:h-6 tw:w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return <SkeletonLoader />;
  if (data.length === 0) return <NoData />;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
      {data.map((item: any) => (
        <div
          key={item._id}
          className={clsx(
            "tw:p-3 tw:rounded-lg tw:border tw:bg-white tw:shadow-sm tw:transition-all",
            "tw:flex tw:justify-between tw:items-center tw:gap-3",
            type === "payables"
              ? "tw:border-[color:var(--wa-domain-out)]/20 hover:tw:border-[color:var(--wa-domain-out)]/40"
              : "tw:border-[color:var(--wa-domain-in)]/20 hover:tw:border-[color:var(--wa-domain-in)]/40"
          )}
        >
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:items-center tw:gap-2">
              {item.redirectionUrl && item.redirectionUrl !== "#" ? (
                <AppLink
                  asLink
                  href={item.redirectionUrl}
                  className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate hover:tw:text-blue-600 tw:transition-colors"
                >
                  {item.name}
                </AppLink>
              ) : (
                <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:truncate">
                  {item.name}
                </h3>
              )}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:truncate">
              {item.partyLabel}
            </div>
            {item.date && (
              <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                Since <DateFormat value={item.date} formatStr="dd MMM yyyy" />
              </div>
            )}
          </div>
          <div className="tw:text-right tw:shrink-0">
            <Amount
              value={item.outstandingAmount}
              decimalPlaces={2}
              className={clsx(
                "wa-amount tw:text-base tw:font-bold",
                type === "payables"
                  ? "tw:text-[color:var(--wa-domain-out)]"
                  : "tw:text-[color:var(--wa-domain-in)]"
              )}
            />
          </div>
        </div>
      ))}

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-2">
          <LoadMoreButton
            loadMore={loadMore}
            loadedCount={data.length}
            loading={loadingMore}
            totalCount={pagination.totalRecords}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
