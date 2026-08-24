import clsx from "clsx";
import { Clock, MessageCircle } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";
import { getPartyTypeBadgeClass } from "../helper";

type Props = {
  type: "payables" | "receivables";
  data: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  loadMore: () => void;
  pagination: PaginationState;
  onPay: (item: any) => void;
  onNotify: (item: any) => void;
};

// Rotating avatar tints so consecutive rows read as distinct contacts, echoing
// the WhatsApp chat-list look of the reference design.
const AVATAR_TINTS = [
  "tw:bg-teal-100 tw:text-teal-700",
  "tw:bg-emerald-100 tw:text-emerald-700",
  "tw:bg-sky-100 tw:text-sky-700",
  "tw:bg-amber-100 tw:text-amber-700",
  "tw:bg-rose-100 tw:text-rose-700",
  "tw:bg-violet-100 tw:text-violet-700",
];

const getInitial = (name?: string) => (name?.trim()?.[0] || "?").toUpperCase();

const MobileView = ({
  type,
  data,
  loading,
  loadingMore,
  hasMoreData,
  loadMore,
  pagination,
  onPay,
  onNotify,
}: Props) => {
  const isPayables = type === "payables";
  // Ledger vocabulary: from the store owner's side, a payable is money they
  // still have to hand over, a receivable is money coming back to them.
  const directionLabel = isPayables ? "You'll pay" : "You'll get";
  const actionLabel = isPayables ? "Pay" : "Collect";
  const notifyLabel = isPayables ? "Notify" : "Remind";

  const SkeletonLoader = () => (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="tw:bg-white tw:rounded-2xl tw:border tw:border-gray-200 tw:px-3.5 tw:py-3.5"
        >
          <div className="tw:flex tw:items-center tw:gap-3">
            <Skeleton className="tw:h-11 tw:w-11 tw:rounded-full tw:shrink-0" />
            <div className="tw:flex-1 tw:min-w-0">
              <Skeleton className="tw:h-4 tw:w-32 tw:mb-2" />
              <Skeleton className="tw:h-3 tw:w-24" />
            </div>
            <Skeleton className="tw:h-6 tw:w-16 tw:shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) return <SkeletonLoader />;
  if (data.length === 0) return <NoData />;

  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-2.5">
        {data.map((item: any, index: number) => {
          const ageLabel = item.ageLabel;

          return (
            <div
              key={item._id}
              className="tw:bg-white tw:rounded-2xl tw:border tw:border-gray-200 tw:px-3.5 tw:pt-3.5 tw:pb-2.5 tw:shadow-sm hover:tw:border-gray-300 hover:tw:shadow-md tw:transition-[border-color,box-shadow] tw:duration-200"
            >
              <div className="tw:flex tw:items-center tw:gap-3">
                <div
                  className={clsx(
                    "tw:w-11 tw:h-11 tw:rounded-full tw:shrink-0 tw:flex tw:items-center tw:justify-center tw:text-base tw:font-bold",
                    AVATAR_TINTS[index % AVATAR_TINTS.length],
                  )}
                >
                  {getInitial(item.name)}
                </div>

                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:flex tw:items-start tw:gap-1.5">
                    {item.redirectionUrl && item.redirectionUrl !== "#" ? (
                      <AppLink
                        asLink
                        href={item.redirectionUrl}
                        className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:break-words hover:tw:text-primary tw:transition-colors"
                      >
                        {item.name}
                      </AppLink>
                    ) : (
                      <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:break-words">
                        {item.name}
                      </h3>
                    )}
                    <span
                      className={clsx(
                        "tw:shrink-0 tw:mt-0.5 tw:rounded-full tw:border tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide",
                        getPartyTypeBadgeClass(item.type),
                      )}
                    >
                      {item.partyLabel}
                    </span>
                  </div>
                  {item.ageDate && (
                    <div className="tw:flex tw:items-center tw:gap-2.5 tw:mt-1 tw:text-xs tw:text-gray-500">
                      <span className="tw:inline-flex tw:items-center tw:gap-1">
                        <Clock
                          size={12}
                          aria-hidden
                          className="tw:text-gray-400"
                        />
                        <DateFormat
                          value={item.ageDate}
                          formatStr="dd MMM yyyy"
                        />
                      </span>
                      {ageLabel && (
                        <span className="tw:text-gray-400">{ageLabel}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="tw:flex tw:flex-col tw:items-end tw:shrink-0">
                  <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
                    {directionLabel}
                  </span>
                  <Amount
                    value={item.outstandingAmount}
                    decimalPlaces={2}
                    className={clsx(
                      "tw:text-lg tw:font-bold tw:leading-tight",
                      isPayables ? "amount-out" : "amount-in",
                    )}
                  />
                </div>
              </div>

              {/* Actions anchor opposite ends of the footer so the row spans
                  the full card width instead of leaving the left half blank. */}
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-2.5 tw:pt-2.5 tw:border-t tw:border-gray-100">
                <button
                  type="button"
                  onClick={() => onNotify(item)}
                  aria-label="Send WhatsApp reminder"
                  className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-[#25d366]/10 tw:text-[#0f7a37] tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold hover:tw:bg-[#25d366]/20 tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[#25d366]/50 tw:focus-visible:ring-offset-1"
                >
                  <MessageCircle size={15} />
                  {notifyLabel}
                </button>
                <button
                  type="button"
                  onClick={() => onPay(item)}
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary tw:text-white tw:px-4 tw:py-1.5 tw:text-xs tw:font-semibold tw:shadow-sm hover:tw:opacity-90 tw:transition-opacity tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-primary/50 tw:focus-visible:ring-offset-1"
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-3">
          <LoadMoreButton
            loadMore={loadMore}
            loadedCount={data.length}
            loading={loadingMore}
            totalCount={pagination.totalRecords}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
