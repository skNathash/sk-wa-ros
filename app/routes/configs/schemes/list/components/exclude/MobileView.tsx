import ImgRender from "~/components/core/img/ImgRender";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { PencilLine, Phone, MapPin } from "lucide-react";
import AppLink from "~/components/core/link/AppLink";

const MobileView = ({
  data = [],
  loading = false,
  callback,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
  removingId = null,
}: {
  data: any[];
  loading: boolean;
  callback: (args: { action: string; data?: any }) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
  loadedCount: number;
  removingId?: string | null;
}) => {
  if (loading) {
    return (
      <div className="tw:p-4 tw:text-center tw:flex tw:items-center tw:justify-center tw:min-h-64">
        <div className="tw:text-gray-500 tw:font-medium">Loading...</div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="tw:p-4 tw:text-center tw:flex tw:items-center tw:justify-center tw:min-h-64">
        <NoData />
      </div>
    );
  }

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-3 tw:gap-2">
        {data.map((item) => (
          <AppCard
            key={item.id || item._id}
            className="tw:flex tw:flex-col"
            noPadding
          >
            <div className="tw:p-3">
              <div className="tw:flex tw:flex-1 tw:justify-between tw:gap-2">
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:flex tw:items-center tw:flex-wrap tw:gap-x-2 tw:gap-y-1">
                    <div className="tw:font-medium tw:text-xs tw:text-gray-900">
                      <AppLink
                        asLink
                        href={`/dashboard/network/view/b2b/${
                          item.id || item._id
                        }`}
                        showLinkColor
                      >
                        {item.name || item._displayName}
                      </AppLink>
                    </div>
                    <span className="tw:px-1.5 tw:py-0.5 tw:text-[8px] tw:font-bold tw:bg-red-50 tw:text-red-500 tw:border tw:border-red-100 tw:rounded tw:uppercase tw:tracking-wider tw:shrink-0">
                      Excluded
                    </span>
                  </div>
                  <div className="tw:text-[10px] tw:text-gray-400">
                    Ref:{" "}
                    <span className="tw:font-mono">
                      {item.refId || item.id || item._id || "-"}
                    </span>
                  </div>
                  {item.mobile && (
                    <div className="tw:text-[10px] tw:font-semibold tw:text-primary/70 tw:flex tw:items-center tw:gap-1">
                      <Phone size={10} className="tw:shrink-0 tw:opacity-70" />
                      {item.mobile}
                    </div>
                  )}
                </div>

                <AppButton
                  size="small"
                  color="danger"
                  fill="outline"
                  isLoading={removingId === (item.id || item._id)}
                  disabled={removingId !== null}
                  onClick={() => callback({ action: "remove", data: item })}
                >
                  Remove
                </AppButton>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {showLoadMore && !loading && data.length > 0 && (
        <div className="tw:text-center tw:mt-3">
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
