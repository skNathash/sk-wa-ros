import React from "react";
import {
  AlertCircle,
  Barcode,
  Box,
  CircleCheck,
  Clock,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import ScanItemActions from "~/shared/inventory/components/scan-item-actions/ScanItemActions";
import {
  dealImageProps,
  type ReviewItem,
} from "../helper";

interface MobileViewProps {
  items: ReviewItem[];
  loading?: boolean;
  loadedCount: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  onCreateProduct: (item: ReviewItem) => void;
  onSkSuggestions: (item: ReviewItem) => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
  onRemove: (item: ReviewItem) => void;
  removingKey?: string | null;
}

/**
 * The card's status presentation — mirrors the barcode-scan-bulk review card so
 * a scanned row reads the same in history as it did at review time. Colours and
 * labels come from the item's match badge (`item.badge`); the icons echo the
 * match summary (Store = SK catalog, Sparkles = SK AI, AlertCircle = no match).
 */
type StatusMeta = {
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  dot: string;
  label: string;
  subLabel?: string;
};

function statusMeta(item: ReviewItem): StatusMeta {
  if (item.status === "Requested") {
    return {
      Icon: Clock,
      bg: "tw:bg-amber-50",
      text: "tw:text-amber-700",
      dot: "tw:bg-amber-400",
      label: "Sent for approval",
      subLabel: "SK catalog team is reviewing",
    };
  }
  if (item.deal?.isSubscribed) {
    return {
      Icon: CircleCheck,
      bg: "tw:bg-gray-100",
      text: "tw:text-gray-600",
      dot: "tw:bg-gray-400",
      label: "Already Subscribed",
    };
  }
  const Icon =
    item.matchStatus === "FoundInSk"
      ? Store
      : item.matchStatus === "FoundInAi"
        ? Sparkles
        : AlertCircle;
  return {
    Icon,
    bg: item.badge.bg,
    text: item.badge.text,
    dot: item.badge.dot,
    label: item.badge.label,
    subLabel: item.badge.subLabel,
  };
}

/** Ghost trash button shared by every card. */
const RemoveButton: React.FC<{
  removing?: boolean;
  onRemove: () => void;
}> = ({ removing, onRemove }) => (
  <AppButton
    fill="clear"
    color="danger"
    size="small"
    title="Remove"
    className="tw:shrink-0 tw:text-gray-300 tw:hover:text-red-600 tw:hover:bg-red-50"
    isLoading={removing}
    onClick={onRemove}
  >
    <Trash2 className="tw:w-4 tw:h-4" />
  </AppButton>
);

const MobileView: React.FC<MobileViewProps> = ({
  items,
  loading = false,
  loadedCount,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  onCreateProduct,
  onSkSuggestions,
  onImagePreview,
  onRemove,
  removingKey = null,
}) => {
  if (!loading && items.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-2.5">
      <ul className="tw:flex tw:flex-col tw:gap-2">
        {items.map((item, index) => {
          const deal = item.deal;
          const status = statusMeta(item);
          const removing = removingKey === (item.id || item.barcode);
          const isRequested = item.status === "Requested";
          // Actions only render for AI/not-found rows that still need a
          // decision — SK-catalog and already-requested rows are done.
          const showActions =
            !isRequested &&
            ((item.skSuggestions?.length ?? 0) > 0 ||
              item.matchStatus === "FoundInAi" ||
              item.matchStatus === "NotFound");

          return (
            <li
              key={`${item.id || item.barcode}-${index}`}
              className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white"
            >
              <span
                className={`tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-1 ${status.dot}`}
              />

              <div className="tw:py-2.5 tw:pl-4 tw:pr-2.5">
                <div className="tw:flex tw:items-start tw:gap-3">
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
                    {deal?.image ? (
                      <button
                        type="button"
                        onClick={() =>
                          onImagePreview?.(
                            deal?.images || (deal?.image ? [deal.image] : []),
                            deal?.image,
                            item.matchStatus === "FoundInAi",
                          )
                        }
                        className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
                      >
                        <ImgRender
                          {...dealImageProps(deal.image)}
                          alt={deal.title}
                          className="tw:max-h-14 tw:max-w-14 tw:object-contain"
                          useProxy={item.matchStatus === "FoundInAi"}
                        />
                      </button>
                    ) : (
                      <Box size={22} className="tw:text-gray-300" />
                    )}
                  </div>

                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-start tw:gap-2.5">
                      <div className="tw:flex-1 tw:min-w-0">
                        <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:leading-snug">
                          {deal?.title || (
                            <span className="tw:text-gray-400 tw:italic">
                              No match found
                            </span>
                          )}
                        </div>
                        <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:mt-1 tw:text-[10px] tw:text-gray-500">
                          {deal?.brandName && (
                            <span className="tw:font-medium tw:text-gray-600">
                              {deal.brandName}
                            </span>
                          )}
                          {deal?.brandName && (
                            <span className="tw:text-gray-300">·</span>
                          )}
                          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-mono">
                            <Barcode className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
                            {item.barcode}
                          </span>
                        </div>
                      </div>

                      {/* Right column — MRP + qty, the two facts read most
                          after match status. MRP gets the bold slot. */}
                      {(Boolean(deal && deal.mrp > 0) || item.qty > 0) && (
                        <div className="tw:shrink-0 tw:text-right tw:leading-none">
                          {deal && deal.mrp > 0 && (
                            <>
                              <div className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
                                MRP
                              </div>
                              <Amount
                                value={deal.mrp}
                                className="tw:text-[15px] tw:font-semibold tw:text-gray-900"
                              />
                            </>
                          )}
                          {item.qty > 0 && (
                            <div className="tw:text-[10px] tw:font-medium tw:text-gray-500 tw:tabular-nums tw:mt-0.5">
                              Qty {item.qty}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mt-2">
                      <span
                        className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:px-2.5 tw:py-1.5 ${status.bg}`}
                      >
                        <status.Icon
                          className={`tw:w-4 tw:h-4 tw:shrink-0 ${status.text}`}
                        />
                        <span className="tw:flex tw:flex-col tw:leading-tight tw:text-left">
                          <span
                            className={`tw:text-xs tw:font-bold ${status.text}`}
                          >
                            {status.label}
                          </span>
                          {status.subLabel && (
                            <span className="tw:text-[10px] tw:font-medium tw:text-gray-500">
                              {status.subLabel}
                            </span>
                          )}
                        </span>
                      </span>
                      {/* No action footer + not requested — give the trash a
                          home here so the row stays tight. */}
                      {!showActions && !isRequested && (
                        <RemoveButton
                          removing={removing}
                          onRemove={() => onRemove(item)}
                        />
                      )}
                    </div>

                    {item.createdAt && (
                      <div className="tw:text-[10px] tw:text-gray-500 tw:mt-1.5">
                        Scanned:{" "}
                        <DateFormat
                          value={item.createdAt}
                          formatStr="dd MMM yyyy, hh:mm a"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {showActions && (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2.5">
                    <ScanItemActions
                      item={item}
                      align="start"
                      className="tw:flex-1"
                      onCreateProduct={onCreateProduct}
                      onSkSuggestions={onSkSuggestions}
                    />
                    <RemoveButton
                      removing={removing}
                      onRemove={() => onRemove(item)}
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {showLoadMore && !loading && items.length > 0 ? (
        <div className="tw:text-center tw:py-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      ) : null}
    </div>
  );
};

export default MobileView;
