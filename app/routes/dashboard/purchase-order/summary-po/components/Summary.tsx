import React from "react";
import Amount from "~/components/core/amount/Amount";
import CommonService from "~/services/CommonService";
import type { PoSummaryCounts, PoSummarySlice } from "../helper";

type Props = {
  data?: PoSummaryCounts;
  loading?: boolean;
};

type Tile = {
  key: "storeKing" | "localVendor" | "stockAdded";
  label: string;
};

const tiles: Tile[] = [
  { key: "storeKing", label: "Network" },
  { key: "localVendor", label: "Vendor" },
  { key: "stockAdded", label: "Stock Added" },
];

const emptySlice: PoSummarySlice = { count: 0, value: 0 };

/** "LAST 30D" for short windows, "LAST 3M" once the range runs into months. */
const rangeLabel = (days?: number) => {
  if (!days) return "ALL TIME";
  if (days <= 45) return `LAST ${days}D`;
  return `LAST ${Math.round(days / 30)}M`;
};

/**
 * Purchase summary hero — total spend across the active filter window, split
 * by where the stock came from (SK network, local vendors, manual stock
 * additions). Same card on mobile and desktop; it only gets roomier at lg,
 * where the split tiles move beside the headline instead of below it.
 */
const Summary: React.FC<Props> = ({ data, loading }) => {
  const total = data?.total ?? emptySlice;

  return (
    <section className="app-bleed-x tw:relative tw:mb-4 tw:overflow-hidden tw:rounded-none tw:md:rounded-2xl tw:bg-linear-to-br tw:from-teal-800 tw:via-teal-700 tw:to-emerald-600 tw:px-4 tw:py-5 tw:md:px-6 tw:md:py-6 tw:shadow-sm">
      {/* Soft highlight so the flat gradient reads as a lit surface. */}
      <div
        aria-hidden
        className="tw:pointer-events-none tw:absolute tw:-right-16 tw:-top-20 tw:h-56 tw:w-56 tw:rounded-full tw:bg-white/10 tw:blur-2xl"
      />

      <div className="tw:relative tw:flex tw:flex-col tw:gap-5 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between tw:lg:gap-8">
        <div className="tw:min-w-0">
          <p className="tw:text-[10px] tw:md:text-xs tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-white/70">
            All Purchases · {rangeLabel(data?.rangeDays)}
          </p>

          {loading ? (
            <div className="tw:mt-2 tw:h-9 tw:md:h-11 tw:w-48 tw:rounded tw:bg-white/20 tw:animate-pulse" />
          ) : (
            <p className="tw:mt-1.5 tw:text-3xl tw:md:text-4xl tw:font-bold tw:leading-none tw:tracking-tight tw:text-white">
              <Amount value={total.value} />
            </p>
          )}

          <p className="tw:mt-2 tw:text-xs tw:md:text-sm tw:text-white/75">
            {loading ? " " : `${total.count} orders`} · Marketplace, vendors,
            &amp; stock additions
          </p>
        </div>

        <div className="tw:grid tw:grid-cols-3 tw:gap-2.5 tw:md:gap-3 tw:lg:w-104 tw:lg:shrink-0">
          {tiles.map((tile) => {
            const slice = data?.[tile.key] ?? emptySlice;
            return (
              <div
                key={tile.key}
                className="tw:rounded-xl tw:bg-white/12 tw:px-3 tw:py-2.5 tw:md:px-4 tw:md:py-3 tw:ring-1 tw:ring-white/15"
              >
                <p className="tw:truncate tw:text-[10px] tw:md:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/70">
                  {tile.label}
                </p>
                {loading ? (
                  <>
                    <div className="tw:mt-1.5 tw:h-5 tw:w-8 tw:rounded tw:bg-white/20 tw:animate-pulse" />
                    <div className="tw:mt-1.5 tw:h-3 tw:w-12 tw:rounded tw:bg-white/15 tw:animate-pulse" />
                  </>
                ) : (
                  <>
                    <p className="tw:mt-1 tw:text-xl tw:md:text-2xl tw:font-bold tw:leading-none tw:text-white">
                      {slice.count}
                    </p>
                    <p className="tw:mt-1 tw:text-[11px] tw:md:text-xs tw:text-white/70">
                      {CommonService.formatCompact(slice.value)}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Summary;
