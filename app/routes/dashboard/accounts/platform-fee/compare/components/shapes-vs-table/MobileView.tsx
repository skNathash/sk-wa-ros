import clsx from "clsx";
import { Skeleton } from "~/components/ui/skeleton";
import type { CompareTableRow, ShapesVsTableData } from "./helper";

type MobileViewProps = {
  data: ShapesVsTableData | null;
  loading: boolean;
};

/** Narrow layout — the two shapes introduce themselves as a pair of cards with
    the "vs" badge on the seam, then each perk keeps both columns side by side
    under a single label so the matchup still reads across. */
const MobileView = ({ data, loading }: MobileViewProps) => {
  return (
    <div className="tw:space-y-3">
      {/* Shape cards — the pair the rest of the page compares */}
      <div className="tw:relative tw:grid tw:grid-cols-2 tw:gap-4">
        {/* Left Card - Stock */}
        <div className="tw:rounded-2xl tw:border tw:border-[#F4DCB5] tw:bg-[#FEFBF8] tw:p-3 tw:space-y-1.5">
          <span className="tw:inline-block tw:bg-[#FFF5EA] tw:text-[#A05A18] tw:text-[10px] tw:font-bold tw:px-2 tw:py-0.5 tw:rounded tw:tracking-wider tw:uppercase">
            STOCK
          </span>
          <h2 className="tw:font-serif tw:text-base tw:font-bold tw:text-[#A0520F] tw:leading-snug">
            Discoverable beyond street.
          </h2>
          {!!data?.stockCount && (
            <p className="tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-[#A05A18] tw:uppercase">
              {data.stockCount} perks
            </p>
          )}
        </div>

        {/* Center VS Badge — punched out of the seam between the two cards, so
            the white ring keeps it clear of both card edges it overlaps. */}
        <div className="tw:absolute tw:inset-y-0 tw:left-1/2 tw:z-10 tw:flex tw:-translate-x-1/2 tw:items-center tw:pointer-events-none tw:select-none">
          <span className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#1E3A8A] tw:ring-4 tw:ring-white tw:font-serif tw:text-[13px] tw:italic tw:leading-none tw:text-white">
            vs
          </span>
        </div>

        {/* Right Card - Shop */}
        <div className="tw:rounded-2xl tw:border tw:border-[#BFDBFE] tw:bg-[#F8FAFE] tw:p-3 tw:space-y-1.5 tw:text-right">
          <div className="tw:flex tw:justify-end">
            <span className="tw:inline-block tw:bg-[#EEF4FF] tw:text-[#1E40AF] tw:text-[10px] tw:font-bold tw:px-2 tw:py-0.5 tw:rounded tw:tracking-wider tw:uppercase">
              SHOP
            </span>
          </div>
          <h2 className="tw:font-serif tw:text-base tw:font-bold tw:text-[#1E3A8A] tw:leading-snug">
            2-second billing.
          </h2>
          {!!data?.shopCount && (
            <p className="tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-[#1E40AF] tw:uppercase">
              {data.shopCount} modules
            </p>
          )}
        </div>
      </div>

      {/* Perk-by-perk — one label over the two columns it compares */}
      <div className="tw:rounded-2xl tw:border tw:border-slate-200/90 tw:bg-white tw:divide-y tw:divide-slate-100 tw:overflow-hidden tw:shadow-xs">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="tw:p-3 tw:space-y-2">
                <Skeleton className="tw:h-2.5 tw:w-20" />
                <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                  <Skeleton className="tw:h-14 tw:w-full tw:rounded-lg" />
                  <Skeleton className="tw:h-14 tw:w-full tw:rounded-lg" />
                </div>
              </div>
            ))
          : data?.rows.map((row: CompareTableRow) => (
              <div key={row.key} className="tw:p-3 tw:space-y-1.5">
                {/* One label for the pair, so neither column repeats it */}
                <span className="tw:block tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#94A3B8]">
                  {row.label}
                </span>

                <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:items-stretch">
                  {/* Stock cell */}
                  <div className="tw:rounded-lg tw:border-l-[3px] tw:border-[#E59E27] tw:bg-[#FEFBF8] tw:px-2.5 tw:py-2">
                    <span
                      className={clsx(
                        "tw:text-[13px] tw:leading-snug",
                        row.stock.isQuote
                          ? "tw:font-serif tw:italic tw:text-[#2D4756]"
                          : "tw:font-medium tw:text-[#183B47]",
                      )}
                    >
                      {row.stock.text}
                    </span>
                  </div>

                  {/* Shop cell */}
                  <div className="tw:rounded-lg tw:border-l-[3px] tw:border-[#2563EB] tw:bg-[#F8FAFE] tw:px-2.5 tw:py-2">
                    <span
                      className={clsx(
                        "tw:text-[13px] tw:leading-snug",
                        row.shop.isQuote
                          ? "tw:font-serif tw:italic tw:text-[#2D4756]"
                          : "tw:font-medium tw:text-[#183B47]",
                      )}
                    >
                      {row.shop.text}
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default MobileView;
