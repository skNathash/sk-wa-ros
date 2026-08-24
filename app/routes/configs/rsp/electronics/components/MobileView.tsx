import clsx from "clsx";
import { AlertTriangle, Check } from "lucide-react";
import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import CommonService from "~/services/CommonService";
import InlinePriceEdit, {
  type InlinePriceResult,
} from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import type { ElectronicsRow } from "../helper";

/**
 * Mobile price watch: an alert card summarising how many SKUs are losing to
 * online, then the stacked SKU rows. Owns its own skeletons, empty state and
 * load-more so the screen just picks a layout.
 *
 * Each row is the product line plus a four-up tile row putting the editable
 * CLUB price beside the three marketplace benchmarks — the price is edited
 * where it is read, with no drill-in. A row losing to online carries a rose
 * footer strip saying by how much, plus the one-tap match.
 */
const MobileView: React.FC<{
  data: ElectronicsRow[];
  loading?: boolean;
  /** SKUs priced above their cheapest online listing, across the loaded rows. */
  aboveCount: number;
  forced?: Record<string, { price: number; token: number }>;
  onPriceResult: (result: InlinePriceResult) => void;
  onMatch: (row: ElectronicsRow) => void;
  /** Pencil in the price tile — opens the full price config modal. */
  onEdit: (row: ElectronicsRow) => void;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}> = ({
  data,
  loading = false,
  aboveCount,
  forced = {},
  onPriceResult,
  onMatch,
  onEdit,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-gray-100">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="tw:animate-pulse tw:bg-white tw:p-4">
            <div className="tw:h-4 tw:w-2/3 tw:rounded tw:bg-gray-200" />
            <div className="tw:mt-2 tw:h-8 tw:w-full tw:rounded tw:bg-gray-100" />
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
      {aboveCount > 0 && (
        <div className="tw:mb-3 tw:rounded-2xl tw:bg-indigo-600 tw:px-4 tw:py-4 tw:text-white">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/70">
            CLUB app · price alert
          </div>
          <div className="tw:mt-1.5 tw:text-xl tw:font-bold tw:leading-tight">
            {aboveCount} {aboveCount === 1 ? "SKU is" : "SKUs are"} priced above
            online
          </div>
          <div className="tw:mt-1 tw:text-[13px] tw:leading-snug tw:text-white/85">
            Customers comparing on CLUB see a cheaper price on Amazon or
            Flipkart. Match them to win the sale.
          </div>
        </div>
      )}

      <div className="tw:mb-2">
        <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          Electronics · price watch
        </div>
        <div className="tw:text-[13px] tw:text-gray-500">
          Your CLUB price vs Amazon · Flipkart · Others
        </div>
      </div>

      {/* Bled out of the page gutter so the sheet runs edge to edge, the way
          the price sheet's mobile rows do. */}
      <div className="app-bleed-x tw:bg-white">
        {data.map((row) => {
          const losing = row._tone === "above";

          return (
            <div
              key={row._id || row.id}
              className="tw:border-b tw:border-gray-100 tw:bg-white tw:px-4 tw:py-3"
            >
              <div className="tw:flex tw:items-start tw:gap-3">
                <span
                  className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:text-[11px] tw:font-bold tw:text-white"
                  style={{ backgroundColor: row._monogramColor }}
                >
                  {row._monogram}
                </span>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-[15px] tw:leading-tight tw:font-semibold tw:text-gray-900">
                    {row.name}
                  </div>
                  <div className="tw:mt-1 tw:truncate tw:text-[11px] tw:text-gray-500">
                    {row._mobileMeta}
                  </div>
                </div>
              </div>

              {/* Four-up: your price (editable) against the three marketplaces. */}
              <div className="tw:mt-2.5 tw:grid tw:grid-cols-4 tw:gap-1.5">
                <InlinePriceEdit
                  dealId={row._id}
                  type="b2c"
                  price={row.b2cPrice || 0}
                  force={forced[row._id]}
                  invalid={losing}
                  callback={onPriceResult}
                  onEdit={() => onEdit(row)}
                  label="You"
                  aria-label={`CLUB price for ${row.name}`}
                  className="tw:min-w-0"
                  inputClassName="tw:text-center tw:text-[13px]"
                />

                {row._partners.map((partner) => (
                  <div
                    key={partner.key}
                    className="tw:min-w-0 tw:flex tw:flex-col tw:items-stretch"
                  >
                    <span className="tw:mb-0.5 tw:text-center tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
                      {partner.short}
                    </span>
                    <span
                      className={clsx(
                        "tw:rounded-lg tw:px-1 tw:py-2 tw:text-center tw:text-[13px] tw:font-bold tw:tabular-nums",
                        partner.cellClass,
                        partner.isLowest
                          ? partner.lowestClass
                          : "tw:text-gray-600",
                      )}
                    >
                      {partner.compact}
                    </span>
                  </div>
                ))}
              </div>

              {/* Verdict strip — the reason to act, and the action itself. */}
              {losing ? (
                <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:rounded-lg tw:bg-red-50 tw:px-2.5 tw:py-2">
                  <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-medium tw:text-red-600">
                    <AlertTriangle size={13} className="tw:shrink-0" />
                    <span className="tw:truncate">
                      {row._aboveLabel} · {row._lowestOnlineName}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onMatch(row)}
                    className="tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:bg-red-600 tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-bold tw:text-white"
                  >
                    Match ₹{CommonService.formattedAmount(row._lowestOnline, 0)}
                  </button>
                </div>
              ) : row._isWinning ? (
                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-emerald-50 tw:px-2.5 tw:py-1.5 tw:text-[11px] tw:font-semibold tw:text-emerald-700">
                  <Check size={13} />
                  Winning · cheapest online is {row._lowestOnlineName}
                </div>
              ) : null}
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
