import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { VendorReorderItem } from "../helper";
import ReorderItemCard from "./ReorderItemCard";

type Props = {
  vendorId: string;
  data: VendorReorderItem[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  onCartChange: (dealId: string, inCart: boolean) => void;
};

const MobileView = ({
  vendorId,
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  onCartChange,
}: Props) => {
  if (loading) {
    return (
      <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={`skeleton-${idx}`} className="tw:p-3">
            <Skeleton className="tw:h-16 tw:w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return <NoData />;
  }

  return (
    <>
      {/* `app-bleed-x` pulls the list out of the page gutter on theme-2 mobile
          so rows run edge to edge as one flush block. */}
      <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white">
        {data.map((item) => (
          <ReorderItemCard
            key={item.id}
            vendorId={vendorId}
            item={item}
            onCartChange={onCartChange}
          />
        ))}
      </div>

      {showLoadMore ? (
        <div className="tw:mt-2 tw:text-center">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      ) : null}
    </>
  );
};

export default MobileView;
