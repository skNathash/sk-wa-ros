import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PurchaseOrderCard from "./PurchaseOrderCard";

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
}: {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
}) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  // `app-bleed-x` (theme-2 mobile) pulls the list out of the page gutter so the
  // rows run edge to edge as one continuous feed; on desktop it falls back to
  // the usual 3-up card grid.
  return (
    <>
      <div className="app-bleed-x tw:overflow-hidden tw:rounded-2xl tw:bg-card tw:shadow-sm tw:divide-y tw:divide-border/60 tw:md:grid tw:md:grid-cols-3 tw:md:gap-3 tw:md:divide-y-0 tw:md:bg-transparent tw:md:shadow-none tw:md:rounded-none tw:md:overflow-visible">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="tw:animate-pulse tw:px-4 tw:py-2.5">
                <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-4 tw:flex-1 tw:rounded tw:bg-muted" />
                  <div className="tw:h-4 tw:w-16 tw:rounded tw:bg-muted" />
                </div>
                <div className="tw:mb-2 tw:flex tw:items-center tw:gap-2">
                  <div className="tw:h-3 tw:w-1/2 tw:rounded tw:bg-muted" />
                  <div className="tw:ms-auto tw:h-3 tw:w-20 tw:rounded tw:bg-muted" />
                </div>
                <div className="tw:h-3 tw:w-2/5 tw:rounded tw:bg-muted" />
              </div>
            ))
          : data.map((item, idx) => (
              <PurchaseOrderCard key={item._id || idx} item={item} />
            ))}
      </div>

      {showLoadMore && !loading && data.length > 0 && (
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
