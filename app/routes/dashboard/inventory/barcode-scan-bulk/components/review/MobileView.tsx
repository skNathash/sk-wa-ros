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
import MatchingBadge from "./MatchingBadge";
import ScanItemActions from "~/shared/inventory/components/scan-item-actions/ScanItemActions";
import {
  dealImageProps,
  type ReviewItem,
} from "../../helper";

interface ReviewViewProps {
  items: ReviewItem[];
  /** Barcodes whose remove request is in flight. */
  removing?: Set<string>;
  onSkSuggestions: (item: ReviewItem) => void;
  onCreateProduct: (item: ReviewItem) => void;
  onRemove: (barcode: string) => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}

/**
 * The card's status presentation. Colours and labels come straight from the
 * item's match badge (`item.badge`) so the status itself never changes — this
 * only makes it prominent: a larger icon-led pill. The icons mirror the match
 * summary above the list (Store = SK catalog, Sparkles = SK AI, AlertCircle =
 * no match), so a row's status reads as part of the same tally.
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
      label: "Already requested",
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
  barcode: string;
  removing?: boolean;
  onRemove: (barcode: string) => void;
}> = ({ barcode, removing, onRemove }) => (
  <AppButton
    fill="clear"
    color="danger"
    size="small"
    title="Remove"
    className="tw:shrink-0 tw:text-gray-300 tw:hover:text-red-600 tw:hover:bg-red-50"
    isLoading={removing}
    onClick={() => onRemove(barcode)}
  >
    <Trash2 className="tw:w-4 tw:h-4" />
  </AppButton>
);

/** Shimmer placeholder card shown while a scanned barcode is still being matched. */
const PendingCard: React.FC<{
  barcode: string;
  removing?: boolean;
  onRemove: (barcode: string) => void;
}> = ({ barcode, removing, onRemove }) => (
  <li className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white">
    <span className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-1 tw:bg-violet-300" />
    <div className="tw:flex tw:items-start tw:gap-3 tw:py-2.5 tw:pl-4 tw:pr-2.5">
      <div className="tw:w-14 tw:h-14 tw:rounded-lg skeleton-loader tw:shrink-0" />
      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:flex tw:items-start tw:gap-2">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:h-3.5 tw:w-3/4 tw:rounded skeleton-loader" />
            <div className="tw:h-3 tw:w-1/2 tw:rounded skeleton-loader tw:mt-2" />
          </div>
          <RemoveButton barcode={barcode} removing={removing} onRemove={onRemove} />
        </div>
        <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2">
          <MatchingBadge />
          <span className="tw:inline-flex tw:items-center tw:gap-1 tw:font-mono tw:text-[10px] tw:text-gray-400">
            <Barcode className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
            {barcode}
          </span>
        </div>
      </div>
    </div>
  </li>
);

const MobileView: React.FC<ReviewViewProps> = ({
  items,
  removing,
  onSkSuggestions,
  onCreateProduct,
  onRemove,
  onImagePreview,
}) => {
  return (
    <ul className="tw:flex tw:flex-col tw:gap-2">
      {items.map((item) => {
        if (item.matchStatus === "Pending") {
          return (
            <PendingCard
              key={item.barcode}
              barcode={item.barcode}
              removing={removing?.has(item.barcode)}
              onRemove={onRemove}
            />
          );
        }
        const deal = item.deal;
        const status = statusMeta(item);
        // Actions only render for AI/not-found rows that still need a decision —
        // SK-catalog rows are done and carry no action footer.
        const showActions =
          item.status !== "Requested" &&
          ((item.skSuggestions?.length ?? 0) > 0 ||
            item.matchStatus === "FoundInAi" ||
            item.matchStatus === "NotFound");

        return (
          <li
            key={item.barcode}
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

                    {/* Right column — the seller's price + count, the two
                        facts read most after match status. MRP gets the bold
                        slot; qty rides beneath it. */}
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
                    {/* No action footer on this card — give the trash a home
                        here so the row stays tight instead of adding a row. */}
                    {!showActions && (
                      <RemoveButton
                        barcode={item.barcode}
                        removing={removing?.has(item.barcode)}
                        onRemove={onRemove}
                      />
                    )}
                  </div>
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
                    barcode={item.barcode}
                    removing={removing?.has(item.barcode)}
                    onRemove={onRemove}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MobileView;
