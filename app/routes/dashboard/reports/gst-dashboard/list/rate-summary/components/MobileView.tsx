import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Amount from "~/components/core/amount/Amount";
import { ListLoader, getRateAccent } from "../../components/ui";
import type { RateRow } from "../helper";

interface Props {
  data: RateRow[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
}

const MobileView: React.FC<Props> = ({
  data,
  loading = false,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
}) => {
  if (loading) {
    return <ListLoader />;
  }

  if (data.length === 0) {
    return (
      <div className="tw:text-center tw:py-12">
        <NoData />
      </div>
    );
  }

  // Bars are scaled against the largest collected figure on screen, so the
  // longest bar always fills the track and the rest read relative to it.
  const maxCollected = Math.max(...data.map((item) => item.gstCollected), 0);

  return (
    <>
      <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:divide-y tw:divide-gray-100">
        {data.map((item, index) => {
          const accent = getRateAccent(index);
          const barWidth = maxCollected
            ? Math.max((item.gstCollected / maxCollected) * 100, 2)
            : 0;

          return (
            <div key={item.gstRate} className="tw:px-3 tw:py-3">
              <div className="tw:flex tw:items-center tw:gap-3">
                <div
                  className="tw:w-10 tw:shrink-0 tw:text-xs tw:font-bold tw:tabular-nums"
                  style={{ color: accent }}
                >
                  {item.gstRate || "0"}%
                </div>

                <div className="tw:flex-1 tw:h-1.5 tw:rounded-full tw:bg-gray-100 tw:overflow-hidden">
                  <div
                    className="tw:h-full tw:rounded-full"
                    style={{ width: `${barWidth}%`, backgroundColor: accent }}
                  />
                </div>

                <div className="tw:shrink-0 tw:text-right">
                  <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:tabular-nums">
                    <Amount value={item.netGstPayable} />
                  </div>
                  <div className="tw:text-[10px] tw:text-gray-400 tw:leading-tight">
                    net GST
                  </div>
                </div>
              </div>

              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1.5 tw:pl-13 tw:text-[11px] tw:tabular-nums">
                <span className="tw:font-semibold tw:text-emerald-600">
                  +<Amount value={item.gstCollected} />
                </span>
                <span className="tw:text-gray-400">collected</span>
                <span className="tw:text-gray-300">·</span>
                <span className="tw:font-semibold tw:text-red-600">
                  −<Amount value={item.gstInward} />
                </span>
                <span className="tw:text-gray-400">inward</span>
              </div>
            </div>
          );
        })}
      </div>

      {showLoadMore && data.length > 0 && (
        <div className="tw:py-3 tw:flex tw:justify-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </>
  );
};

export default MobileView;
