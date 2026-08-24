import React from "react";
import { Box, Trash2 } from "lucide-react";

import useTheme from "~/hooks/useTheme";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import MatchingBadge from "./MatchingBadge";
import ScanItemActions from "~/shared/inventory/components/scan-item-actions/ScanItemActions";
import SubscribeAction from "./SubscribeAction";
import { BarcodeChip, QtyChip, StatusChip, statusMeta } from "./ItemChips";
import { dealImageProps, type ReviewItem } from "../../helper";

interface ReviewViewProps {
  items: ReviewItem[];
  /** Barcodes whose remove request is in flight. */
  removing?: Set<string>;
  onSkSuggestions: (item: ReviewItem) => void;
  onCreateProduct: (item: ReviewItem) => void;
  onRemove: (barcode: string) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
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
  className: string;
  onRemove: (barcode: string) => void;
}> = ({ barcode, removing, className, onRemove }) => (
  <li className={className}>
    <span className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-1 tw:bg-violet-300" />
    <div className="tw:flex tw:items-start tw:gap-3 tw:py-3 tw:pl-4 tw:pr-2.5">
      <div className="tw:w-14 tw:h-14 tw:rounded-xl skeleton-loader tw:shrink-0" />
      <div className="tw:flex-1 tw:min-w-0">
        <div className="tw:flex tw:items-start tw:gap-2">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:h-3.5 tw:w-3/4 tw:rounded skeleton-loader" />
            <div className="tw:h-3 tw:w-1/2 tw:rounded skeleton-loader tw:mt-2" />
          </div>
          <RemoveButton
            barcode={barcode}
            removing={removing}
            onRemove={onRemove}
          />
        </div>
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:mt-2">
          <MatchingBadge />
          <BarcodeChip barcode={barcode} />
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
  const isTheme2 = useTheme() === "theme-2";

  // theme-2 mobile: the list is one white sheet running edge to edge
  // (`app-bleed-x` pulls it out of the page gutter), rows separated by a
  // hairline instead of floating as gapped cards. Other themes keep the cards.
  const listClass = isTheme2
    ? "app-bleed-x tw:flex tw:flex-col tw:divide-y tw:divide-gray-100 tw:border-y tw:border-gray-200 tw:bg-white"
    : "tw:flex tw:flex-col tw:gap-2";
  const cardClass = isTheme2
    ? "tw:relative tw:overflow-hidden tw:bg-white"
    : "tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white";

  return (
    <ul className={listClass}>
      {items.map((item) => {
        if (item.matchStatus === "Pending") {
          return (
            <PendingCard
              key={item.id || item.barcode}
              barcode={item.barcode}
              removing={removing?.has(item.barcode)}
              className={cardClass}
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
          <li key={item.id || item.barcode} className={cardClass}>
            <span
              className={`tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:w-1 ${status.dot}`}
            />

            {/* The image is the only thing in the left column — everything
                else (title, chips, status, price and actions) shares one text
                column so their left edges line up down the card. */}
            <div className="tw:flex tw:items-start tw:gap-3 tw:py-3 tw:pl-4 tw:pr-2.5">
              <div className="tw:flex tw:items-center tw:justify-center tw:w-14 tw:h-14 tw:rounded-xl tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
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

              <div className="tw:flex tw:flex-col tw:gap-2 tw:flex-1 tw:min-w-0">
                <div className="tw:flex tw:items-start tw:gap-2.5">
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:leading-snug">
                      {deal?.title || (
                        <span className="tw:text-gray-400 tw:italic tw:font-normal">
                          No match found
                        </span>
                      )}
                    </div>
                    {deal?.brandName && (
                      <div className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:truncate tw:mt-0.5">
                        {deal.brandName}
                      </div>
                    )}
                  </div>

                  {/* The trash lives with the title so it never competes with
                        the row's primary action down in the footer. */}
                  <RemoveButton
                    barcode={item.barcode}
                    removing={removing?.has(item.barcode)}
                    onRemove={onRemove}
                  />
                </div>

                {/* Which code is this, how many did we scan, and where did it
                      match? One wrapping chip group so the status pill keeps
                      the barcode chip's left edge instead of starting its own
                      column. */}
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
                  <BarcodeChip barcode={item.barcode} />
                  {item.qty > 0 && <QtyChip qty={item.qty} />}
                  <StatusChip item={item} />
                </div>

                {/* Money on the left, the decision on the right. */}
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:flex-wrap">
                  {deal && deal.mrp > 0 ? (
                    <div className="tw:flex tw:items-baseline tw:gap-1">
                      <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
                        MRP
                      </span>
                      <Amount
                        value={deal.mrp}
                        className="tw:text-[15px] tw:font-bold tw:text-gray-900"
                      />
                    </div>
                  ) : (
                    <span className="tw:text-[11px] tw:text-gray-400">
                      No price yet
                    </span>
                  )}

                  {showActions && (
                    <ScanItemActions
                      item={item}
                      className="tw:shrink-0"
                      onCreateProduct={onCreateProduct}
                      onSkSuggestions={onSkSuggestions}
                    />
                  )}

                  {/* SK-catalog rows carry their own subscribe action — nothing
                        to create, so the decision is right here on the row. */}
                  <SubscribeAction item={item} className="tw:shrink-0" />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default MobileView;
