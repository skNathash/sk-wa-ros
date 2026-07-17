import React from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import type { HsnRow } from "../helper";
import Amount from "~/components/core/amount/Amount";

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
    return (
      <div className="tw:p-4 tw:flex tw:items-center tw:justify-center">
        <div className="tw:text-sm tw:text-gray-600">Loading...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8">
        <NoData />
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:gap-2 tw:md:grid-cols-3">
        {data.map((item) => (
          <AppCard key={item.hsnCode} noOverflow className="tw:mb-0">
            <div aria-label={`HSN ${item.hsnCode}`}>
              {/* Header: HSN Code and Product Count */}
              <header className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:pb-2 tw:border-b tw:border-gray-200">
                <div>
                  <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:tracking-wide">
                    HSN Code
                  </div>
                  <div className="tw:text-base tw:font-bold tw:text-gray-900 tw:leading-tight">
                    <AppLink
                      asLink
                      href={`/dashboard/reports/gst-dashboard/products-level?search=${encodeURIComponent(
                        item.hsnCode
                      )}${dateFrom ? `&dateFrom=${encodeURIComponent(dateFrom)}` : ""}${dateTo ? `&dateTo=${encodeURIComponent(dateTo)}` : ""}`}
                      showLinkColor={true}
                    >
                      {item.hsnCode}
                    </AppLink>
                  </div>
                </div>

                <div className="tw:bg-blue-100 tw:text-blue-700 tw:text-xs tw:font-semibold tw:px-2 tw:py-1 tw:rounded-full tw:whitespace-nowrap">
                  {item.products} Items
                </div>
              </header>

              {/* GST Data Grid - Compact 2 columns */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:mt-2">
                <div>
                  <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                    Collected
                  </div>
                  <div className="tw:font-semibold tw:text-green-600 tw:text-sm tw:leading-tight">
                    <Amount value={item.gstCollected} />
                  </div>
                </div>

                <div>
                  <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                    Inward
                  </div>
                  <div className="tw:font-semibold tw:text-orange-600 tw:text-sm tw:leading-tight">
                    <Amount value={item.gstInward} />
                  </div>
                </div>
              </div>

              {/* Net GST - Full width highlight */}
              <div className="tw:mt-2 tw:pt-2 tw:border-t tw:border-gray-200 tw:bg-blue-50 tw:p-2 tw:rounded">
                <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                  Net Payable
                </div>
                <div className="tw:font-bold tw:text-blue-700 tw:text-sm">
                  <Amount value={item.netGstPayable} />
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {showLoadMore && data.length > 0 && (
        <div className="tw:mt-4 tw:flex tw:justify-center tw:pb-6">
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
