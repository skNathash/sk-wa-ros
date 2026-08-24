import clsx from "clsx";
import { Layers, Sparkles } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Checkbox } from "~/components/ui/checkbox";
import CommonService from "~/services/CommonService";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import {
  PRICE_COMPARISON_DISTANCE,
  type PeerRange,
  type PriceGroupColumn,
} from "../helper";
import GroupFocusPrice from "./GroupFocusPrice";
import GroupPriceChips from "./GroupPriceChips";
import PeerRangeBar from "./PeerRangeBar";

interface MobileViewProps {
  data: any[];
  type: "network" | "customer";
  callback: (args: { action: string; data?: any; event?: any }) => void;
  /** Outcome of an inline price edit — the row is patched by the host. */
  onPriceResult?: (result: InlinePriceResult) => void;
  loading?: boolean;
  /** Buyer groups to show a price card for (B2B only). */
  priceGroups?: PriceGroupColumn[];
  /**
   * Set when the group filter has narrowed the sheet to a single buyer group —
   * the row then collapses to that group's price instead of the deal price and
   * the run of group cards.
   */
  focusGroup?: PriceGroupColumn | null;
  selectedIds: Set<string>;
  onSelectChange: (item: any, checked: boolean) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

type MarginTone = "high" | "mid" | "low";

// Same banding as the desktop sheet's margin column (set in the row helper).
const MARGIN_TONE: Record<MarginTone, string> = {
  high: "tw:bg-emerald-50 tw:text-emerald-700",
  mid: "tw:bg-amber-50 tw:text-amber-700",
  low: "tw:bg-red-50 tw:text-red-700",
};

// Same banding without the plate — the group-focused row states the deal's
// margin as a caption rather than a badge.
const MARGIN_TEXT_TONE: Record<MarginTone, string> = {
  high: "tw:text-emerald-700",
  mid: "tw:text-amber-600",
  low: "tw:text-red-600",
};

/**
 * Price sheet — mobile. One stacked row per product: identity on top (image,
 * name, the MRP / HSN / GST meta line), then a full-width pricing block — the
 * price line with its margin badge, weekly sales, the buyer-group cards and the
 * peer range bar shared with the desktop sheet. The pricing block sits beside
 * the thumbnail's column rather than under it, so it runs the full card width.
 *
 * Tapping the price chip opens the price editor; the rest of the row opens the
 * item detail.
 */
const MobileView: React.FC<MobileViewProps> = ({
  data,
  type,
  callback,
  onPriceResult,
  loading = false,
  priceGroups = [],
  focusGroup = null,
  selectedIds,
  onSelectChange,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  if (loading) {
    return (
      <div className="app-bleed-x tw:flex tw:flex-col">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="tw:animate-pulse tw:border-b tw:border-gray-200 tw:bg-white tw:px-4 tw:py-3"
          >
            <div className="tw:h-4 tw:w-2/3 tw:rounded tw:bg-gray-200" />
            <div className="tw:mt-2 tw:h-3 tw:w-1/2 tw:rounded tw:bg-gray-100" />
            <div className="tw:mt-3 tw:h-3 tw:w-full tw:rounded tw:bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      {/* `app-bleed-x` pulls the list out of the page gutter, so each card is a
          full-bleed band — square sides, its own 1rem inner padding, and a
          single hairline separating one row from the next. */}
      <div className="app-bleed-x tw:flex tw:flex-col">
        {data.map((item) => {
          const id = item._id || item.id;
          const selected = selectedIds.has(id);
          const price = type === "network" ? item.b2bPrice : item.b2cPrice;
          const marginTone = (item._marginTone as MarginTone) || "low";
          // Units sold in the trailing week, same field the item detail and
          // velocity views read.
          const sold7d = item.salesAnalytics?.last7Days?.quantity || 0;

          // Whether a B2B scheme is running against this deal right now.
          const schemeRunning = item.b2bScheme?.status === "Running";
          const schemeDiscount = item.b2bScheme?.offerDiscount || 0;

          // B2B-only pricing config: how many quantity slabs the deal carries.
          // The chip is the way into the slab modal on mobile, where there is
          // no room for the desktop sheet's action row.
          const isB2B = type === "network";
          const slabCount = item._priceSlab?.slab?.length || 0;
          const slabOn = !!item._priceSlab?.isAvailable && slabCount > 0;

          // The row opens the product, not a config modal — the price itself
          // is edited in place below.
          const openDeal = () => callback({ action: "viewDeal", data: item });

          // Group filter down to one group: the row states what the product
          // cost and what this group pays for it, and nothing else — the
          // comparison the full row is built for has only one column left.
          if (isB2B && focusGroup) {
            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={openDeal}
                onKeyDown={(e) => {
                  if (e.key === "Enter") openDeal();
                }}
                className={clsx(
                  "tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:border-b tw:px-4 tw:py-3",
                  selected
                    ? "tw:border-emerald-300 tw:bg-emerald-50"
                    : "tw:border-gray-200 tw:bg-white",
                )}
              >
                <span
                  onClick={(e) => e.stopPropagation()}
                  className="tw:inline-flex"
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={(checked) =>
                      onSelectChange(item, checked === true)
                    }
                    aria-label={`Select ${item.name}`}
                    className="tw:border-gray-400 tw:data-[state=checked]:border-emerald-600 tw:data-[state=checked]:bg-emerald-600"
                  />
                </span>

                <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:overflow-hidden tw:rounded-sm tw:border tw:border-gray-100 tw:bg-white">
                  <ImgRender
                    assetId={item.images?.[0]}
                    alt={item.name}
                    className="tw:h-full tw:w-full tw:object-contain"
                  />
                </div>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-sm tw:font-medium tw:text-gray-900">
                    {item.name}
                  </div>

                  {/* What the stock cost is the number a group price is judged
                      against, so it replaces the MRP / HSN / GST line here. */}
                  <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:text-[11px] tw:text-gray-500">
                    {item.brand?.name && <span>{item.brand.name}</span>}
                    {item.brand?.name && (
                      <span className="tw:text-gray-300">·</span>
                    )}
                    <span>
                      you paid{" "}
                      <Amount
                        value={item.purchasePrice || 0}
                        decimalPlaces={0}
                      />
                    </span>
                  </div>
                </div>

                <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
                  <GroupFocusPrice
                    deal={item}
                    group={focusGroup}
                    onPriceResult={onPriceResult}
                    onEdit={(group) =>
                      callback({
                        action: "editGroupPrice",
                        data: { ...item, _group: group },
                      })
                    }
                  />

                  {/* The deal's own B2B margin — the baseline every group
                      starts from, and what an unpriced group is running at. */}
                  <span
                    className={clsx(
                      "tw:text-[11px] tw:font-semibold",
                      MARGIN_TEXT_TONE[marginTone],
                    )}
                    title="Margin on the deal's B2B price"
                  >
                    {item._discountType === "Fixed"
                      ? "Fixed price"
                      : `${item._marginLabel} margin`}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={id}
              role="button"
              tabIndex={0}
              onClick={openDeal}
              onKeyDown={(e) => {
                if (e.key === "Enter") openDeal();
              }}
              className={clsx(
                "tw:flex tw:cursor-pointer tw:items-start tw:gap-2 tw:border-b tw:px-4 tw:py-3",
                selected
                  ? "tw:border-emerald-300 tw:bg-emerald-50"
                  : "tw:border-gray-200 tw:bg-white",
              )}
            >
              <span
                onClick={(e) => e.stopPropagation()}
                className="tw:inline-flex tw:pt-1"
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) =>
                    onSelectChange(item, checked === true)
                  }
                  aria-label={`Select ${item.name}`}
                  className="tw:border-gray-400 tw:data-[state=checked]:border-emerald-600 tw:data-[state=checked]:bg-emerald-600"
                />
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:items-start tw:gap-2">
                  <div className="tw:h-10 tw:w-10 tw:shrink-0 tw:overflow-hidden tw:rounded-sm tw:border tw:border-gray-100 tw:bg-white">
                    <ImgRender
                      assetId={item.images?.[0]}
                      alt={item.name}
                      className="tw:h-full tw:w-full tw:object-contain"
                    />
                  </div>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:truncate tw:text-sm tw:font-medium tw:text-gray-900">
                      {item.name}
                    </div>

                    <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:text-[11px] tw:text-gray-500">
                      {item.brand?.name && <span>{item.brand.name}</span>}
                      <span className="tw:text-gray-300">·</span>
                      <span>
                        MRP <Amount value={item.mrp || 0} decimalPlaces={0} />
                      </span>
                      {item.hsn && (
                        <>
                          <span className="tw:text-gray-300">·</span>
                          <span>HSN {item.hsn}</span>
                        </>
                      )}
                      <span className="tw:text-gray-300">·</span>
                      <span>GST {item.gst || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Pricing block — a sibling of the identity row rather than a
                    child of its text column, so the price, its chips and the
                    group cards start at the card's edge instead of being
                    indented past the thumbnail. */}
                <div className="tw:mt-2">
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                    <InlinePriceEdit
                      dealId={id}
                      type={type === "network" ? "b2b" : "b2c"}
                      price={price || 0}
                      callback={onPriceResult}
                      onEdit={() => callback({ action: "edit", data: item })}
                      aria-label={`${
                        type === "network" ? "B2B" : "B2C"
                      } price for ${item.name}`}
                      className="tw:w-[104px]"
                      inputClassName="tw:text-[13px]"
                    />

                    <span
                      className={clsx(
                        "tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-medium tw:tabular-nums",
                        MARGIN_TONE[marginTone],
                      )}
                    >
                      {item._discountType === "Fixed"
                        ? "Fixed"
                        : `${item._marginLabel} mgn`}
                    </span>

                    {schemeRunning && (
                      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:bg-violet-50 tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-violet-700">
                        <Sparkles size={11} />
                        {schemeDiscount > 0
                          ? `Scheme ${CommonService.roundedByDecimalPlace(
                              schemeDiscount,
                              2,
                            )}%`
                          : "Scheme live"}
                      </span>
                    )}

                    {/* B2B sheet only — the quantity-slab config for this
                          deal, tappable straight into the slab modal. */}
                    {isB2B && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({ action: "editPriceSlab", data: item });
                        }}
                        className={clsx(
                          "tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-medium",
                          slabOn
                            ? "tw:bg-sky-50 tw:text-sky-700"
                            : "tw:bg-gray-100 tw:text-gray-500",
                        )}
                      >
                        <Layers size={11} />
                        {slabOn
                          ? `${slabCount} ${slabCount === 1 ? "slab" : "slabs"}`
                          : "Set slabs"}
                      </button>
                    )}
                  </div>

                  {sold7d > 0 && (
                    <div className="tw:mt-1.5 tw:truncate tw:text-[11px] tw:text-gray-500">
                      · sold {sold7d} in 7d
                    </div>
                  )}

                  {/* Buyer-group prices — B2B only, and only once groups are
                      configured. Same cards, colours and edit path as the
                      sheet's group columns. */}
                  {isB2B && (
                    <GroupPriceChips
                      deal={item}
                      groups={priceGroups}
                      onPriceResult={onPriceResult}
                      onEdit={(group) =>
                        callback({
                          action: "editGroupPrice",
                          data: { ...item, _group: group },
                        })
                      }
                      className="tw:mt-2"
                    />
                  )}

                  {/* Peer spread, captioned with the radius it is measured
                      over so the bar reads the same as the sheet column. */}
                  {(item._peer as PeerRange)?.hasRange && (
                    <div className="tw:mt-2">
                      <div className="tw:text-[10px] tw:font-medium tw:text-gray-500">
                        Near By Retailers ({PRICE_COMPARISON_DISTANCE}km)
                      </div>
                      <PeerRangeBar
                        peer={item._peer as PeerRange}
                        className="tw:mt-0.5 tw:w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showLoadMore && (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={totalCount}
          loadedCount={loadedCount}
        />
      )}
    </>
  );
};

export default MobileView;
