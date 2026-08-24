import clsx from "clsx";
import { Skeleton } from "~/components/ui/skeleton";
import type { CompareTableRow, ShapesVsTableData } from "./helper";

type DesktopViewProps = {
  data: ShapesVsTableData | null;
  loading: boolean;
};

/** Wide layout — the two shapes sit in columns with a "vs" gutter, and every
    perk reads across as one row. */
const DesktopView = ({ data, loading }: DesktopViewProps) => {
  return (
    <div className="tw:rounded-3xl tw:border tw:border-slate-200/90 tw:bg-white tw:overflow-hidden tw:shadow-xs">
      {/* Top Banner / VS Header */}
      <div className="tw:grid tw:grid-cols-12 tw:items-stretch tw:border-b tw:border-slate-100">
        {/* Left Column - Stock */}
        <div className="tw:col-span-5 tw:bg-[#FEFBF8] tw:p-5 tw:space-y-2">
          <span className="tw:inline-block tw:bg-[#FFF5EA] tw:text-[#A05A18] tw:text-[11px] tw:font-bold tw:px-2.5 tw:py-1 tw:rounded-md tw:tracking-wider tw:uppercase">
            STOCK · GO LIVE
          </span>
          <h2 className="tw:font-serif tw:text-xl tw:font-bold tw:text-[#A0520F] tw:leading-snug">
            Your inventory, discoverable beyond the street.
          </h2>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
            {!!data?.stockCount && (
              <span className="tw:inline-block tw:bg-[#FFFBF5] tw:text-[#92400E] tw:border tw:border-[#F4DCB5] tw:text-xs tw:font-medium tw:px-2.5 tw:py-0.5 tw:rounded-md">
                {data.stockCount} perks
              </span>
            )}
          </div>
        </div>

        {/* Center VS Indicator */}
        <div className="tw:flex tw:col-span-2 tw:bg-white tw:items-center tw:justify-center tw:p-4">
          <span className="tw:font-serif tw:italic tw:text-3xl tw:text-slate-300 tw:font-normal">
            vs
          </span>
        </div>

        {/* Right Column - Shop */}
        <div className="tw:col-span-5 tw:bg-[#F8FAFE] tw:p-5 tw:space-y-2 tw:text-right">
          <div className="tw:flex tw:justify-end">
            <span className="tw:inline-block tw:bg-[#EEF4FF] tw:text-[#1E40AF] tw:text-[11px] tw:font-bold tw:px-2.5 tw:py-1 tw:rounded-md tw:tracking-wider tw:uppercase">
              SHOP · COUNTER
            </span>
          </div>
          <h2 className="tw:font-serif tw:text-xl tw:font-bold tw:text-[#1E3A8A] tw:leading-snug">
            Your counter, running in 2 seconds per bill.
          </h2>
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:justify-end">
            {!!data?.shopCount && (
              <span className="tw:inline-block tw:bg-[#F8FAFC] tw:text-[#1E40AF] tw:border tw:border-[#BFDBFE] tw:text-xs tw:font-medium tw:px-2.5 tw:py-0.5 tw:rounded-md">
                {data.shopCount} modules
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Row-by-Row Comparison Table */}
      <div className="tw:divide-y tw:divide-slate-100">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="tw:grid tw:grid-cols-12 tw:items-stretch"
              >
                <div className="tw:col-span-5 tw:bg-[#FEFBF8] tw:px-5 tw:py-2.5">
                  <Skeleton className="tw:h-4 tw:w-3/4" />
                </div>
                <div className="tw:col-span-2 tw:bg-white tw:px-3 tw:py-2.5 tw:flex tw:justify-center">
                  <Skeleton className="tw:h-3 tw:w-20" />
                </div>
                <div className="tw:col-span-5 tw:bg-[#F8FAFE] tw:px-5 tw:py-2.5 tw:flex tw:justify-end">
                  <Skeleton className="tw:h-4 tw:w-3/4" />
                </div>
              </div>
            ))
          : data?.rows.map((row: CompareTableRow) => (
              <div
                key={row.key}
                className="tw:grid tw:grid-cols-12 tw:items-stretch tw:text-sm"
              >
                {/* Left Content (Stock) */}
                <div className="tw:col-span-5 tw:bg-[#FEFBF8] tw:px-5 tw:py-2.5 tw:flex tw:items-center tw:text-slate-700 tw:leading-relaxed">
                  <span
                    className={clsx(
                      row.stock.isQuote
                        ? "tw:font-serif tw:italic tw:text-[#2D4756]"
                        : "tw:font-medium tw:text-[#183B47]",
                    )}
                  >
                    {row.stock.text}
                  </span>
                </div>

                {/* Center Header / Row Key */}
                <div className="tw:col-span-2 tw:bg-white tw:px-3 tw:py-2 tw:flex tw:items-center tw:justify-center tw:text-center">
                  <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#64748B]">
                    {row.label}
                  </span>
                </div>

                {/* Right Content (Shop) */}
                <div className="tw:col-span-5 tw:bg-[#F8FAFE] tw:px-5 tw:py-2.5 tw:flex tw:items-center tw:justify-end tw:text-slate-700 tw:leading-relaxed tw:text-right">
                  <span
                    className={clsx(
                      row.shop.isQuote
                        ? "tw:font-serif tw:italic tw:text-[#2D4756]"
                        : "tw:font-medium tw:text-[#183B47]",
                    )}
                  >
                    {row.shop.text}
                  </span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default DesktopView;
