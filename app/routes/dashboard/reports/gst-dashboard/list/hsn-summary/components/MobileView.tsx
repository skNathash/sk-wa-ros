import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppLink from "~/components/core/link/AppLink";
import Amount from "~/components/core/amount/Amount";
import { SectionLabel, ListLoader } from "../../components/ui";
import type { HsnRow } from "../helper";

interface Props {
  data: HsnRow[];
  loading?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount: number;
  dateFrom?: string | null;
  dateTo?: string | null;
}

const MobileView: React.FC<Props> = ({
  data,
  loading = false,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount,
  dateFrom,
  dateTo,
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

  return (
    <>
      <SectionLabel>HSN codes</SectionLabel>

      <div className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:divide-y tw:divide-gray-100">
        {data.map((item) => (
          <div
            key={item.hsnCode}
            aria-label={`HSN ${item.hsnCode}`}
            className="tw:px-3 tw:py-3"
          >
            <div className="tw:flex tw:items-center tw:gap-3">
              <AppLink
                asLink
                href={`/dashboard/reports/gst-dashboard/products-level?search=${encodeURIComponent(
                  item.hsnCode,
                )}${dateFrom ? `&dateFrom=${encodeURIComponent(dateFrom)}` : ""}${dateTo ? `&dateTo=${encodeURIComponent(dateTo)}` : ""}`}
              >
                <span className="tw:inline-flex tw:items-center tw:justify-center tw:shrink-0 tw:rounded-lg tw:bg-violet-100 tw:text-violet-700 tw:text-xs tw:font-bold tw:tabular-nums tw:px-2.5 tw:py-1.5">
                  {item.hsnCode}
                </span>
              </AppLink>

              <div className="tw:flex-1 tw:min-w-0 tw:text-xs tw:text-gray-500 tw:truncate">
                {item.products} items
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

            <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1.5 tw:text-[11px] tw:tabular-nums">
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
        ))}
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
